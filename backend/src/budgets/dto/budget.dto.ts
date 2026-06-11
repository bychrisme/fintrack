import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateBudgetDto {
  @IsNumber()
  @IsNotEmpty({ message: 'Le montant du budget est requis' })
  amount: number;

  @IsNumber()
  @IsNotEmpty({ message: 'Le mois est requis' })
  month: number;

  @IsNumber()
  @IsNotEmpty({ message: 'L\'année est requise' })
  year: number;

  @IsString()
  @IsOptional()
  categoryId?: string; // Null means global budget
}

export class UpdateBudgetDto {
  @IsNumber()
  @IsOptional()
  amount?: number;

  @IsNumber()
  @IsOptional()
  month?: number;

  @IsNumber()
  @IsOptional()
  year?: number;

  @IsString()
  @IsOptional()
  categoryId?: string;
}
