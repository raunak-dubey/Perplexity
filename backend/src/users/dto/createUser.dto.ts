export class CreateUserDto {
  username!: string;
  email!: string;
  password!: string;
  verified!: boolean;
  emailVerificationToken!: string;
  emailVerificationExpires!: Date;
}
