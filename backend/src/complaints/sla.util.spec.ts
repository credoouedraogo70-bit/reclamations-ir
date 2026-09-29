import { computeSlaStatus } from './sla.util';

const HOUR = 60 * 60 * 1000;

describe('computeSlaStatus', () => {
  const now = new Date('2026-01-01T12:00:00Z');

  it('returns null when there is no SLA deadline', () => {
    expect(computeSlaStatus({ statut: 'NEW', sla_date_limite: null, updated_at: now }, now)).toBeNull();
  });

  it('returns ON_TRACK when well before the deadline', () => {
    const status = computeSlaStatus(
      { statut: 'IN_PROGRESS', sla_date_limite: new Date(now.getTime() + 10 * HOUR), updated_at: now },
      now,
    );
    expect(status).toBe('ON_TRACK');
  });

  it('returns AT_RISK inside the last 4h before the deadline', () => {
    const status = computeSlaStatus(
      { statut: 'IN_PROGRESS', sla_date_limite: new Date(now.getTime() + 2 * HOUR), updated_at: now },
      now,
    );
    expect(status).toBe('AT_RISK');
  });

  it('returns BREACHED when the deadline has passed and the complaint is still open', () => {
    const status = computeSlaStatus(
      { statut: 'NEW', sla_date_limite: new Date(now.getTime() - HOUR), updated_at: now },
      now,
    );
    expect(status).toBe('BREACHED');
  });

  it('returns RESPECTED when resolved before the deadline', () => {
    const resolvedAt = new Date(now.getTime() - HOUR);
    const status = computeSlaStatus(
      { statut: 'RESOLVED', sla_date_limite: now, updated_at: resolvedAt },
      now,
    );
    expect(status).toBe('RESPECTED');
  });

  it('returns BREACHED when resolved after the deadline', () => {
    const resolvedAt = new Date(now.getTime() + HOUR);
    const status = computeSlaStatus(
      { statut: 'RESOLVED', sla_date_limite: now, updated_at: resolvedAt },
      now,
    );
    expect(status).toBe('BREACHED');
  });
});
