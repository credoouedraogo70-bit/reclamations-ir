import { Type } from 'class-transformer';
import { IsBoolean, IsEmail, IsIn, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

const ROLES = ['ADMIN', 'AGENT'];
const ROLE_MESSAGE = 'Le rôle doit être ADMIN ou AGENT.';

export class CreateUserDto {
  @IsString({ message: 'Le nom doit être une chaîne de caractères.' })
  @MinLength(1, { message: 'Le nom est requis.' })
  nom: string;

  @IsEmail({}, { message: "L'adresse email n'est pas valide." })
  email: string;

  @IsString({ message: 'Le mot de passe doit être une chaîne de caractères.' })
  @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères.' })
  password: string;

  @IsOptional()
  @IsIn(ROLES, { message: ROLE_MESSAGE })
  role?: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString({ message: 'Le nom doit être une chaîne de caractères.' })
  @MinLength(1, { message: 'Le nom est requis.' })
  nom?: string;

  @IsOptional()
  @IsEmail({}, { message: "L'adresse email n'est pas valide." })
  email?: string;

  @IsOptional()
  @IsIn(ROLES, { message: ROLE_MESSAGE })
  role?: string;

  @IsOptional()
  @IsBoolean({ message: 'Le statut doit être vrai ou faux.' })
  statut?: boolean;
}

export class ResetPasswordDto {
  @IsString({ message: 'Le mot de passe doit être une chaîne de caractères.' })
  @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères.' })
  password: string;
}

export class ListUsersQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Le numéro de page doit être un entier.' })
  @Min(1, { message: 'Le numéro de page doit être supérieur ou égal à 1.' })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La limite doit être un entier.' })
  @Min(1, { message: 'La limite doit être supérieure ou égale à 1.' })
  limit?: number;

  @IsOptional()
  @IsString({ message: 'La recherche doit être une chaîne de caractères.' })
  search?: string;
}
