import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { unlink } from 'fs/promises';
import { join, basename } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService } from '../mail/mail.service';
import { CreateComplaintDto, ListComplaintsQueryDto, PublicCreateComplaintDto } from './dto';
import { withSlaStatus } from './sla.util';
import { STATUS_LABELS } from './labels.util';

@Injectable()
export class ComplaintsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private mailService: MailService,
  ) {}

  async create(data: CreateComplaintDto) {
    const category = await this.prisma.category.findUnique({ where: { id: data.categorie_id } });
    if (!category) throw new NotFoundException('Catégorie introuvable.');

    const sla_date_limite = new Date(Date.now() + category.sla_delai_heures * 60 * 60 * 1000);

    return this.prisma.complaint.create({ data: { ...data, sla_date_limite } });
  }

  private generateTicketNumber(): string {
    const random = Math.floor(100000 + Math.random() * 900000);
    return `TICK-${random}`;
  }

  async createPublic(data: PublicCreateComplaintDto) {
    const category = await this.prisma.category.findUnique({ where: { id: data.categorie_id } });
    if (!category) throw new NotFoundException('Catégorie introuvable.');

    const sla_date_limite = new Date(Date.now() + category.sla_delai_heures * 60 * 60 * 1000);

    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        return await this.prisma.complaint.create({
          data: {
            ...data,
            numero_ticket: this.generateTicketNumber(),
            canal_origine: 'Site web',
            priorite: 'MEDIUM',
            sla_date_limite,
          },
        });
      } catch (err) {
        const isUniqueTicketClash = err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';
        if (!isUniqueTicketClash || attempt === 4) throw err;
      }
    }
    throw new Error('Impossible de générer un numéro de ticket unique.');
  }

  async findAll(query: ListComplaintsQueryDto = {}) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const where: Prisma.ComplaintWhereInput = {
      ...(query.search
        ? {
            OR: [
              { numero_ticket: { contains: query.search } },
              { client_nom: { contains: query.search } },
            ],
          }
        : {}),
      ...(query.statut ? { statut: query.statut } : {}),
      ...(query.categorie_id ? { categorie_id: query.categorie_id } : {}),
      ...(query.agent_assigne_id ? { agent_assigne_id: query.agent_assigne_id } : {}),
      ...(query.priorite ? { priorite: query.priorite } : {}),
      ...(query.sla_breached
        ? { statut: { not: 'RESOLVED' }, sla_date_limite: { lt: new Date() } }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.complaint.findMany({
        where,
        include: {
          category: true,
          agentAssigned: {
            select: { id: true, nom: true, email: true }
          }
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.complaint.count({ where }),
    ]);

    return {
      data: data.map(withSlaStatus),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async findAllForExport() {
    const complaints = await this.prisma.complaint.findMany({
      include: {
        category: true,
        agentAssigned: {
          select: { id: true, nom: true, email: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    return complaints.map(withSlaStatus);
  }

  async findOne(id: number) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id },
      include: {
        category: true,
        agentAssigned: {
          select: { id: true, nom: true, email: true }
        },
        comments: {
          include: { user: { select: { id: true, nom: true } } },
          orderBy: { created_at: 'desc' }
        },
        statusHistories: {
          include: { user: { select: { id: true, nom: true } } },
          orderBy: { date_changement: 'desc' }
        },
        attachments: {
          orderBy: { uploaded_at: 'desc' }
        }
      }
    });
    return complaint ? withSlaStatus(complaint) : null;
  }

  async updateStatus(id: number, statut: string, userId: number) {
    const complaint = await this.prisma.complaint.findUnique({ where: { id } });
    if (!complaint) throw new Error('Complaint not found');

    const updated = await this.prisma.complaint.update({
      where: { id },
      data: { statut }
    });

    await this.prisma.statusHistory.create({
      data: {
        reclamation_id: id,
        user_id: userId,
        ancien_statut: complaint.statut,
        nouveau_statut: statut
      }
    });

    if (complaint.agent_assigne_id && complaint.agent_assigne_id !== userId) {
      await this.notificationsService.create(
        complaint.agent_assigne_id,
        `Le statut de la réclamation ${complaint.numero_ticket} est passé à ${STATUS_LABELS[statut] ?? statut}.`
      );
    }

    if (complaint.client_email) {
      const surveyLine = statut === 'RESOLVED'
        ? "\n\nVotre avis nous intéresse : rendez-vous sur la page de suivi des réclamations pour noter votre expérience."
        : '';
      await this.mailService.send(
        complaint.client_email,
        `Mise à jour de votre réclamation ${complaint.numero_ticket}`,
        `Bonjour ${complaint.client_nom},\n\nLe statut de votre réclamation ${complaint.numero_ticket} est maintenant : ${STATUS_LABELS[statut] ?? statut}.\n\nVous pouvez suivre son avancement à tout moment depuis la page de suivi des réclamations.${surveyLine}\n\nCordialement,\nL'équipe Moov Africa`,
      );
    }

    return updated;
  }

  async updatePriority(id: number, priorite: string) {
    return this.prisma.complaint.update({
      where: { id },
      data: { priorite },
    });
  }

  async trackByTicketAndPhone(ticket: string, telephone: string) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { numero_ticket: ticket },
      include: {
        category: true,
        statusHistories: { orderBy: { date_changement: 'asc' } },
      },
    });

    if (!complaint || complaint.client_telephone !== telephone) {
      throw new NotFoundException('Aucune réclamation trouvée avec ce numéro de ticket et ce téléphone.');
    }

    return {
      numero_ticket: complaint.numero_ticket,
      statut: complaint.statut,
      priorite: complaint.priorite,
      categorie: complaint.category.libelle,
      created_at: complaint.created_at,
      sla_date_limite: complaint.sla_date_limite,
      satisfaction_note: complaint.satisfaction_note,
      historique: complaint.statusHistories.map((h) => ({
        statut: h.nouveau_statut,
        date: h.date_changement,
      })),
    };
  }

  async rateComplaint(ticket: string, telephone: string, note: number, commentaire?: string) {
    const complaint = await this.prisma.complaint.findUnique({ where: { numero_ticket: ticket } });

    if (!complaint || complaint.client_telephone !== telephone) {
      throw new NotFoundException('Aucune réclamation trouvée avec ce numéro de ticket et ce téléphone.');
    }
    if (complaint.statut !== 'RESOLVED') {
      throw new BadRequestException('Seules les réclamations résolues peuvent être notées.');
    }
    if (complaint.satisfaction_note !== null) {
      throw new BadRequestException('Cette réclamation a déjà été notée.');
    }

    await this.prisma.complaint.update({
      where: { id: complaint.id },
      data: {
        satisfaction_note: note,
        satisfaction_commentaire: commentaire || null,
        satisfaction_date: new Date(),
      },
    });

    return { success: true };
  }

  async assignAgent(id: number, agentId: number) {
    const agent = await this.prisma.user.findUnique({ where: { id: agentId } });
    if (!agent) throw new Error('Agent not found');

    const updated = await this.prisma.complaint.update({
      where: { id },
      data: { agent_assigne_id: agentId },
      include: {
        category: true,
        agentAssigned: {
          select: { id: true, nom: true, email: true }
        }
      }
    });

    await this.notificationsService.create(
      agentId,
      `Vous avez été assigné à la réclamation ${updated.numero_ticket}.`
    );

    return updated;
  }

  async addComment(id: number, userId: number, content: string) {
    return this.prisma.comment.create({
      data: {
        reclamation_id: id,
        user_id: userId,
        contenu: content
      }
    });
  }

  async addAttachment(id: number, nomFichier: string, url: string) {
    return this.prisma.attachment.create({
      data: {
        reclamation_id: id,
        nom_fichier: nomFichier,
        url
      }
    });
  }

  async removeAttachment(complaintId: number, attachmentId: number) {
    const attachment = await this.prisma.attachment.findUnique({ where: { id: attachmentId } });
    if (!attachment || attachment.reclamation_id !== complaintId) {
      throw new NotFoundException('Pièce jointe introuvable.');
    }

    await this.prisma.attachment.delete({ where: { id: attachmentId } });

    const filePath = join(process.cwd(), 'uploads', basename(attachment.url));
    await unlink(filePath).catch(() => undefined);

    return { success: true };
  }
}
