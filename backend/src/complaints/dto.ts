import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEmail, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

const STATUSES = ['NEW', 'IN_PROGRESS', 'RESOLVED'];
const STATUS_MESSAGE = 'Le statut doit être NEW, IN_PROGRESS ou RESOLVED.';
export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const PRIORITY_MESSAGE = 'La priorité doit être LOW, MEDIUM, HIGH ou URGENT.';

export class CreateComplaintDto {
  @IsString({ message: 'Le numéro de ticket doit être une chaîne de caractères.' })
  @MinLength(1, { message: 'Le numéro de ticket est requis.' })
  numero_ticket: string;

  @IsString({ message: 'Le nom du client doit être une chaîne de caractères.' })
  @MinLength(1, { message: 'Le nom du client est requis.' })
  client_nom: string;

  @IsString({ message: 'Le téléphone du client doit être une chaîne de caractères.' })
  @MinLength(1, { message: 'Le téléphone du client est requis.' })
  client_telephone: string;

  @IsOptional()
  @IsEmail({}, { message: 'L\'adresse email du client est invalide.' })
  client_email?: string;

  @IsString({ message: 'Le canal d\'origine doit être une chaîne de caractères.' })
  @MinLength(1, { message: 'Le canal d\'origine est requis.' })
  canal_origine: string;

  @IsInt({ message: 'La catégorie sélectionnée est invalide.' })
  categorie_id: number;

  @IsString({ message: 'La description doit être une chaîne de caractères.' })
  @MinLength(1, { message: 'La description est requise.' })
  description: string;

  @IsOptional()
  @IsIn(PRIORITIES, { message: PRIORITY_MESSAGE })
  priorite?: string;
}

/** Fields a client submits themselves via the public self-service form — no ticket number, channel, or priority (server-assigned). */
export class PublicCreateComplaintDto {
  @IsString({ message: 'Le nom du client doit être une chaîne de caractères.' })
  @MinLength(1, { message: 'Le nom du client est requis.' })
  @MaxLength(150, { message: 'Le nom du client est trop long.' })
  client_nom: string;

  @IsString({ message: 'Le téléphone du client doit être une chaîne de caractères.' })
  @MinLength(1, { message: 'Le téléphone du client est requis.' })
  @MaxLength(30, { message: 'Le numéro de téléphone est trop long.' })
  client_telephone: string;

  @IsOptional()
  @IsEmail({}, { message: 'L\'adresse email du client est invalide.' })
  client_email?: string;

  @IsInt({ message: 'La catégorie sélectionnée est invalide.' })
  categorie_id: number;

  @IsString({ message: 'La description doit être une chaîne de caractères.' })
  @MinLength(1, { message: 'La description est requise.' })
  @MaxLength(2000, { message: 'La description est trop longue (2000 caractères maximum).' })
  description: string;
}

export class UpdateStatusDto {
  @IsIn(STATUSES, { message: STATUS_MESSAGE })
  statut: string;
}

export class UpdatePriorityDto {
  @IsIn(PRIORITIES, { message: PRIORITY_MESSAGE })
  priorite: string;
}

export class TrackComplaintQueryDto {
  @IsString({ message: 'Le numéro de ticket doit être une chaîne de caractères.' })
  @MinLength(1, { message: 'Le numéro de ticket est requis.' })
  ticket: string;

  @IsString({ message: 'Le numéro de téléphone doit être une chaîne de caractères.' })
  @MinLength(1, { message: 'Le numéro de téléphone est requis.' })
  telephone: string;
}

export class RateComplaintDto {
  @IsString({ message: 'Le numéro de ticket doit être une chaîne de caractères.' })
  @MinLength(1, { message: 'Le numéro de ticket est requis.' })
  ticket: string;

  @IsString({ message: 'Le numéro de téléphone doit être une chaîne de caractères.' })
  @MinLength(1, { message: 'Le numéro de téléphone est requis.' })
  telephone: string;

  @Type(() => Number)
  @IsInt({ message: 'La note doit être un entier.' })
  @Min(1, { message: 'La note doit être comprise entre 1 et 5.' })
  @Max(5, { message: 'La note doit être comprise entre 1 et 5.' })
  note: number;

  @IsOptional()
  @IsString({ message: 'Le commentaire doit être une chaîne de caractères.' })
  @MaxLength(1000, { message: 'Le commentaire est trop long (1000 caractères maximum).' })
  commentaire?: string;
}

export class AssignAgentDto {
  @IsInt({ message: 'L\'agent sélectionné est invalide.' })
  agentId: number;
}

export class AddCommentDto {
  @IsString({ message: 'Le commentaire doit être une chaîne de caractères.' })
  @MinLength(1, { message: 'Le commentaire ne peut pas être vide.' })
  content: string;
}

export class ListComplaintsQueryDto {
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

  @IsOptional()
  @IsIn(STATUSES, { message: STATUS_MESSAGE })
  statut?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La catégorie sélectionnée est invalide.' })
  categorie_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'L\'agent sélectionné est invalide.' })
  agent_assigne_id?: number;

  @IsOptional()
  @IsIn(PRIORITIES, { message: PRIORITY_MESSAGE })
  priorite?: string;

  /** Set from the dashboard's "SLA en retard" KPI card — open complaints past their SLA deadline. */
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'Le filtre SLA en retard est invalide.' })
  sla_breached?: boolean;
}
