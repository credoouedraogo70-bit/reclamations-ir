export const AT_RISK_WINDOW_MS = 4 * 60 * 60 * 1000; // flag as "at risk" inside the last 4h before the deadline

export interface SlaAwareComplaint {
  statut: string;
  sla_date_limite: Date | null;
  updated_at: Date;
}

/**
 * SLA status is time-dependent, so it's derived on read rather than stored:
 * a row written as ON_TRACK would silently go stale the moment the deadline passes.
 */
export function computeSlaStatus(complaint: SlaAwareComplaint, now: Date = new Date()): string | null {
  if (!complaint.sla_date_limite) return null;

  if (complaint.statut === 'RESOLVED') {
    return complaint.updated_at <= complaint.sla_date_limite ? 'RESPECTED' : 'BREACHED';
  }

  if (now > complaint.sla_date_limite) return 'BREACHED';
  if (complaint.sla_date_limite.getTime() - now.getTime() <= AT_RISK_WINDOW_MS) return 'AT_RISK';
  return 'ON_TRACK';
}

export function withSlaStatus<T extends SlaAwareComplaint>(complaint: T) {
  return { ...complaint, sla_status: computeSlaStatus(complaint) };
}
