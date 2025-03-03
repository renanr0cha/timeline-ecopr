export const colors = {
  // Primary Colors
  mapleRed: '#FF1E38',
  pureWhite: '#FFFFFF',

  // Secondary Colors
  hopeRed: '#FF6B7D',
  snowWhite: '#F8F9FA',

  // Accent Colors
  mapleLeaf: '#E31837',
  frost: '#E9ECEF',

  // Status Colors
  success: '#2E8540',
  waiting: '#FDB813',
  inactive: '#8C9196',

  // Text Colors
  textPrimary: '#1A1D1F',
  textSecondary: '#4A4F54',
  textTertiary: '#6C757D',
} as const;

export const typography = {
  fontFamily: {
    primary: 'Inter',
    fallback: 'System',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
  },
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
} as const;

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
} as const;

export const shadows = {
  sm: {
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 16,
  },
} as const;

export const animation = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

export const layout = {
  container: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
  },
  zIndex: {
    0: 0,
    10: 10,
    20: 20,
    30: 30,
    40: 40,
    50: 50,
  },
} as const;

// Component-specific theme configurations
export const components = {
  card: {
    background: colors.snowWhite,
    border: `1px solid ${colors.frost}`,
    borderRadius: borderRadius.lg,
    shadow: shadows.sm,
  },
  button: {
    primary: {
      background: colors.mapleRed,
      text: colors.pureWhite,
      hover: colors.hopeRed,
      borderRadius: borderRadius.full,
      paddingVertical: spacing[4],
      paddingHorizontal: spacing[6],
    },
    secondary: {
      background: colors.pureWhite,
      border: `1px solid ${colors.frost}`,
      text: colors.textPrimary,
      hover: colors.snowWhite,
      borderRadius: borderRadius.full,
      paddingVertical: spacing[4],
      paddingHorizontal: spacing[6],
    },
  },
  progress: {
    active: colors.mapleRed,
    completed: colors.success,
    waiting: colors.waiting,
    future: colors.inactive,
    connection: colors.frost,
  },
  input: {
    border: `1px solid ${colors.frost}`,
    borderRadius: borderRadius.lg,
    background: colors.pureWhite,
    focusBorder: colors.mapleRed,
    errorBorder: colors.mapleRed,
    padding: spacing[4],
  },
} as const;

// Export everything as a single theme object
export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  animation,
  layout,
  components,
} as const;

// Type definitions for the theme
export type Theme = typeof theme;
export type ThemeColors = typeof colors;
export type ThemeTypography = typeof typography;
export type ThemeSpacing = typeof spacing;
export type ThemeBorderRadius = typeof borderRadius;
export type ThemeShadows = typeof shadows;
export type ThemeAnimation = typeof animation;
export type ThemeLayout = typeof layout;
export type ThemeComponents = typeof components; 