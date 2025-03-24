import React from 'react';
import { Dimensions } from 'react-native';
import { BarChart as RNBarChart } from 'react-native-chart-kit';

interface BarChartProps {
  data: {
    labels: string[];
    datasets: {
      data: number[];
      color?: (opacity: number) => string;
    }[];
  };
  height?: number;
  yAxisSuffix?: string;
  horizontal?: boolean;
  isWeekly?: boolean;
}

export const BarChart = ({
  data,
  height = 180,
  yAxisSuffix = '',
  horizontal = false,
  isWeekly = false,
}: BarChartProps) => {
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = horizontal
    ? Math.max(screenWidth - 48, 250)
    : Math.max(screenWidth - 48, (data.labels.length || 1) * 60);

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

  const chartHeight = horizontal ? Math.max(240, data.labels.length * 40) : height;

  return (
    <RNBarChart
      data={{
        ...data,
        labels: formattedLabels,
      }}
      width={chartWidth}
      height={chartHeight}
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
          borderRadius: 12,
        },
        barPercentage: 1, // Increased from 0.7 to make bars 30% wider
        propsForBackgroundLines: {
          strokeDasharray: '6, 4',
          strokeWidth: 1,
          stroke: '#e2e8f0',
        },
        propsForLabels: {
          fontSize: 10,
          fontWeight: '700',
          rotation: 0,
        },
        formatTopBarValue: (value: number) => `${value}${yAxisSuffix}`,
        formatYLabel: (yLabel: string) => `${parseInt(yLabel, 10)}${yAxisSuffix}`,
        barRadius: 8, // Rounded top corners
        fillShadowGradient: '#E31837',
        fillShadowGradientOpacity: 1,
      }}
      style={{
        marginVertical: 8,
        borderRadius: 16,
      }}
      showBarTops={false}
      withInnerLines
      fromZero
      showValuesOnTopOfBars
      {...(horizontal
        ? {
            horizontalLabelRotation: 0,
            verticalLabelRotation: 0,
          }
        : {})}
    />
  );
};
