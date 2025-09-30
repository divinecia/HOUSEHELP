// HouseHelp Brand Color Palette
// Centralized color definitions with CSS variables

export const colors = {
  // Primary Brand Colors
  primaryBlue: 'rgb(76, 102, 164)',
  lightBlue: 'rgb(138, 165, 208)',
  accentGray: 'rgb(95, 108, 126)',
  workerBlue: '#003366',
  cleanWhite: 'rgb(255, 255, 255)',

  // Extended Blue Palette
  blue50: '#f0f4ff',
  blue100: '#e0eaff',
  blue500: '#4c66a4',
  blue600: '#3d5283',
  blue700: '#2e3e62',

  // Gray Palette
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',

  // Semantic Colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // Background Colors
  background: '#ffffff',
  foreground: '#1e293b',
} as const;

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
} as const;

export const transitions = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

// CSS Variable Names
export const cssVars = {
  primaryBlue: '--primary-blue',
  lightBlue: '--light-blue',
  accentGray: '--accent-gray',
  workerBlue: '--worker-blue',
  background: '--background',
  foreground: '--foreground',
} as const;

// Helper function to get color value
export function getColor(colorName: keyof typeof colors): string {
  return colors[colorName];
}

// Helper function to get CSS variable
export function getCSSVar(varName: keyof typeof cssVars): string {
  return `var(${cssVars[varName]})`;
}

// Helper function to generate gradient
export function generateGradient(
  color1: string,
  color2: string,
  angle: number = 135
): string {
  return `linear-gradient(${angle}deg, ${color1} 0%, ${color2} 100%)`;
}

// Pre-defined gradients
export const gradients = {
  primary: generateGradient(colors.primaryBlue, colors.lightBlue),
  worker: generateGradient(colors.workerBlue, '#004080'),
  household: generateGradient(colors.lightBlue, '#8AB5D0'),
  admin: generateGradient(colors.accentGray, '#5f6c7b'),
  success: generateGradient(colors.success, '#059669'),
  warning: generateGradient(colors.warning, '#d97706'),
  error: generateGradient(colors.error, '#dc2626'),
} as const;

// Color usage patterns
export const colorUsage = {
  // Buttons
  primaryButton: {
    background: gradients.primary,
    hover: generateGradient(colors.blue600, colors.blue700),
    text: colors.cleanWhite,
  },
  secondaryButton: {
    background: colors.cleanWhite,
    hover: colors.gray50,
    border: colors.gray300,
    text: colors.gray700,
  },

  // Cards
  workerCard: {
    background: gradients.worker,
    icon: 'rgba(255, 255, 255, 0.15)',
  },
  householdCard: {
    background: gradients.household,
    icon: 'rgba(255, 255, 255, 0.25)',
  },
  adminCard: {
    background: gradients.admin,
    icon: 'rgba(255, 255, 255, 0.15)',
  },

  // Text
  primaryText: colors.gray900,
  secondaryText: colors.gray600,
  mutedText: colors.gray500,
  linkText: colors.primaryBlue,
  linkHover: colors.blue600,

  // Backgrounds
  pageBackground: generateGradient('#f5f7fa', '#e8eef5'),
  cardBackground: colors.cleanWhite,
  inputBackground: colors.cleanWhite,

  // Borders
  defaultBorder: colors.gray200,
  focusBorder: colors.primaryBlue,
  errorBorder: colors.error,
} as const;

// Accessibility - Ensure proper contrast ratios
export const accessibility = {
  // WCAG AA compliant color combinations
  textOnPrimaryBlue: colors.cleanWhite, // Contrast ratio: 4.5:1+
  textOnLightBlue: colors.gray900, // Contrast ratio: 4.5:1+
  textOnWhite: colors.gray900, // Contrast ratio: 12:1+
  textOnGray: colors.cleanWhite, // Contrast ratio: 4.5:1+
} as const;

// Export default color palette
export default {
  colors,
  shadows,
  transitions,
  cssVars,
  gradients,
  colorUsage,
  accessibility,
  getColor,
  getCSSVar,
  generateGradient,
};
