import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { StoresService } from './stores.service';
import { CreateStoreDto, UpdateStoreDto } from './dto/store.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('stores')
@UseGuards(JwtAuthGuard)
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post()
  create(@Body() dto: CreateStoreDto, @Req() req: any) {
    return this.storesService.create(dto, req.user.id);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.storesService.findAll(req.user.id);
  }

  @Get('stats')
  getStoreStats(@Req() req: any) {
    return this.storesService.getStoreStats(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.storesService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateStoreDto, @Req() req: any) {
    return this.storesService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.storesService.remove(id, req.user.id);
  }
}
