import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

const SETTINGS_ID = 1;

@Injectable()
export class SettingsService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  private async getOrCreate() {
    return this.prisma.appSettings.upsert({
      where: { id: SETTINGS_ID },
      update: {},
      create: { id: SETTINGS_ID },
    });
  }

  async get() {
    const settings = await this.getOrCreate();
    return {
      default_sla_hours: settings.default_sla_hours,
      mail_configured: this.mailService.isConfigured(),
    };
  }

  async update(default_sla_hours: number) {
    await this.getOrCreate();
    const settings = await this.prisma.appSettings.update({
      where: { id: SETTINGS_ID },
      data: { default_sla_hours },
    });
    return {
      default_sla_hours: settings.default_sla_hours,
      mail_configured: this.mailService.isConfigured(),
    };
  }
}
