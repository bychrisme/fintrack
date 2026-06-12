import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Req } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto, UpdateInvoiceDto } from './dto/invoice.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  create(@Body() dto: CreateInvoiceDto, @Req() req: any) {
    return this.invoicesService.create(dto, req.user.id);
  }

  @Post('bulk-delete')
  bulkDelete(@Body('ids') ids: string[], @Req() req: any) {
    return this.invoicesService.bulkDelete(ids, req.user.id);
  }

  @Get()
  findAll(
    @Req() req: any,
    @Query('search') search?: string,
    @Query('storeId') storeId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('paymentMode') paymentMode?: string,
  ) {
    return this.invoicesService.findAll({ search, storeId, categoryId, startDate, endDate, paymentMode }, req.user.id);
  }

  @Post('ocr')
  async uploadOCR(@Req() req: any, @Body('image') imageBase64: string, @Body('filename') filename?: string) {
    if (!imageBase64) {
      return this.invoicesService.simulateOCR(filename || 'receipt.jpg');
    }
    return this.invoicesService.processOCR(imageBase64, req.user.id);
  }

  @Get('products/unique')
  getUniqueProducts(@Req() req: any) {
    return this.invoicesService.getUniqueProducts(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.invoicesService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateInvoiceDto, @Req() req: any) {
    return this.invoicesService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.invoicesService.remove(id, req.user.id);
  }
}
