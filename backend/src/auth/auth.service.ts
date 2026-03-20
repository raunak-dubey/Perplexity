import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { RegisterUserDto } from './dto/registerUser.dto';
import bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userServices: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}
  async registerUser(
    registerUserDto: RegisterUserDto,
  ): Promise<{ message: string }> {
    const saltRounds = 12;
    const hashPassword = await bcrypt.hash(
      registerUserDto.password,
      saltRounds,
    );

    // ? Create jwt token for verification and hash it
    const verificationToken = await this.jwtService.signAsync(
      { email: registerUserDto.email },
      { expiresIn: '1h' },
    );

    const hashedToken = await bcrypt.hash(verificationToken, saltRounds);

    await this.userServices.createUser({
      ...registerUserDto,
      password: hashPassword,
      verified: false,
      emailVerificationToken: hashedToken,
      emailVerificationExpires: new Date(Date.now() + 3600000),
    });

    await this.mailService.sendVerificationEmail(
      registerUserDto.email,
      verificationToken,
    );

    return {
      message: 'User registered successfully. Please verify your email',
    };
  }

  async verifyUser(token: string): Promise<{ message: string }> {
    if (!token) {
      throw new BadRequestException('Token is required');
    }
    let payload: { email: string };
    try {
      payload = await this.jwtService.verifyAsync(token);
    } catch {
      throw new BadRequestException('Invalid or expired token');
    }

    const user = await this.userServices.getUserByEmail(payload.email);
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
    if (!isMatch) {
      throw new BadRequestException('Invalid verification token');
    }

    user.verified = true;
    user.emailVerificationExpires = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    return {
      message: 'Email verified successfully. You can login now',
    };
  }
}
