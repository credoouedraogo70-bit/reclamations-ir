import { IsInt, Max, Min } from 'class-validator';

export class UpdateSettingsDto {
  @IsInt({ message: 'Le délai SLA par défaut doit être un entier.' })
  @Min(1, { message: 'Le délai SLA par défaut doit être supérieur à 0.' })
  @Max(8760, { message: 'Le délai SLA par défaut ne peut pas dépasser un an (8760 heures).' })
  default_sla_hours: number;
}
