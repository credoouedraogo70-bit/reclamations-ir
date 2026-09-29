import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString({ message: 'Le libellé doit être une chaîne de caractères.' })
  @MinLength(1, { message: 'Le libellé est requis.' })
  libelle: string;

  @IsInt({ message: 'Le délai SLA doit être un nombre entier d\'heures.' })
  @Min(1, { message: 'Le délai SLA doit être d\'au moins 1 heure.' })
  sla_delai_heures: number;
}

export class UpdateCategoryDto {
  @IsOptional()
  @IsString({ message: 'Le libellé doit être une chaîne de caractères.' })
  @MinLength(1, { message: 'Le libellé est requis.' })
  libelle?: string;

  @IsOptional()
  @IsInt({ message: 'Le délai SLA doit être un nombre entier d\'heures.' })
  @Min(1, { message: 'Le délai SLA doit être d\'au moins 1 heure.' })
  sla_delai_heures?: number;
}
