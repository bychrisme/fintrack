import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LocationsService {
  constructor(private prisma: PrismaService) {}

  async getCountries() {
    return this.prisma.country.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async getRegions(countryName: string) {
    if (!countryName) return [];
    
    const country = await this.prisma.country.findFirst({
      where: {
        name: {
          equals: countryName.trim(),
          mode: 'insensitive',
        },
      },
    });

    if (!country) return [];

    return this.prisma.region.findMany({
      where: { countryId: country.id },
      orderBy: { name: 'asc' },
    });
  }

  async getCities(countryName: string, regionName: string) {
    if (!countryName || !regionName) return [];

    const region = await this.prisma.region.findFirst({
      where: {
        name: {
          equals: regionName.trim(),
          mode: 'insensitive',
        },
        country: {
          name: {
            equals: countryName.trim(),
            mode: 'insensitive',
          },
        },
      },
    });

    if (!region) return [];

    return this.prisma.city.findMany({
      where: { regionId: region.id },
      orderBy: { name: 'asc' },
    });
  }
}
