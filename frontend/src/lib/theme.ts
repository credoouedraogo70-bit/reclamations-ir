import type { CSSProperties } from 'react';

// Every value below is a CSS variable defined in index.css under `.dark`/`.light` —
// switching the class on <html> re-themes every page that uses these constants.
export const ACCENT = 'var(--color-theme-accent)';
export const BACKGROUND = 'var(--color-theme-bg)';
export const SURFACE = 'var(--color-theme-surface)';
export const SURFACE_2 = 'var(--color-theme-surface-2)';
export const BORDER = 'var(--color-theme-border)';
export const TEXT = 'var(--color-theme-text)';
export const TEXT_SECONDARY = 'var(--color-theme-text-secondary)';
export const HOVER = 'var(--color-theme-hover)';
export const INPUT_BG = 'var(--color-theme-input)';
export const OVERLAY = 'var(--color-theme-overlay)';

export const PIE_COLORS = ['#10B981', '#22D3EE', '#F59E0B', '#F43F5E', '#8B5CF6', '#38BDF8'];

export const mono: CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };
export const inter: CSSProperties = { fontFamily: "'Inter', sans-serif" };
