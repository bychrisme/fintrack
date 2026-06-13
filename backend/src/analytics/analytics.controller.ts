import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  getDashboardStats(@Req() req: any) {
    return this.analyticsService.getDashboardStats(req.user.id);
  }

  @Get('kpi-details')
  getKpiDetails(@Req() req: any) {
    return this.analyticsService.getKpiDetails(req.user.id);
  }

  @Get('prices')
  comparePrices(@Query('productName') productName: string, @Req() req: any) {
    return this.analyticsService.comparePrices(req.user.id, productName || 'Lait 2L');
  }

  @Get('consumption')
  getConsumptionStats(@Req() req: any) {
    return this.analyticsService.getConsumptionStats(req.user.id);
  }

  @Get('alerts')
  getAlerts(@Req() req: any) {
    return this.analyticsService.getAlerts(req.user.id);
  }

  @Get('product-history')
  getProductHistory(@Query('productName') productName: string, @Req() req: any) {
    return this.analyticsService.getProductHistory(req.user.id, productName);
  }
}
