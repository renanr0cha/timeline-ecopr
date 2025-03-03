import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';

interface ThemedButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'secondary';
  loading?: boolean;
  children: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * A themed button component that follows the design system using Tailwind classes
 */
export const ThemedButton: React.FC<ThemedButtonProps> = ({
  variant = 'primary',
  loading = false,
  children,
  size = 'md',
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'flex-row items-center justify-center rounded-full';
  
  const variantClasses = {
    primary: 'bg-maple-red active:bg-hope-red',
    secondary: 'bg-pure-white border border-frost active:bg-snow-white',
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-4 text-base',
    lg: 'px-8 py-5 text-lg',
  };

  const textColorClasses = {
    primary: 'text-pure-white',
    secondary: 'text-text-primary',
  };

  return (
    <TouchableOpacity
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabled ? 'opacity-50' : 'opacity-100'}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#FFFFFF' : '#1A1D1F'} />
      ) : (
        <Text
          className={`
            font-medium
            ${textColorClasses[variant]}
          `}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
}; 