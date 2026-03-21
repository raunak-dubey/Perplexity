import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { RegisterUserDto } from './dto/registerUser.dto';
import { LoginUserDto } from './dto/loginUser.dto';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { AuthGuard } from './auth.guard';
import { UserService } from 'src/user/user.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly config: ConfigService,
  ) {}

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private get isProduction(): boolean {
    return this.config.get<string>('nodeEnv') === 'production';
  }

  private setRefreshCookie(reply: FastifyReply, token: string): void {
    reply.setCookie('refresh_token', token, {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'strict',
      path: '/auth/refresh',
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  private getRefreshToken(req: FastifyRequest): string | undefined {
    return (req.cookies as Record<string, string | undefined>)['refresh_token'];
  }

  // ─── Register ─────────────────────────────────────────────────────────────

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() registerUserDto: RegisterUserDto) {
    return this.authService.registerUser(registerUserDto);
  }

  // ─── Verify ───────────────────────────────────────────────────────────────

  @Get('verify')
  @HttpCode(HttpStatus.OK)
  verifyUser(@Query('token') token: string) {
    return this.authService.verifyUser(token);
  }

  // ─── Login ────────────────────────────────────────────────────────────────

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginUserDto: LoginUserDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const result = await this.authService.loginUser(loginUserDto);
    this.setRefreshCookie(reply, result.refreshToken);

    return {
      success: result.success,
      accessToken: result.accessToken,
      message: result.message,
    };
  }

  // ─── Refresh ──────────────────────────────────────────────────────────────

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const refreshToken = this.getRefreshToken(req);

    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    const result = await this.authService.refreshTokens(refreshToken);
    this.setRefreshCookie(reply, result.newRefreshToken);

    return { accessToken: result.accessToken };
  }

  // ─── Profile (get-me) ─────────────────────────────────────────────────────
  @UseGuards(AuthGuard)
  @Get('profile')
  async getProfile(@Req() req: FastifyRequest) {
    const reqUser = req['user'] as { sub: string };
    const user = await this.userService.getUserById(reqUser.sub);
    return user;
  }

  // ─── Logout ───────────────────────────────────────────────────────────────

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const refreshToken = this.getRefreshToken(req);
    if (refreshToken) {
      await this.authService.logoutUser(refreshToken);
    }

    reply.clearCookie('refresh_token', { path: '/auth/refresh' });
    return { message: 'Logged out successfully' };
  }
}
