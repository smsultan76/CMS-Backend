import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'try@test.test' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'test1234' })
  @IsNotEmpty()
  @IsString()
  password: string;
}