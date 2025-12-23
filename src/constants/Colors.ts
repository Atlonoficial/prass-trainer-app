// src/constants/Colors.ts
// Cores da marca Prass Trainer

const tintColorLight = '#F59E0B'; // Laranja (cor primária Prass Trainer)
const tintColorDark = '#F59E0B';

export const Colors = {
    // Atalhos de cores principais (para uso simplificado)
    primary: '#F59E0B',
    secondary: '#3B82F6',
    success: '#22C55E',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',

    light: {
        text: '#11181C',
        textSecondary: '#687076',
        background: '#FFFFFF',
        backgroundSecondary: '#F4F4F5',
        tint: tintColorLight,
        icon: '#687076',
        tabIconDefault: '#687076',
        tabIconSelected: tintColorLight,
        border: '#E4E4E7',
        card: '#FFFFFF',
        success: '#22C55E',
        error: '#EF4444',
        warning: '#F59E0B',
        info: '#3B82F6',
    },
    dark: {
        text: '#ECEDEE',
        textSecondary: '#9BA1A6',
        background: '#0A0A0A',
        backgroundSecondary: '#1C1C1E',
        tint: tintColorDark,
        icon: '#9BA1A6',
        tabIconDefault: '#9BA1A6',
        tabIconSelected: tintColorDark,
        border: '#27272A',
        card: '#1C1C1E',
        success: '#22C55E',
        error: '#EF4444',
        warning: '#F59E0B',
        info: '#3B82F6',
    },
};

export default Colors;
