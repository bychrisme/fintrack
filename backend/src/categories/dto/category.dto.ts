import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty({ message: 'Le nom de la catégorie est requis' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'La couleur est requise' })
  color: string;

  @IsString()
  @IsNotEmpty({ message: 'L\'icône est requise' })
  icon: string;

  @IsString()
  @IsOptional()
  parentId?: string;
}

export class UpdateCategoryDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsString()
  @IsOptional()
  parentId?: string;
}
