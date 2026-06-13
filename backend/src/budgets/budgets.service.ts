import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBudgetDto, UpdateBudgetDto } from './dto/budget.dto';

@Injectable()
export class BudgetsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateBudgetDto, userId: string) {
    const existing = await this.prisma.budget.findFirst({
      where: {
        userId,
        month: dto.month,
        year: dto.year,
        categoryId: dto.categoryId || null,
      },
    });

    if (existing) {
      throw new ConflictException('Un budget existe déjà pour cette catégorie et cette période');
    }

    return this.prisma.budget.create({
      data: {
        amount: dto.amount,
        month: dto.month,
        year: dto.year,
        categoryId: dto.categoryId || null,
        userId,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.budget.findMany({
      where: { userId },
      include: { category: true },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }

  async findOne(id: string, userId: string) {
    const budget = await this.prisma.budget.findFirst({
      where: { id, userId },
      include: { category: true },
    });
    if (!budget) {
      throw new NotFoundException('Budget introuvable');
    }
    return budget;
  }

  async update(id: string, dto: UpdateBudgetDto, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.budget.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.budget.delete({
      where: { id },
    });
  }

  async getBudgetReports(userId: string, month: number, year: number) {
    const budgets = await this.prisma.budget.findMany({
      where: { userId, month, year },
      include: { category: true },
    });

    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const reports: any[] = [];

    for (const budget of budgets) {
      let spent = 0;

      if (budget.categoryId) {
        // Sum items for this category
        const aggregates = await this.prisma.invoiceItem.aggregate({
          where: {
            categoryId: budget.categoryId,
            invoice: {
              userId,
              date: {
                gte: startDate,
                lte: endDate,
              },
            },
          },
          _sum: {
            netPrice: true,
          },
        });
        spent = aggregates._sum.netPrice || 0;
      } else {
        // Sum total invoice amounts (Global Budget)
        const aggregates = await this.prisma.invoice.aggregate({
          where: {
            userId,
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
          _sum: {
            totalAmount: true,
          },
        });
        spent = aggregates._sum.totalAmount || 0;
      }

      const spentAmount = parseFloat(spent.toFixed(2));
      const percentage = budget.amount > 0 ? parseFloat(((spentAmount / budget.amount) * 100).toFixed(2)) : 0;
      const isExceeded = spentAmount > budget.amount;
      const isWarning = percentage >= 85 && percentage <= 100;

      reports.push({
        id: budget.id,
        amount: budget.amount,
        spent: spentAmount,
        percentage,
        isExceeded,
        isWarning,
        category: budget.category ? { id: budget.category.id, name: budget.category.name, color: budget.category.color, icon: budget.category.icon } : null,
      });
    }

    return reports;
  }
}
