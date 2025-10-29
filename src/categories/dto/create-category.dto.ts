import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Technology' })
  @IsNotEmpty()
  @IsString()
  name: string;

  // @ApiProperty({ example: 'technology', required: false })
  @IsOptional()
  @IsString()
  slug?: string;
}