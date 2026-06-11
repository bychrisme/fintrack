import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Veuillez entrer un email valide' })
  @IsNotEmpty({ message: 'L\'email est requis' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Le mot de passe est requis' })
  @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' })
  password: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  role?: string; // USER, ADMIN, FAMILY
}

export class LoginDto {
  @IsEmail({}, { message: 'Veuillez entrer un email valide' })
  @IsNotEmpty({ message: 'L\'email est requis' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Le mot de passe est requis' })
  password: string;
}
