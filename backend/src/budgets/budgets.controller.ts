import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Req } from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto, UpdateBudgetDto } from './dto/budget.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('budgets')
@UseGuards(JwtAuthGuard)
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Post()
  create(@Body() dto: CreateBudgetDto, @Req() req: any) {
    return this.budgetsService.create(dto, req.user.id);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.budgetsService.findAll(req.user.id);
  }

  @Get('reports')
  getReports(
    @Query('month') month: string,
    @Query('year') year: string,
    @Req() req: any,
  ) {
    const current = new Date();
    const m = month ? parseInt(month, 10) : current.getMonth() + 1;
    const y = year ? parseInt(year, 10) : current.getFullYear();
    return this.budgetsService.getBudgetReports(req.user.id, m, y);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.budgetsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBudgetDto, @Req() req: any) {
    return this.budgetsService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.budgetsService.remove(id, req.user.id);
  }
}
