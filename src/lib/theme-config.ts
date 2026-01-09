export type ThemePreset = 'minimalist' | 'midnight' | 'elegant';

export interface ThemeColors {
    background: string;
    foreground: string;
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    accent: string;
    accentForeground: string;
    border: string;
}

export interface ThemeConfig {
    name: ThemePreset;
    label: string;
    colors: ThemeColors;
    fontFamily: string;
}

export const themes: Record<ThemePreset, ThemeConfig> = {
    minimalist: {
        name: 'minimalist',
        label: 'Clean & Minimal',
        colors: {
            background: 'bg-white',
            foreground: 'text-zinc-950',
            primary: 'bg-zinc-900',
            primaryForeground: 'text-zinc-50',
            secondary: 'bg-zinc-100',
            secondaryForeground: 'text-zinc-900',
            accent: 'bg-zinc-100',
            accentForeground: 'text-zinc-900',
            border: 'border-zinc-200',
        },
        fontFamily: 'font-sans',
    },
    midnight: {
        name: 'midnight',
        label: 'Midnight Vibe',
        colors: {
            background: 'bg-slate-950',
            foreground: 'text-slate-50',
            primary: 'bg-violet-600',
            primaryForeground: 'text-white',
            secondary: 'bg-slate-800',
            secondaryForeground: 'text-slate-200',
            accent: 'bg-fuchsia-500',
            accentForeground: 'text-white',
            border: 'border-slate-800',
        },
        fontFamily: 'font-sans',
    },
    elegant: {
        name: 'elegant',
        label: 'Elegant Gold',
        colors: {
            background: 'bg-stone-50',
            foreground: 'text-stone-900',
            primary: 'bg-amber-900',
            primaryForeground: 'text-amber-50',
            secondary: 'bg-stone-200',
            secondaryForeground: 'text-stone-800',
            accent: 'bg-amber-600',
            accentForeground: 'text-white',
            border: 'border-amber-900/20',
        },
        fontFamily: 'font-serif',
    },
};

export const currentTheme: ThemeConfig = themes['minimalist'];
