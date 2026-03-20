import { MinLength, IsEmail, IsString } from 'class-validator';

export class RegisterUserDto {
  @IsString()
  @MinLength(3)
  username!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
