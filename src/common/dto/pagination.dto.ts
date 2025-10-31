import { Type } from "class-transformer";
import { IsInt, IsOptional, Min } from "class-validator";

export class PaginationDto{
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    skip: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit: number;
}