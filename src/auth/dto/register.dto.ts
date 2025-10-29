import { UserRole } from '@prisma/client';
import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, isString, IsEnum } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsOptional()
  name: string;

  @IsEnum(UserRole)
  role: UserRole;
}