import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, isString, IsEnum } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'test@test.test' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'test1234' })
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'name' })
  @IsOptional()
  name: string;

  @ApiProperty({ example: 'ADMIN' })
  @IsEnum(UserRole)
  role: UserRole;
}