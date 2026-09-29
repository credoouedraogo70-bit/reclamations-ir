import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { DashboardQueryDto } from './dto';

@UseGuards(JwtAuthGuard)
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('dashboard')
  getDashboard(@Query() query: DashboardQueryDto) {
    return this.statisticsService.getDashboard(query.days ?? 7);
  }

  @Get('agents')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  getAgentPerformance() {
    return this.statisticsService.getAgentPerformance();
  }

  @Get('activity')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  getActivityLog() {
    return this.statisticsService.getActivityLog();
  }
}
