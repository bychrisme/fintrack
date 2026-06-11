import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  categoryId: string;
}

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;
}
