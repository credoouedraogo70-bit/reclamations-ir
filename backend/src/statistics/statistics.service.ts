import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { STATUS_LABELS } from '../complaints/labels.util';

export interface ActivityEntry {
  type: 'STATUS_CHANGE' | 'USER_CREATED';
  message: string;
  date: Date;
  role: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class StatisticsService {
  constructor(private prisma: PrismaService) {}

  /**
   * `days` only scopes the two time-series figures (resolved-in-period, the daily
   * chart) — total/in-progress/SLA-breached stay all-time "current state" numbers
   * so their KPI-card deep links into Complaints keep showing the full, unfiltered
   * matching set regardless of which chart window is selected.
   */
  async getDashboard(days = 7) {
    const complaints = await this.prisma.complaint.findMany({
      include: { category: true },
    });

    const total = complaints.length;
    const inProgress = complaints.filter((c) => c.statut === 'IN_PROGRESS').length;

    const now = new Date();
    const periodStart = new Date(now.getTime() - days * DAY_MS);

    const slaBreached = complaints.filter(
      (c) => c.statut !== 'RESOLVED' && c.sla_date_limite !== null && c.sla_date_limite < now,
    ).length;

    const resolvedComplaints = complaints.filter((c) => c.statut === 'RESOLVED');
    const resolvedInPeriod = resolvedComplaints.filter((c) => c.updated_at >= periodStart).length;

    const avgResolutionDays =
      resolvedComplaints.length > 0
        ? resolvedComplaints.reduce(
            (sum, c) => sum + (c.updated_at.getTime() - c.created_at.getTime()),
            0,
          ) /
          resolvedComplaints.length /
          DAY_MS
        : 0;

    const dailyMap = new Map<string, number>();
    for (let i = days - 1; i >= 0; i--) {
      const key = new Date(now.getTime() - i * DAY_MS).toISOString().slice(0, 10);
      dailyMap.set(key, 0);
    }
    for (const c of complaints) {
      const key = c.created_at.toISOString().slice(0, 10);
      if (dailyMap.has(key)) dailyMap.set(key, (dailyMap.get(key) ?? 0) + 1);
    }
    const dailyComplaints = Array.from(dailyMap.entries()).map(([date, count]) => ({ date, count }));

    const categoryMap = new Map<string, number>();
    for (const c of complaints) {
      const name = c.category?.libelle ?? 'Autre';
      categoryMap.set(name, (categoryMap.get(name) ?? 0) + 1);
    }
    const byCategory = Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }));

    return {
      periodDays: days,
      totalComplaints: total,
      inProgress,
      resolvedInPeriod,
      avgResolutionDays: Math.round(avgResolutionDays * 10) / 10,
      slaBreached,
      dailyComplaints,
      byCategory,
    };
  }

  async getAgentPerformance() {
    const agents = await this.prisma.user.findMany({
      where: { role: 'AGENT' },
      select: { id: true, nom: true, email: true, statut: true },
      orderBy: { nom: 'asc' },
    });

    const complaints = await this.prisma.complaint.findMany({
      where: { agent_assigne_id: { not: null } },
    });

    const now = new Date();

    return agents.map((agent) => {
      const assigned = complaints.filter((c) => c.agent_assigne_id === agent.id);
      const resolved = assigned.filter((c) => c.statut === 'RESOLVED');
      const inProgress = assigned.filter((c) => c.statut === 'IN_PROGRESS').length;
      const slaBreached = assigned.filter(
        (c) => c.statut !== 'RESOLVED' && c.sla_date_limite !== null && c.sla_date_limite < now,
      ).length;

      const avgResolutionDays =
        resolved.length > 0
          ? resolved.reduce((sum, c) => sum + (c.updated_at.getTime() - c.created_at.getTime()), 0) /
            resolved.length /
            DAY_MS
          : 0;

      return {
        id: agent.id,
        nom: agent.nom,
        email: agent.email,
        actif: agent.statut,
        totalAssigned: assigned.length,
        resolved: resolved.length,
        inProgress,
        slaBreached,
        avgResolutionDays: Math.round(avgResolutionDays * 10) / 10,
      };
    });
  }

  /**
   * Cross-system feed for admin oversight. Combines the two kinds of events we
   * actually keep a timestamped record of — status changes are the only complaint
   * lifecycle event with its own history table; assignments only exist today as
   * a notification message, not a queryable event, so they're left out rather
   * than guessed at by pattern-matching notification text.
   */
  async getActivityLog(limit = 50) {
    const [statusChanges, newUsers] = await Promise.all([
      this.prisma.statusHistory.findMany({
        take: limit,
        orderBy: { date_changement: 'desc' },
        include: {
          user: { select: { nom: true, role: true } },
          complaint: { select: { numero_ticket: true } },
        },
      }),
      this.prisma.user.findMany({
        take: limit,
        orderBy: { created_at: 'desc' },
        select: { nom: true, role: true, created_at: true },
      }),
    ]);

    const entries: ActivityEntry[] = [
      ...statusChanges.map((h) => ({
        type: 'STATUS_CHANGE' as const,
        message: `${h.user?.nom ?? 'Système'} a passé la réclamation ${h.complaint.numero_ticket} à « ${STATUS_LABELS[h.nouveau_statut] ?? h.nouveau_statut} »`,
        date: h.date_changement,
        role: h.user?.role ?? 'AGENT',
      })),
      ...newUsers.map((u) => ({
        type: 'USER_CREATED' as const,
        message: `Nouveau compte créé : ${u.nom} (${u.role === 'ADMIN' ? 'Administrateur' : 'Agent'})`,
        date: u.created_at,
        role: u.role,
      })),
    ];

    return entries.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, limit);
  }
}
