import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class GetChangesQueryDto {
    @ApiPropertyOptional({
        description: 'ISO 8601 date — returns products changed since this time',
        example: '2026-02-28T00:00:00.000Z',
    })
    @IsOptional()
    @IsDateString()
    since?: string;

    @ApiPropertyOptional({ default: 1 })
    @IsOptional()
    @Type(() => Number)
    page?: number = 1;

    @ApiPropertyOptional({ default: 20 })
    @IsOptional()
    @Type(() => Number)
    limit?: number = 20;
}
