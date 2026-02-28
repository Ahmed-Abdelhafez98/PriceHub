import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsOptional,
    IsBoolean,
    IsNumber,
    IsString,
    Min,
} from 'class-validator';

export class GetProductsQueryDto {
    @ApiPropertyOptional({ description: 'Filter by name (partial match)' })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({ description: 'Filter by availability' })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    availability?: boolean;

    @ApiPropertyOptional({ description: 'Minimum price' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    minPrice?: number;

    @ApiPropertyOptional({ description: 'Maximum price' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    maxPrice?: number;

    @ApiPropertyOptional({
        description: 'Filter by provider (provider-a, provider-b, provider-c)',
    })
    @IsOptional()
    @IsString()
    provider?: string;

    @ApiPropertyOptional({ default: 1, description: 'Page number (1-based)' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ default: 20, description: 'Items per page' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    limit?: number = 20;
}
