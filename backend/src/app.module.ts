import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { StoresModule } from './stores/stores.module';
import { CategoriesModule } from './categories/categories.module';
import { InvoicesModule } from './invoices/invoices.module';
import { BudgetsModule } from './budgets/budgets.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ReportsModule } from './reports/reports.module';
import { ProductsModule } from './products/products.module';
import { LocationsModule } from './locations/locations.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    StoresModule,
    CategoriesModule,
    InvoicesModule,
    BudgetsModule,
    AnalyticsModule,
    ReportsModule,
    ProductsModule,
    LocationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

