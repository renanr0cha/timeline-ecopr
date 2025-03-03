import React from 'react';
import { View, ViewProps } from 'react-native';

interface ThemedCardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

/**
 * A themed card component that follows the design system using Tailwind classes
 */
export const ThemedCard: React.FC<ThemedCardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  ...props
}) => {
  const baseClasses = 'bg-snow-white rounded-lg overflow-hidden';
  
  const variantClasses = {
    default: 'border border-frost shadow-sm',
    elevated: 'border border-frost shadow-md',
  };

  const paddingClasses = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <View
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${paddingClasses[padding]}
        ${className}
      `}
      {...props}>
      {children}
    </View>
  );
}; 