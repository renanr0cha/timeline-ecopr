import React from 'react';
import { View } from 'react-native';

interface ProgressBarProps {
  progress: number;
  color?: string;
  backgroundColor?: string;
  height?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color = '#FF1E38',
  backgroundColor = '#E5E7EB',
  height = 4,
}) => {
  // Ensure progress is between 0 and 1
  const clampedProgress = Math.min(Math.max(progress, 0), 1);

  return (
    <View className="w-full overflow-hidden rounded-full" style={{ height, backgroundColor }}>
      <View
        className="rounded-full"
        style={{
          width: `${clampedProgress * 100}%`,
          height: '100%',
          backgroundColor: color,
        }}
      />
    </View>
  );
};
