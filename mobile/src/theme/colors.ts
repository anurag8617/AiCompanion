export interface ThemeColors {
  background: string;
  surface: string; // New: Secondary layer
  card: string;
  primary: string;
  primaryHover: string;
  accent: string;
  border: string;
  text: string;
  textSecondary: string;
  error: string;
  success: string;
  warning: string; // Added
  inputBackground: string;
  shadow: string;
  glass: string; // New: Transparent layer
  glassBorder: string; // New
}

export const darkTheme: ThemeColors = {
  background: '#161A30', // Midnight Abyss (User requested)
  surface: '#1E233E',
  card: '#31304D', // Slate Shadow
  primary: '#B6BBC4', // Cool Silver (Primary Action)
  primaryHover: '#F0ECE5', // Warm Porcelain
  accent: '#F0ECE5', // Warm Porcelain (Highlight)
  border: 'rgba(182, 187, 196, 0.1)',
  text: '#F0ECE5', // Warm Porcelain for maximum readability
  textSecondary: '#B6BBC4', // Cool Silver
  error: '#EF4444',
  success: '#22C55E',
  warning: '#FACC15',
  inputBackground: '#1E233E',
  shadow: 'rgba(0, 0, 0, 0.9)',
  glass: 'rgba(182, 187, 196, 0.05)',
  glassBorder: 'rgba(182, 187, 196, 0.15)',
};

export const lightTheme: ThemeColors = {
  background: '#F0ECE5', // Warm Porcelain
  surface: '#FFFFFF',
  card: '#E3E9ED',
  primary: '#161A30', // Midnight Abyss
  primaryHover: '#31304D',
  accent: '#B6BBC4',
  border: 'rgba(22, 26, 48, 0.1)',
  text: '#161A30',
  textSecondary: '#31304D',
  error: '#EF4444',
  success: '#22C55E',
  warning: '#FACC15',
  inputBackground: '#FFFFFF',
  shadow: 'rgba(22, 26, 48, 0.08)',
  glass: 'rgba(22, 26, 48, 0.02)',
  glassBorder: 'rgba(22, 26, 48, 0.1)',
};

export const themes = {
  light: lightTheme,
  dark: darkTheme,
};
