import React from 'react';
import { Text, View, ViewProps } from 'react-native';

type StatusType = 'completed' | 'active' | 'waiting' | 'inactive';

interface StatusBadgeProps extends ViewProps {
  status: StatusType;
  label: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * A themed status badge component that follows the design system
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'md',
  className = '',
  ...props
}) => {
  const baseClasses = 'rounded-full flex-row items-center justify-center';
  
  const statusClasses = {
    completed: 'bg-success/10',
    active: 'bg-maple-red/10',
    waiting: 'bg-waiting/10',
    inactive: 'bg-inactive/10',
  };

  const textColorClasses = {
    completed: 'text-success',
    active: 'text-maple-red',
    waiting: 'text-waiting',
    inactive: 'text-inactive',
  };

  const sizeClasses = {
    sm: 'px-2 py-1',
    md: 'px-3 py-1.5',
    lg: 'px-4 py-2',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <View
      className={`
        ${baseClasses}
        ${statusClasses[status]}
        ${sizeClasses[size]}
        ${className}
      `}
      {...props}>
      <Text
        className={`
          font-medium
          ${textColorClasses[status]}
          ${textSizeClasses[size]}
        `}>
        {label}
      </Text>
    </View>
  );
}; 