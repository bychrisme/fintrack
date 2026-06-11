import { Controller, Get, Query, UseGuards, Req, Res } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('export')
  async exportReport(
    @Query('type') type: string,
    @Req() req: any,
    @Res() res: any,
  ) {
    const csv = await this.reportsService.generateCSV(type || 'expenses', req.user.id);
    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.header('Content-Disposition', `attachment; filename=gesfin-${type || 'expenses'}-report.csv`);
    return res.send(csv);
  }
}
