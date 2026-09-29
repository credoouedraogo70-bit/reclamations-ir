import { ACCENT } from './theme';

export const SLA_BADGES: Record<string, { label: string; color: string; bg: string }> = {
  ON_TRACK: { label: 'DANS LES TEMPS', color: ACCENT, bg: 'rgba(16,185,129,0.12)' },
  AT_RISK: { label: 'À RISQUE', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  BREACHED: { label: 'DÉPASSÉ', color: '#F43F5E', bg: 'rgba(244,63,94,0.12)' },
  RESPECTED: { label: 'SLA RESPECTÉ', color: ACCENT, bg: 'rgba(16,185,129,0.12)' },
};

export function getSlaBadge(slaStatus: string | null | undefined) {
  if (!slaStatus) return null;
  return SLA_BADGES[slaStatus] ?? null;
}
