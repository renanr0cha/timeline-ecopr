import React, { ReactNode } from 'react';
import { TouchableOpacity, View, ViewStyle } from 'react-native';

interface ThemedCardProps {
  children: ReactNode;
  className?: string;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined';
  onPress?: () => void;
}

/**
 * Themed card component with consistent styling
 */
export const ThemedCard: React.FC<ThemedCardProps> = ({
  children,
  className = '',
  style,
  variant = 'default',
  onPress,
}) => {
  // Base styles for all variants
  let cardClass = 'rounded-xl overflow-hidden ';

  // Apply variant-specific styles
  switch (variant) {
    case 'elevated':
      cardClass += 'bg-white shadow shadow-black/10 elevation-2 p-4 ';
      break;
    case 'outlined':
      cardClass += 'bg-white border border-[#e2e8f0] p-4 ';
      break;
    case 'default':
    default:
      cardClass += 'bg-white p-4 ';
      break;
  }

  // Add any additional classes
  cardClass += className;

  // Use TouchableOpacity if onPress is provided, otherwise use View
  if (onPress) {
    return (
      <TouchableOpacity className={cardClass} style={style} onPress={onPress} activeOpacity={0.7}>
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View className={cardClass} style={style}>
      {children}
    </View>
  );
};
