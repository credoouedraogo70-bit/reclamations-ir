import { Module } from '@nestjs/common';
import { ComplaintsService } from './complaints.service';
import { ComplaintsController, TrackingController, ComplaintsPublicController } from './complaints.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { MailModule } from '../mail/mail.module';
import { CategoriesModule } from '../categories/categories.module';

@Module({
  imports: [NotificationsModule, MailModule, CategoriesModule],
  controllers: [ComplaintsController, TrackingController, ComplaintsPublicController],
  providers: [ComplaintsService],
})
export class ComplaintsModule {}
