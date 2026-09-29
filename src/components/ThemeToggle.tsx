import React from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeToggleProps {
  currentTheme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  variant?: 'compact' | 'segmented' | 'floating';
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  currentTheme,
  onThemeChange,
  variant = 'compact',
  className = '',
}) => {
  if (variant === 'segmented') {
    return (
      <div
        className={`inline-flex items-center p-1 rounded-full liquid-glass-bar border border-white/20 dark:border-white/10 shadow-inner ${className}`}
        role="group"
        aria-label="Theme selection"
      >
        <button
          type="button"
          onClick={() => onThemeChange('light')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
            currentTheme === 'light'
              ? 'bg-white text-zinc-900 shadow-sm font-semibold scale-100'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
          title="Light mode"
        >
          <Sun className="w-3.5 h-3.5 text-amber-500" />
          <span>Light</span>
        </button>

        <button
          type="button"
          onClick={() => onThemeChange('dark')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
            currentTheme === 'dark'
              ? 'bg-[#1C1C1E] text-white shadow-sm font-semibold scale-100 border border-white/10'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
          title="Dark mode"
        >
          <Moon className="w-3.5 h-3.5 text-blue-400" />
          <span>Dark</span>
        </button>

        <button
          type="button"
          onClick={() => onThemeChange('system')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
            currentTheme === 'system'
              ? 'bg-zinc-200/90 dark:bg-zinc-700/80 text-zinc-900 dark:text-white shadow-sm font-semibold'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
          title="System match"
        >
          <Laptop className="w-3.5 h-3.5 text-emerald-500" />
          <span>Auto</span>
        </button>
      </div>
    );
  }

  // Compact variant for Navbar header
  const isDarkEffective =
    currentTheme === 'dark' ||
    (currentTheme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <button
      type="button"
      id="btn-theme-toggle"
      onClick={() => {
        if (currentTheme === 'dark') onThemeChange('light');
        else if (currentTheme === 'light') onThemeChange('system');
        else onThemeChange('dark');
      }}
      className={`relative group p-2 rounded-full liquid-glass-interactive border border-white/20 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:text-blue-500 dark:hover:text-blue-400 transition-all duration-200 ${className}`}
      title={`Theme: ${currentTheme.toUpperCase()} (Click to toggle Light / Dark / Auto)`}
      aria-label="Toggle theme mode"
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {currentTheme === 'light' && (
          <Sun className="w-4 h-4 text-amber-500 animate-in spin-in-180 duration-300" />
        )}
        {currentTheme === 'dark' && (
          <Moon className="w-4 h-4 text-blue-400 animate-in spin-in-90 duration-300" />
        )}
        {currentTheme === 'system' && (
          <Laptop className="w-4 h-4 text-emerald-400 animate-in zoom-in-75 duration-300" />
        )}
      </div>
      <span className="sr-only">Toggle theme</span>
    </button>
  );
};
