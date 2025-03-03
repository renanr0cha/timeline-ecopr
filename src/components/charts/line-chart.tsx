import React from 'react';
import { Dimensions } from 'react-native';
import { LineChart as RNLineChart } from 'react-native-chart-kit';

interface LineChartProps {
  data: {
    labels: string[];
    datasets: {
      data: number[];
      color?: (opacity: number) => string;
    }[];
  };
  height?: number;
  yAxisSuffix?: string;
  showDots?: boolean;
  isArea?: boolean;
  isWeekly?: boolean;
}

export const LineChart = ({ 
  data, 
  height = 180, 
  yAxisSuffix = '',
  showDots = true,
  isArea = false,
  isWeekly = false
}: LineChartProps) => {
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = Math.max(screenWidth - 48, (data.labels.length || 1) * 60);

  // Format labels based on type
  const formattedLabels = data.labels.map((label) => {
    if (isWeekly) {
      // For weekly breakdown, format as "Days 1-7"
      // The label format is "Month Year days", e.g. "March 2025 1-7"
      const parts = label.split(' ');
      const range = parts[parts.length - 1]; // Get the last part which should be the range
      return `Days ${range}`;
    } else if (label.includes(' ')) {
      // For monthly labels, show year as last 2 digits
      const [month, year] = label.split(' ');
      return `${month} ${year.slice(-2)}`;
    }
    return label;
  });

  return (
    <RNLineChart
      data={{
        ...data,
        labels: formattedLabels
      }}
      width={chartWidth}
      height={height}
      yAxisLabel=""
      yAxisSuffix={yAxisSuffix}
      chartConfig={{
        backgroundColor: '#ffffff',
        backgroundGradientFrom: '#ffffff',
        backgroundGradientTo: '#ffffff',
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(227, 24, 55, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(71, 85, 105, ${opacity})`,
        style: {
          borderRadius: 16,
        },
        propsForDots: showDots ? {
          r: '4',
          strokeWidth: '1',
          stroke: '#E31837',
        } : undefined,
        propsForBackgroundLines: {
          strokeDasharray: '6, 4',
          strokeWidth: 1,
          stroke: '#e2e8f0',
        },
        propsForLabels: {
          fontSize: 10,
          rotation: 0,
        },
        strokeWidth: 2,
        ...(isArea && {
          fillShadowGradient: '#E31837',
          fillShadowGradientOpacity: 0.3,
          fillShadowGradientFrom: '#E31837',
          fillShadowGradientTo: '#ffffff',
        }),
      }}
      style={{
        marginVertical: 8,
        borderRadius: 16,
      }}
      bezier
      withInnerLines={false}
      withShadow={false}
      fromZero
    />
  );
}; 