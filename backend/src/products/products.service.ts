import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateProductDto, userId: string) {
    const existing = await this.prisma.product.findUnique({
      where: {
        userId_name: {
          userId,
          name: dto.name.trim(),
        },
      },
    });

    if (existing) {
      throw new ConflictException('Un article avec ce nom existe déjà');
    }

    return this.prisma.product.create({
      data: {
        name: dto.name.trim(),
        categoryId: dto.categoryId,
        userId,
      },
      include: {
        category: true,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.product.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, userId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, userId },
      include: { category: true },
    });

    if (!product) {
      throw new NotFoundException('Article introuvable');
    }

    return product;
  }

  async update(id: string, dto: UpdateProductDto, userId: string) {
    const product = await this.findOne(id, userId);

    if (dto.name && dto.name.trim() !== product.name) {
      const existing = await this.prisma.product.findUnique({
        where: {
          userId_name: {
            userId,
            name: dto.name.trim(),
          },
        },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException('Un article avec ce nom existe déjà');
      }
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        name: dto.name ? dto.name.trim() : undefined,
        categoryId: dto.categoryId,
      },
      include: {
        category: true,
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.product.delete({
      where: { id },
    });
  }
}
