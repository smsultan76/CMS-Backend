import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, isString } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsOptional()
  name: string;

  @IsString()
  role: string;
}