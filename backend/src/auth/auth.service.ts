import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { RegisterUserDto } from './dto/registerUser.dto';
import { LoginUserDto } from './dto/loginUser.dto';
import * as bcrypt from 'bcrypt'; // ← fix: default import fails at runtime
import { JwtService } from '@nestjs/jwt';
import { MailService } from 'src/mail/mail.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly config: ConfigService,
  ) {}

  // ─── Helpers ──────────────────────────────────────────────────────────────
  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('jwt.accessSecret'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('jwt.refreshSecret'),
        expiresIn: '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async hashAndStoreRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const hashed = await bcrypt.hash(refreshToken, 12);
    await this.usersService.updateRefreshToken(userId, hashed);
  }

  // ─── Register ─────────────────────────────────────────────────────────────

  async registerUser(
    registerUserDto: RegisterUserDto,
  ): Promise<{ message: string }> {
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(
      registerUserDto.password,
      saltRounds,
    );

    const verificationToken = await this.jwtService.signAsync(
      { email: registerUserDto.email },
      {
        secret: this.config.get<string>('jwt.accessSecret'),
        expiresIn: '1h',
      },
    );

    const hashedToken = await bcrypt.hash(verificationToken, saltRounds);
    const emailVerificationExpires = new Date(Date.now() + 3600000);

    await this.usersService.createUser({
      ...registerUserDto,
      password: hashedPassword,
      verified: false,
      emailVerificationToken: hashedToken,
      emailVerificationExpires,
    });

    await this.mailService.sendVerificationEmail(
      registerUserDto.email,
      verificationToken,
    );

    return {
      message: 'User registered successfully. Please verify your email.',
    };
  }

  // ─── Verify Email ─────────────────────────────────────────────────────────

  async verifyUser(token: string): Promise<{ message: string }> {
    if (!token) throw new BadRequestException('Token is required');

    let payload: { email: string };
    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: this.config.get<string>('jwt.accessSecret'),
      });
    } catch {
      throw new BadRequestException('Invalid or expired token');
    }

    const user = await this.usersService.getUserByEmail(payload.email);
    if (
      !user ||
      !user.emailVerificationToken ||
      !user.emailVerificationExpires
    ) {
      throw new BadRequestException('Invalid verification request');
    }

    if (user.emailVerificationExpires < new Date()) {
      throw new BadRequestException('Verification link has expired');
    }

    const isMatch = await bcrypt.compare(token, user.emailVerificationToken);
    if (!isMatch) throw new BadRequestException('Invalid verification token');

    user.verified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    return { message: 'Email verified successfully. You can login now.' };
  }

  // ─── Login ────────────────────────────────────────────────────────────────

  async loginUser(loginUserDto: LoginUserDto): Promise<{
    message: string;
    accessToken: string;
    success: true;
    refreshToken: string;
  }> {
    const { email, password } = loginUserDto;

    const user = await this.usersService.getUserByEmailWithPassword(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials. Please try again.');
    }

    if (!user.verified) {
      throw new ForbiddenException(
        'Please verify your email before logging in.',
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials. Please try again.');
    }

    const { accessToken, refreshToken } = await this.generateTokens(
      user._id.toString(),
      user.email,
    );

    await this.hashAndStoreRefreshToken(user._id.toString(), refreshToken);

    return {
      success: true,
      accessToken,
      refreshToken,
      message: 'Login successful.',
    };
  }

  // ─── Refresh Token ────────────────────────────────────────────────────────

  async refreshTokens(
    refreshToken: string,
  ): Promise<{ accessToken: string; newRefreshToken: string }> {
    let payload: { sub: string; email: string };
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.config.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const user = await this.usersService.getUserById(payload.sub);
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Invalid session. Please login again.');
    }

    const tokenMatch = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!tokenMatch) {
      await this.usersService.updateRefreshToken(user._id.toString(), null);
      throw new ForbiddenException('Invalid refresh token.');
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await this.generateTokens(user._id.toString(), user.email);

    await this.hashAndStoreRefreshToken(user._id.toString(), newRefreshToken);

    return { accessToken, newRefreshToken };
  }

  // ─── Logout ───────────────────────────────────────────────────────────────

  async logoutUser(refreshToken: string): Promise<void> {
    try {
      const payload = await this.jwtService.verifyAsync<{ sub: string }>(
        refreshToken,
        {
          secret: this.config.get<string>('jwt.refreshSecret'),
        },
      );
      await this.usersService.updateRefreshToken(payload.sub, null);
    } catch {
      // intentionally ignored
    }
  }
}
