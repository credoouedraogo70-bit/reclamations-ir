import { MonitorCogIcon, MoonStarIcon, SunIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../lib/ThemeProvider';
import type { Theme } from '../lib/ThemeProvider';
import { ACCENT, SURFACE_2, TEXT_SECONDARY, TEXT } from '../lib/theme';

const THEME_OPTIONS: { icon: typeof SunIcon; value: Theme; label: string }[] = [
  { icon: MonitorCogIcon, value: 'system', label: 'Système' },
  { icon: SunIcon, value: 'light', label: 'Clair' },
  { icon: MoonStarIcon, value: 'dark', label: 'Sombre' },
];

export function ToggleTheme() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className="inline-flex items-center overflow-hidden rounded-md border"
      style={{ backgroundColor: SURFACE_2, borderColor: 'var(--color-theme-border)' }}
      role="radiogroup"
    >
      {THEME_OPTIONS.map((option) => {
        const active = theme === option.value;
        return (
          <button
            key={option.value}
            type="button"
            className="relative flex size-7 cursor-pointer items-center justify-center rounded-md transition-colors"
            style={{ color: active ? TEXT : TEXT_SECONDARY }}
            role="radio"
            aria-checked={active}
            aria-label={`Utiliser le thème ${option.label}`}
            title={option.label}
            onClick={() => setTheme(option.value)}
          >
            {active ? (
              <motion.div
                layoutId="theme-option"
                transition={{ type: 'spring', bounce: 0.1, duration: 0.5 }}
                className="absolute inset-0 rounded-md border"
                style={{ borderColor: ACCENT }}
              />
            ) : null}
            <option.icon className="size-3.5 relative z-10" />
          </button>
        );
      })}
    </div>
  );
}
