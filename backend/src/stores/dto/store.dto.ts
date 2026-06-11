import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateStoreDto {
  @IsString()
  @IsNotEmpty({ message: 'Le nom du magasin est requis' })
  name: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsNotEmpty({ message: 'La ville est requise' })
  city: string;

  @IsString()
  @IsNotEmpty({ message: 'La province est requise' })
  province: string;

  @IsString()
  @IsNotEmpty({ message: 'Le pays est requis' })
  country: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  website?: string;

  @IsString()
  @IsOptional()
  type?: string; // SUPERMARKET, PHARMACY, etc.
}

export class UpdateStoreDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  province?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  website?: string;

  @IsString()
  @IsOptional()
  type?: string;
}
