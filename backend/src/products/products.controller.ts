import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(@Body() dto: CreateProductDto, @Req() req: any) {
    return this.productsService.create(dto, req.user.id);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.productsService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.productsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto, @Req() req: any) {
    return this.productsService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.productsService.remove(id, req.user.id);
  }
}
