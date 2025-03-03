import { theme } from './theme';

/**
 * Convert a spacing value to pixels
 */
export const getSpacing = (value: keyof typeof theme.spacing): number => {
  return theme.spacing[value];
};

/**
 * Get a color from the theme
 */
export const getColor = (value: keyof typeof theme.colors): string => {
  return theme.colors[value];
};

/**
 * Get a border radius value
 */
export const getBorderRadius = (value: keyof typeof theme.borderRadius): number => {
  return theme.borderRadius[value];
};

/**
 * Get a shadow style object
 */
export const getShadow = (value: keyof typeof theme.shadows) => {
  return theme.shadows[value];
};

/**
 * Get a font size value
 */
export const getFontSize = (value: keyof typeof theme.typography.fontSize): number => {
  return theme.typography.fontSize[value];
};

/**
 * Get a font weight value
 */
export const getFontWeight = (value: keyof typeof theme.typography.fontWeight): string => {
  return theme.typography.fontWeight[value];
};

/**
 * Get an animation duration value
 */
export const getAnimationDuration = (value: keyof typeof theme.animation.duration): number => {
  return theme.animation.duration[value];
};

/**
 * Get an animation easing function
 */
export const getAnimationEasing = (value: keyof typeof theme.animation.easing): string => {
  return theme.animation.easing[value];
};

/**
 * Get a z-index value
 */
export const getZIndex = (value: keyof typeof theme.layout.zIndex): number => {
  return theme.layout.zIndex[value];
};

/**
 * Get a component-specific theme value
 */
export const getComponentTheme = <
  K extends keyof typeof theme.components,
  P extends keyof typeof theme.components[K]
>(
  component: K,
  property: P
): typeof theme.components[K][P] => {
  return theme.components[component][property];
};

/**
 * Create styles for a button based on variant
 */
export const getButtonStyles = (variant: 'primary' | 'secondary') => {
  const buttonTheme = theme.components.button[variant];
  return {
    backgroundColor: buttonTheme.background,
    borderRadius: buttonTheme.borderRadius,
    paddingVertical: buttonTheme.paddingVertical,
    paddingHorizontal: buttonTheme.paddingHorizontal,
    ...(variant === 'secondary' ? { borderWidth: 1, borderColor: theme.colors.frost } : {}),
  };
};

/**
 * Create styles for a card
 */
export const getCardStyles = () => {
  return {
    backgroundColor: theme.components.card.background,
    borderRadius: theme.components.card.borderRadius,
    borderWidth: 1,
    borderColor: theme.colors.frost,
    ...theme.components.card.shadow,
  };
};

/**
 * Create styles for an input field
 */
export const getInputStyles = (isFocused = false, hasError = false) => {
  return {
    backgroundColor: theme.components.input.background,
    borderRadius: theme.components.input.borderRadius,
    borderWidth: 1,
    borderColor: hasError 
      ? theme.components.input.errorBorder 
      : isFocused 
        ? theme.components.input.focusBorder 
        : theme.colors.frost,
    padding: theme.components.input.padding,
  };
}; 