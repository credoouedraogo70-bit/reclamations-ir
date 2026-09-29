import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional } from 'class-validator';

export const DASHBOARD_PERIODS = [7, 14, 30, 90];

export class DashboardQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La période doit être un entier.' })
  @IsIn(DASHBOARD_PERIODS, { message: 'La période doit être 7, 14, 30 ou 90 jours.' })
  days?: number;
}
