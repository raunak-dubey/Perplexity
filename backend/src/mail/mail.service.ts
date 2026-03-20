import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ResendService } from 'nestjs-resend';

@Injectable()
export class MailService {
  constructor(
    private readonly resendService: ResendService,
    private readonly configService: ConfigService,
  ) {}

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const appUrl = this.configService.get<string>('app.url');
    const verifyUrl = `${appUrl}/auth/verify?token=${token}`;

    await this.resendService.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Verify your email',
      html: `
        <p>Welcome! We are glad to have you on board.</p>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${verifyUrl}">${verifyUrl}</a>
        <p>Note: This link expires in 1 hour.</p>
        <p>If you did not create an accout, please ignore this email.</p>'
        <p>Best Regards,<br />
        The Perplexity Team</p>
      `,
    });
  }
}
