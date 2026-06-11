import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { StoresService } from './stores.service';
import { CreateStoreDto, UpdateStoreDto } from './dto/store.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('stores')
@UseGuards(JwtAuthGuard)
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN') // Only admins can create stores
  create(@Body() dto: CreateStoreDto) {
    return this.storesService.create(dto);
  }

  @Get()
  findAll() {
    return this.storesService.findAll();
  }

  @Get('stats')
  getStoreStats() {
    return this.storesService.getStoreStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.storesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateStoreDto) {
    return this.storesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.storesService.remove(id);
  }
}
