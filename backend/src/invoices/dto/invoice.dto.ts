import { IsArray, IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInvoiceItemDto {
  @IsString()
  @IsNotEmpty({ message: 'Le nom du produit est requis' })
  productName: string;

  @IsString()
  @IsOptional()
  rawName?: string;

  @IsString()
  @IsNotEmpty({ message: 'La catégorie de l\'article est requise' })
  categoryId: string;

  @IsNumber()
  @IsOptional()
  quantity?: number;

  @IsString()
  @IsOptional()
  unit?: string; // UNIT, KG, G, etc.

  @IsNumber()
  @IsNotEmpty({ message: 'Le prix unitaire est requis' })
  unitPrice: number;

  @IsNumber()
  @IsOptional()
  taxRate?: number; // E.g., 15.0 for 15%

  @IsNumber()
  @IsOptional()
  discount?: number; // Discount amount applied directly

  @IsString()
  @IsOptional()
  brand?: string;

  @IsString()
  @IsOptional()
  barcode?: string;
}

export class CreateInvoiceDto {
  @IsString()
  @IsNotEmpty({ message: 'Le numéro de facture est requis' })
  invoiceNumber: string;

  @IsDateString()
  @IsNotEmpty({ message: 'La date d\'achat est requise' })
  date: string;

  @IsString()
  @IsNotEmpty({ message: 'Le mode de paiement est requis' })
  paymentMode: string;

  @IsString()
  @IsOptional()
  comments?: string;

  @IsString()
  @IsOptional()
  attachmentUrl?: string;

  @IsNumber()
  @IsOptional()
  globalDiscounts?: number;

  @IsString()
  @IsNotEmpty({ message: 'Le magasin est requis' })
  storeId: string;

  @IsString()
  @IsOptional()
  rawStoreName?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items: CreateInvoiceItemDto[];
}

export class UpdateInvoiceDto {
  @IsString()
  @IsOptional()
  invoiceNumber?: string;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  paymentMode?: string;

  @IsString()
  @IsOptional()
  comments?: string;

  @IsString()
  @IsOptional()
  attachmentUrl?: string;

  @IsNumber()
  @IsOptional()
  globalDiscounts?: number;

  @IsString()
  @IsOptional()
  storeId?: string;

  @IsString()
  @IsOptional()
  rawStoreName?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items?: CreateInvoiceItemDto[];
}
