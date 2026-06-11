import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStoreDto, UpdateStoreDto } from './dto/store.dto';

@Injectable()
export class StoresService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateStoreDto, userId: string) {
    const existing = await this.prisma.store.findUnique({
      where: {
        userId_name: {
          userId,
          name: dto.name,
        },
      },
    });
    if (existing) {
      throw new ConflictException('Un magasin avec ce nom existe déjà');
    }

    return this.prisma.store.create({
      data: {
        ...dto,
        userId,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.store.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, userId: string) {
    const store = await this.prisma.store.findFirst({
      where: { id, userId },
      include: {
        invoices: {
          where: { userId },
          take: 5,
          orderBy: { date: 'desc' },
          select: { id: true, invoiceNumber: true, date: true, totalAmount: true },
        },
      },
    });
    if (!store) {
      throw new NotFoundException('Magasin introuvable');
    }
    return store;
  }

  async update(id: string, dto: UpdateStoreDto, userId: string) {
    await this.findOne(id, userId);
    if (dto.name) {
      const existing = await this.prisma.store.findUnique({
        where: {
          userId_name: {
            userId,
            name: dto.name,
          },
        },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('Un magasin avec ce nom existe déjà');
      }
    }

    return this.prisma.store.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.store.delete({
      where: { id },
    });
  }

  async getStoreStats(userId: string) {
    const stores = await this.prisma.store.findMany({
      where: { userId },
      include: {
        invoices: {
          where: { userId },
          select: {
            totalAmount: true,
            items: {
              select: {
                productName: true,
                quantity: true,
              },
            },
          },
        },
      },
    });

    return stores.map(store => {
      const invoices = store.invoices;
      const count = invoices.length;
      const totalSpent = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
      const ticketMoyen = count > 0 ? parseFloat((totalSpent / count).toFixed(2)) : 0;

      // Extract products bought
      const productCounts: Record<string, number> = {};
      invoices.forEach(inv => {
        inv.items.forEach(item => {
          productCounts[item.productName] = (productCounts[item.productName] || 0) + item.quantity;
        });
      });

      const topProducts = Object.entries(productCounts)
        .map(([name, qty]) => ({ name, quantity: qty }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      return {
        id: store.id,
        name: store.name,
        city: store.city,
        type: store.type,
        invoiceCount: count,
        totalSpent: parseFloat(totalSpent.toFixed(2)),
        ticketMoyen,
        topProducts,
      };
    }).sort((a, b) => b.totalSpent - a.totalSpent);
  }
}
