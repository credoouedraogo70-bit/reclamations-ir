import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly from: string;

  constructor(private config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    const port = this.config.get<string>('SMTP_PORT');
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');
    this.from = this.config.get<string>('SMTP_FROM') ?? 'Moov Africa <no-reply@moov-africa.com>';

    if (host && port && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(port),
        secure: Number(port) === 465,
        auth: { user, pass },
      });
    } else {
      this.logger.warn(
        'SMTP non configuré (SMTP_HOST/PORT/USER/PASS absents) — les emails seront simplement journalisés.',
      );
    }
  }

  isConfigured(): boolean {
    return this.transporter !== null;
  }

  async send(to: string, subject: string, text: string) {
    if (!this.transporter) {
      this.logger.log(`[email simulé] à: ${to} | sujet: ${subject}\n${text}`);
      return;
    }

    try {
      await this.transporter.sendMail({ from: this.from, to, subject, text });
    } catch (err) {
      this.logger.error(`Échec de l'envoi de l'email à ${to}`, err as Error);
    }
  }
}
