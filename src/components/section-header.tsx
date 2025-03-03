import React from 'react';
import { Text, View, ViewProps } from 'react-native';

interface SectionHeaderProps extends ViewProps {
  title: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * A themed section header component that follows the design system
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  description,
  size = 'md',
  className = '',
  ...props
}) => {
  const titleSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  const descriptionSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return (
    <View className={`mb-4 ${className}`} {...props}>
      <Text
        className={`
          ${titleSizeClasses[size]}
          font-bold
          text-text-primary
          ${description ? 'mb-1' : ''}
        `}>
        {title}
      </Text>
      
      {description && (
        <Text
          className={`
            ${descriptionSizeClasses[size]}
            text-text-secondary
          `}>
          {description}
        </Text>
      )}
    </View>
  );
}; 