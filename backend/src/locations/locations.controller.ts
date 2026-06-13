import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('locations')
@UseGuards(JwtAuthGuard)
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get('countries')
  getCountries() {
    return this.locationsService.getCountries();
  }

  @Get('regions')
  getRegions(@Query('countryName') countryName: string) {
    return this.locationsService.getRegions(countryName);
  }

  @Get('cities')
  getCities(
    @Query('countryName') countryName: string,
    @Query('regionName') regionName: string,
  ) {
    return this.locationsService.getCities(countryName, regionName);
  }
}
