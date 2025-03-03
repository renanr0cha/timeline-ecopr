import React, { useState } from 'react';
import { Text, TextInput, TextInputProps, View } from 'react-native';

interface ThemedInputProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * A themed input component that follows the design system using Tailwind classes
 */
export const ThemedInput: React.FC<ThemedInputProps> = ({
  label,
  error,
  helper,
  size = 'md',
  className = '',
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const baseInputClasses = 'bg-pure-white rounded-lg border w-full';
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-4 py-4 text-lg',
  };

  const inputStateClasses = error
    ? 'border-maple-red'
    : isFocused
    ? 'border-maple-red'
    : 'border-frost';

  return (
    <View className="w-full">
      {label && (
        <Text className="text-sm font-medium text-text-primary mb-2">
          {label}
        </Text>
      )}

      <TextInput
        className={`
          ${baseInputClasses}
          ${sizeClasses[size]}
          ${inputStateClasses}
          ${className}
        `}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholderTextColor="#6C757D"
        {...props}
      />

      {(error || helper) && (
        <Text
          className={`
            text-xs mt-1
            ${error ? 'text-maple-red' : 'text-text-tertiary'}
          `}>
          {error || helper}
        </Text>
      )}
    </View>
  );
}; 