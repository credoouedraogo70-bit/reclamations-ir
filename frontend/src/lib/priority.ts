export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;

export const PRIORITY_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  LOW: { label: 'BASSE', color: '#A1A1AA', bg: 'rgba(161,161,170,0.12)' },
  MEDIUM: { label: 'MOYENNE', color: '#38BDF8', bg: 'rgba(56,189,248,0.12)' },
  HIGH: { label: 'HAUTE', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  URGENT: { label: 'URGENTE', color: '#F43F5E', bg: 'rgba(244,63,94,0.12)' },
};

export function getPriorityBadge(priorite: string | null | undefined) {
  if (!priorite) return null;
  return PRIORITY_STYLES[priorite] ?? null;
}
