import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { GetProductsQueryDto, GetChangesQueryDto } from './dto';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    @Get()
    @ApiOperation({ summary: 'List aggregated products with filtering & pagination' })
    findAll(@Query() query: GetProductsQueryDto) {
        return this.productsService.findAll(query);
    }

    @Get('changes')
    @ApiOperation({
        summary: 'Products with price/availability changes within a timeframe',
    })
    findChanges(@Query() query: GetChangesQueryDto) {
        return this.productsService.findChanges(query);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Single product detail with price history' })
    @ApiParam({ name: 'id', description: 'Product UUID' })
    findOne(@Param('id') id: string) {
        return this.productsService.findOne(id);
    }
}
