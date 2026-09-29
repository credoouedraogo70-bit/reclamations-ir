import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, UseInterceptors, UploadedFile, Req, Res, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import type { Response } from 'express';
import PDFDocument from 'pdfkit';
import { ComplaintsService } from './complaints.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateComplaintDto, UpdateStatusDto, UpdatePriorityDto, AssignAgentDto, AddCommentDto, ListComplaintsQueryDto, TrackComplaintQueryDto, PublicCreateComplaintDto, RateComplaintDto } from './dto';
import { STATUS_LABELS, PRIORITY_LABELS, SLA_LABELS } from './labels.util';
import { CategoriesService } from '../categories/categories.service';

function escapeCsvField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

const PDF_COLUMNS: { header: string; width: number }[] = [
  { header: 'Ticket', width: 75 },
  { header: 'Client', width: 100 },
  { header: 'Catégorie', width: 90 },
  { header: 'Statut', width: 75 },
  { header: 'SLA', width: 90 },
  { header: 'Créée le', width: 85 },
];
const PDF_MARGIN = 40;
const PDF_ROW_HEIGHT = 20;
const PDF_PAGE_BOTTOM = 780;

function buildComplaintsPdf(complaints: Awaited<ReturnType<ComplaintsService['findAllForExport']>>, res: Response) {
  const doc = new PDFDocument({ margin: PDF_MARGIN, size: 'A4' });
  doc.pipe(res);

  doc.fontSize(18).fillColor('#111827').text('Rapport des réclamations — Moov Africa', { align: 'center' });
  doc.fontSize(10).fillColor('#6b7280').text(`Généré le ${new Date().toLocaleString('fr-FR')}`, { align: 'center' });
  doc.moveDown(1);

  const byStatus = { NEW: 0, IN_PROGRESS: 0, RESOLVED: 0 } as Record<string, number>;
  for (const c of complaints) byStatus[c.statut] = (byStatus[c.statut] ?? 0) + 1;
  doc.fontSize(11).fillColor('#111827').text(
    `Total : ${complaints.length}   |   Nouveau : ${byStatus.NEW}   |   En cours : ${byStatus.IN_PROGRESS}   |   Résolu : ${byStatus.RESOLVED}`,
  );
  doc.moveDown(1);

  const drawRow = (y: number, cells: string[], isHeader: boolean) => {
    const totalWidth = PDF_COLUMNS.reduce((sum, col) => sum + col.width, 0);
    if (isHeader) {
      doc.rect(PDF_MARGIN, y - 4, totalWidth, PDF_ROW_HEIGHT).fill('#10B981');
    }
    doc.fontSize(9).fillColor(isHeader ? '#ffffff' : '#111827');
    let x = PDF_MARGIN;
    cells.forEach((cell, i) => {
      doc.text(cell, x + 4, y, { width: PDF_COLUMNS[i].width - 8, ellipsis: true });
      x += PDF_COLUMNS[i].width;
    });
  };

  let y = doc.y;
  drawRow(y, PDF_COLUMNS.map((c) => c.header), true);
  y += PDF_ROW_HEIGHT;

  for (const c of complaints) {
    if (y > PDF_PAGE_BOTTOM) {
      doc.addPage();
      y = PDF_MARGIN;
      drawRow(y, PDF_COLUMNS.map((c2) => c2.header), true);
      y += PDF_ROW_HEIGHT;
    }
    drawRow(y, [
      c.numero_ticket,
      c.client_nom,
      c.category?.libelle ?? '-',
      STATUS_LABELS[c.statut] ?? c.statut,
      c.sla_status ? SLA_LABELS[c.sla_status] ?? c.sla_status : '-',
      c.created_at.toLocaleDateString('fr-FR'),
    ], false);
    y += PDF_ROW_HEIGHT;
  }

  doc.end();
}

@UseGuards(JwtAuthGuard)
@Controller('complaints')
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  @Post()
  create(@Body() data: CreateComplaintDto) {
    return this.complaintsService.create(data);
  }

  @Get()
  findAll(@Query() query: ListComplaintsQueryDto) {
    return this.complaintsService.findAll(query);
  }

  @Get('export/csv')
  async exportCsv(@Res({ passthrough: true }) res: Response) {
    const complaints = await this.complaintsService.findAllForExport();

    const header = ['Ticket', 'Client', 'Téléphone', 'Catégorie', 'Statut', 'Priorité', 'Agent assigné', 'Créée le'];
    const rows = complaints.map((c) => [
      c.numero_ticket,
      c.client_nom,
      c.client_telephone,
      c.category?.libelle ?? '',
      STATUS_LABELS[c.statut] ?? c.statut,
      PRIORITY_LABELS[c.priorite] ?? c.priorite,
      c.agentAssigned?.nom ?? '',
      c.created_at.toISOString(),
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((field) => escapeCsvField(String(field))).join(','))
      .join('\n');

    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.header('Content-Disposition', 'attachment; filename="reclamations.csv"');
    return '﻿' + csv;
  }

  @Get('export/pdf')
  async exportPdf(@Res() res: Response) {
    const complaints = await this.complaintsService.findAllForExport();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="reclamations.pdf"');
    buildComplaintsPdf(complaints, res);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.complaintsService.findOne(+id);
  }

  @Post(':id/status')
  updateStatus(@Param('id') id: string, @Body() data: UpdateStatusDto, @Req() req: any) {
    return this.complaintsService.updateStatus(+id, data.statut, req.user.sub);
  }

  @Post(':id/priority')
  updatePriority(@Param('id') id: string, @Body() data: UpdatePriorityDto) {
    return this.complaintsService.updatePriority(+id, data.priorite);
  }

  @Post(':id/assign')
  assignAgent(@Param('id') id: string, @Body() data: AssignAgentDto) {
    return this.complaintsService.assignAgent(+id, +data.agentId);
  }

  @Post(':id/comments')
  addComment(@Param('id') id: string, @Body() data: AddCommentDto, @Req() req: any) {
    return this.complaintsService.addComment(+id, req.user.sub, data.content);
  }

  @Post(':id/attachments')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, callback) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          callback(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  addAttachment(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Aucun fichier fourni');
    return this.complaintsService.addAttachment(+id, file.originalname, `/uploads/${file.filename}`);
  }

  @Delete(':id/attachments/:attachmentId')
  removeAttachment(@Param('id') id: string, @Param('attachmentId') attachmentId: string) {
    return this.complaintsService.removeAttachment(+id, +attachmentId);
  }
}

/**
 * Deliberately outside the JwtAuthGuard applied to ComplaintsController above —
 * this is the public, unauthenticated "track my complaint" lookup for clients.
 */
@Controller('track')
export class TrackingController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  @Get()
  track(@Query() query: TrackComplaintQueryDto) {
    return this.complaintsService.trackByTicketAndPhone(query.ticket, query.telephone);
  }

  @Post('rate')
  rate(@Body() dto: RateComplaintDto) {
    return this.complaintsService.rateComplaint(dto.ticket, dto.telephone, dto.note, dto.commentaire);
  }
}

/**
 * Deliberately outside the JwtAuthGuard applied to ComplaintsController above —
 * lets a client submit a new complaint themselves, without an agent's involvement.
 * Channel and priority are always server-assigned (see ComplaintsService.createPublic).
 */
@Controller('complaints/public')
export class ComplaintsPublicController {
  constructor(
    private readonly complaintsService: ComplaintsService,
    private readonly categoriesService: CategoriesService,
  ) {}

  @Get('categories')
  async listCategories() {
    const categories = await this.categoriesService.findAll();
    return categories.map((c) => ({ id: c.id, libelle: c.libelle }));
  }

  @Post()
  create(@Body() data: PublicCreateComplaintDto) {
    return this.complaintsService.createPublic(data);
  }
}
