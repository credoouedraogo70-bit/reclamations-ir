import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: "L'adresse email n'est pas valide." })
  email: string;

  @IsString({ message: 'Le mot de passe doit être une chaîne de caractères.' })
  @MinLength(1, { message: 'Le mot de passe est requis.' })
  password: string;
}

export class ForgotPasswordDto {
  @IsEmail({}, { message: "L'adresse email n'est pas valide." })
  email: string;
}

export class ResetPasswordDto {
  @IsString({ message: 'Le jeton de réinitialisation est invalide.' })
  @MinLength(1, { message: 'Le jeton de réinitialisation est requis.' })
  token: string;

  @IsString({ message: 'Le mot de passe doit être une chaîne de caractères.' })
  @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères.' })
  password: string;
}
