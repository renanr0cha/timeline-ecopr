import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';

import { ScreenContent } from '../components/screen-content';
import { StatisticsCard } from '../components/statistics-card';
import { logger } from '../lib/logger';
import { statisticsService } from '../services/statistics-service';
import { CommunityStatistic, WeeklyBreakdown } from '../types';

/**
 * Type definition for chart data point click event
 */
interface DataPointClickEvent {
  index: number;
  value: number;
  dataset: {
    data: number[];
  };
  x: number;
  y: number;
}

/**
 * Component to group statistics cards by month
 */
interface MonthlyStatisticsGroupProps {
  month: string;
  statistics: CommunityStatistic[];
}

const MonthlyStatisticsGroup = ({ month, statistics }: MonthlyStatisticsGroupProps) => {
  if (!statistics.length) return null;

  return (
    <View className="mb-6 rounded-xl bg-white p-4 shadow-sm">
      <Text className="mb-4 text-lg font-bold text-gray-800">{month}</Text>
      <View className="overflow-hidden rounded-lg border border-gray-100">
        {statistics.map((stat, index) => (
          <React.Fragment key={index}>
            <StatisticsCard statistic={stat} hideMonth />
            {index < statistics.length - 1 && <View className="mx-4 h-[1px] bg-gray-200" />}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
};

/**
 * Transition type options for filtering
 */
const TRANSITION_TYPES = [
  { label: 'All', value: undefined },
  { label: 'AOR → P2', value: 'aor-p2' },
  { label: 'P2 → ecoPR', value: 'p2-ecopr' },
  { label: 'ecoPR → PR Card', value: 'ecopr-pr_card' },
];

/**
 * View modes for statistics display
 */
const VIEW_MODES = [
  { label: 'Processing Times', value: 'processing_times' },
  { label: 'P2 Waiting ecoPR', value: 'p2_waiting_ecopr' },
];

/**
 * Screen for displaying community statistics with enhanced visualizations
 */
export default function StatisticsScreen() {
  const [statistics, setStatistics] = useState<CommunityStatistic[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransitionType, setSelectedTransitionType] = useState<string | undefined>(
    undefined
  );
  const [viewMode, setViewMode] = useState<string>('p2_waiting_ecopr'); // Default to P2 waiting ecoPR view
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [weeklyBreakdown, setWeeklyBreakdown] = useState<WeeklyBreakdown[]>([]);
  const [useMockData, setUseMockData] = useState(statisticsService.useMockData);

  // Chart type selection states
  const [timeSeriesChartType, setTimeSeriesChartType] = useState<'line' | 'bar'>('bar');
  const [weeklyChartType, setWeeklyChartType] = useState<'bar' | 'horizontal' | 'line'>('bar');
  const [distributionChartType, setDistributionChartType] = useState<'stacked' | 'horizontal'>(
    'stacked'
  );

  const screenWidth = Dimensions.get('window').width;
  const fadeAnim = useState(new Animated.Value(0))[0];
  const chartsScrollViewRef = useRef<ScrollView>(null);

  /**
   * Toggle between real and mock data
   */
  const toggleMockData = () => {
    const newState = statisticsService.toggleMockData();
    setUseMockData(newState);
    loadStatistics(); // Reload data after toggling
  };

  /**
   * Load community statistics from the service
   */
  const loadStatistics = async () => {
    try {
      setLoading(true);
      fadeAnim.setValue(0);

      // Clear any selected month when loading new data
      setSelectedMonth(null);
      setWeeklyBreakdown([]);

      // If viewing P2 waiting ecoPR, use that specific transition type
      const effectiveTransitionType =
        viewMode === 'p2_waiting_ecopr' ? 'p2-ecopr' : selectedTransitionType;

      const data = await statisticsService.getCommunityStats(effectiveTransitionType);
      setStatistics(data);

      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

      // Scroll to the end after a short delay to ensure chart is rendered
      setTimeout(() => {
        if (chartsScrollViewRef.current) {
          chartsScrollViewRef.current.scrollToEnd({ animated: false });
        }
      }, 100);
    } catch (error) {
      logger.error('Error loading statistics', { error });
    } finally {
      setLoading(false);
    }
  };

  // Load statistics when component mounts or filter changes
  useEffect(() => {
    loadStatistics();
  }, [selectedTransitionType, viewMode]);

  /**
   * Handle month selection for weekly breakdown
   */
  const handleMonthSelect = (month: string) => {
    if (selectedMonth === month) {
      // Deselect if already selected
      setSelectedMonth(null);
      setWeeklyBreakdown([]);
    } else {
      // Select new month and get/generate weekly breakdown
      setSelectedMonth(month);

      // Find the statistic for the selected month
      const statForMonth = statistics.find(
        (stat) => stat.month_year === month && stat.transition_type === 'p2-ecopr'
      );

      // Use week_breakdown from the statistics if available
      if (statForMonth?.week_breakdown && statForMonth.week_breakdown.length > 0) {
        setWeeklyBreakdown(statForMonth.week_breakdown);
      } else {
        // Otherwise generate mock weekly data - this would normally come from the API
        const mockWeeklyData: WeeklyBreakdown[] = [
          { week_range: `${month} 1-7`, count: Math.floor(Math.random() * 5) + 1 },
          { week_range: `${month} 8-14`, count: Math.floor(Math.random() * 5) + 1 },
          { week_range: `${month} 15-21`, count: Math.floor(Math.random() * 5) + 1 },
          { week_range: `${month} 22-28`, count: Math.floor(Math.random() * 5) + 1 },
        ];

        setWeeklyBreakdown(mockWeeklyData);
      }
    }
  };

  // Chart selection component
  const ChartTypeSelector = ({
    currentType,
    options,
    onSelect,
  }: {
    currentType: string;
    options: { value: string; label: string }[];
    onSelect: (type: any) => void;
  }) => (
    <View className="my-2 flex-row justify-center">
      {options.map((option) => (
        <TouchableOpacity
          key={option.value}
          onPress={() => onSelect(option.value)}
          className={`mx-1 rounded-full px-3 py-1 ${
            currentType === option.value ? 'bg-purple-500' : 'bg-gray-200'
          }`}>
          <Text
            className={`text-xs ${currentType === option.value ? 'text-white' : 'text-gray-700'}`}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  /**
   * Prepare data for the processing times chart
   */
  const getProcessingTimesChartData = () => {
    // If no data, return empty chart data
    if (!statistics.length) {
      return {
        labels: ['No Data'],
        datasets: [{ data: [0] }],
      };
    }

    // Sort by date and take last 12 months for the chart (oldest to newest)
    const sortedStats = [...statistics].sort((a, b) => {
      if (!a.month_year || !b.month_year) return 0;
      return new Date(a.month_year).getTime() - new Date(b.month_year).getTime();
    });

    const recentStats = sortedStats.slice(-12);

    return {
      labels: recentStats.map((stat) => stat.month_year || 'Unknown'),
      datasets: [
        {
          data: recentStats.map((stat) => stat.avg_days),
          color: (opacity = 1) => {
            // Use different colors based on transition type when filtered
            if (selectedTransitionType === 'aor-p2') return `rgba(59, 130, 246, ${opacity})`;
            if (selectedTransitionType === 'p2-ecopr') return `rgba(168, 85, 247, ${opacity})`;
            if (selectedTransitionType === 'ecopr-pr_card') return `rgba(34, 197, 94, ${opacity})`;
            return `rgba(2, 132, 199, ${opacity})`;
          },
        },
      ],
    };
  };

  /**
   * Prepare data for the P2 waiting ecoPR chart
   */
  const getWaitingChartData = () => {
    // If no data, return empty chart data
    if (!statistics.length) {
      return {
        labels: ['No Data'],
        datasets: [{ data: [0] }],
      };
    }

    // Sort by date and take last 12 months for the chart (oldest to newest)
    const sortedStats = [...statistics].sort((a, b) => {
      if (!a.month_year || !b.month_year) return 0;
      return new Date(a.month_year).getTime() - new Date(b.month_year).getTime();
    });

    const recentStats = sortedStats.slice(-12);

    // For this view, we're showing the count of people with P2 waiting for ecoPR
    return {
      labels: recentStats.map((stat) => stat.month_year || 'Unknown'),
      datasets: [
        {
          data: recentStats.map(
            (stat) => stat.waiting_count || stat.count || Math.floor(Math.random() * 15) + 1
          ),
          color: (opacity = 1) => `rgba(168, 85, 247, ${opacity})`, // Purple for P2 → ecoPR
          strokeWidth: timeSeriesChartType === 'line' ? 2 : 0,
        },
      ],
    };
  };

  /**
   * Prepare data for the weekly breakdown chart
   */
  const getWeeklyBreakdownChartData = () => {
    if (!weeklyBreakdown.length) {
      return {
        labels: ['No Data'],
        datasets: [{ data: [0] }],
      };
    }

    return {
      labels: weeklyBreakdown.map((week) => week.week_range),
      datasets: [
        {
          data: weeklyBreakdown.map((week) => week.count),
          color: (opacity = 1) => `rgba(168, 85, 247, ${opacity})`, // Purple for P2 → ecoPR
          strokeWidth: weeklyChartType === 'line' ? 2 : 0,
        },
      ],
    };
  };

  /**
   * Get chart background gradient based on selected transition type
   */
  const getChartGradient = () => {
    if (viewMode === 'p2_waiting_ecopr') {
      return {
        backgroundGradientFrom: '#f3e8ff',
        backgroundGradientTo: '#ffffff',
      };
    }

    if (selectedTransitionType === 'aor-p2') {
      return {
        backgroundGradientFrom: '#dbeafe',
        backgroundGradientTo: '#ffffff',
      };
    }
    if (selectedTransitionType === 'p2-ecopr') {
      return {
        backgroundGradientFrom: '#f3e8ff',
        backgroundGradientTo: '#ffffff',
      };
    }
    if (selectedTransitionType === 'ecopr-pr_card') {
      return {
        backgroundGradientFrom: '#dcfce7',
        backgroundGradientTo: '#ffffff',
      };
    }
    return {
      backgroundGradientFrom: '#e0f2fe',
      backgroundGradientTo: '#ffffff',
    };
  };

  /**
   * Handle data point click for chart
   */
  const handleDataPointClick = (data: DataPointClickEvent) => {
    if (viewMode === 'p2_waiting_ecopr' && data && typeof data.index === 'number') {
      const chartData = getWaitingChartData();
      if (chartData.labels[data.index]) {
        handleMonthSelect(chartData.labels[data.index]);
      }
    }
  };

  /**
   * Calculate chart width for horizontal scrolling
   * Width per month * number of months, with minimum width to ensure 4 months are visible
   */
  const getChartWidth = (data: { labels: string[] }) => {
    const monthWidth = screenWidth / 3; // Show 3 months in the viewable area
    const totalWidth = Math.max(screenWidth, monthWidth * data.labels.length);
    return totalWidth;
  };

  const renderChart = () => {
    const chartData =
      viewMode === 'processing_times' ? getProcessingTimesChartData() : getWaitingChartData();

    const yAxisSuffix = viewMode === 'processing_times' ? ' days' : '';
    const chartTitle =
      viewMode === 'processing_times' ? 'Processing Times Trend' : 'P2 Waiting for ecoPR by Month';

    const chartWidth = getChartWidth(chartData);

    return (
      <View className="mb-6 rounded-xl bg-white p-4 shadow-sm">
        <Text className="mb-4 text-lg font-bold text-gray-800">{chartTitle}</Text>

        <ChartTypeSelector
          currentType={timeSeriesChartType}
          options={[
            { value: 'bar', label: 'Bar Chart' },
            { value: 'line', label: 'Line Chart' },
          ]}
          onSelect={(type) => setTimeSeriesChartType(type)}
        />

        <Text className="mb-2 text-xs text-gray-500">
          {timeSeriesChartType === 'line' && 'Line charts better visualize trends over time'}
          {timeSeriesChartType === 'bar' && 'Bar charts provide clear comparison between periods'}
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator
          ref={chartsScrollViewRef}
          contentContainerStyle={{ paddingHorizontal: 5 }}>
          {timeSeriesChartType === 'bar' && (
            <BarChart
              data={chartData}
              width={chartWidth}
              height={180}
              yAxisLabel=""
              yAxisSuffix={yAxisSuffix}
              chartConfig={{
                backgroundColor: '#ffffff',
                ...getChartGradient(),
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(2, 132, 199, 1)`,
                labelColor: (opacity = 1) => `rgba(71, 85, 105, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                barPercentage: 0.6,
                propsForBackgroundLines: {
                  strokeDasharray: '6, 4',
                  strokeWidth: 1,
                  stroke: '#e2e8f0',
                },
                propsForLabels: {
                  fontSize: 10,
                  rotation: 0,
                },
                barRadius: 5,
              }}
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
              verticalLabelRotation={0}
              showValuesOnTopOfBars
            />
          )}

          {timeSeriesChartType === 'line' && (
            <LineChart
              data={chartData}
              width={chartWidth}
              height={180}
              yAxisLabel=""
              yAxisSuffix={yAxisSuffix}
              chartConfig={{
                backgroundColor: '#ffffff',
                ...getChartGradient(),
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(2, 132, 199, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(71, 85, 105, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: '5',
                  strokeWidth: '1',
                  stroke: '#0284c7',
                },
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
          )}
        </ScrollView>

        <Text className="mt-2 text-center text-xs italic text-gray-500">
          Swipe horizontally to view more months
        </Text>

        {viewMode === 'p2_waiting_ecopr' && (
          <View className="mt-2">
            <Text className="mb-2 text-center text-xs text-gray-500">
              Tap on a month to see weekly breakdown
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row flex-wrap">
                {chartData.labels.map((month, index) => (
                  <TouchableOpacity
                    key={month}
                    onPress={() => handleMonthSelect(month)}
                    className={`m-1 rounded-full px-3 py-1 ${
                      selectedMonth === month ? 'bg-purple-500' : 'bg-gray-200'
                    }`}>
                    <Text
                      className={`text-xs ${
                        selectedMonth === month ? 'text-white' : 'text-gray-700'
                      }`}>
                      {month}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}
      </View>
    );
  };

  const renderWeeklyBreakdown = () => {
    if (!selectedMonth || !weeklyBreakdown.length) return null;

    return (
      <View className="mb-6 rounded-xl bg-white p-4 shadow-sm">
        <Text className="mb-4 text-lg font-bold text-gray-800">
          Weekly Breakdown: {selectedMonth}
        </Text>

        <ChartTypeSelector
          currentType={weeklyChartType}
          options={[
            { value: 'bar', label: 'Bar Chart' },
            { value: 'horizontal', label: 'Horizontal Bars' },
            { value: 'line', label: 'Line Chart' },
          ]}
          onSelect={(type) => setWeeklyChartType(type)}
        />

        <Text className="mb-2 text-xs text-gray-500">
          {weeklyChartType === 'bar' && 'Bar charts effectively compare discrete time periods'}
          {weeklyChartType === 'horizontal' &&
            'Horizontal bars highlight differences between categories'}
          {weeklyChartType === 'line' && 'Line charts show week-to-week progression'}
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator>
          {weeklyChartType === 'bar' && (
            <BarChart
              data={getWeeklyBreakdownChartData()}
              width={Math.max(screenWidth - 40, weeklyBreakdown.length * 100)}
              height={180}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#f3e8ff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(168, 85, 247, 1)`,
                labelColor: (opacity = 1) => `rgba(71, 85, 105, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                barPercentage: 0.6,
                propsForBackgroundLines: {
                  strokeDasharray: '6, 4',
                  strokeWidth: 1,
                  stroke: '#e2e8f0',
                },
                propsForLabels: {
                  fontSize: 10,
                  rotation: 0,
                },
                barRadius: 5,
              }}
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
              verticalLabelRotation={0}
              showValuesOnTopOfBars
            />
          )}

          {weeklyChartType === 'horizontal' && (
            <BarChart
              data={getWeeklyBreakdownChartData()}
              width={Math.max(screenWidth - 40, 250)}
              height={240}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#f3f3ff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(168, 85, 247, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(71, 85, 105, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                barPercentage: 0.6,
                propsForBackgroundLines: {
                  strokeDasharray: '6, 4',
                  strokeWidth: 1,
                  stroke: '#e2e8f0',
                },
                propsForLabels: {
                  fontSize: 10,
                  rotation: 0,
                },
                barRadius: 5,
              }}
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
              showValuesOnTopOfBars
              fromZero
              verticalLabelRotation={90}
            />
          )}

          {weeklyChartType === 'line' && (
            <LineChart
              data={getWeeklyBreakdownChartData()}
              width={Math.max(screenWidth - 40, weeklyBreakdown.length * 100)}
              height={180}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#f3f3ff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(168, 85, 247, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(71, 85, 105, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: '5',
                  strokeWidth: '1',
                  stroke: '#a855f7',
                },
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
          )}
        </ScrollView>

        <Text className="mt-2 text-center text-xs italic text-gray-500">
          Swipe horizontally to view all weeks
        </Text>
      </View>
    );
  };

  /**
   * Group statistics by month for card display
   */
  const getStatisticsByMonth = () => {
    if (!statistics.length) return [];

    // Create a map of month -> statistics
    const monthMap = new Map<string, CommunityStatistic[]>();

    statistics.forEach((stat) => {
      if (stat.month_year) {
        if (!monthMap.has(stat.month_year)) {
          monthMap.set(stat.month_year, []);
        }
        monthMap.get(stat.month_year)!.push(stat);
      }
    });

    // Sort months chronologically (newest first)
    return Array.from(monthMap.entries())
      .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
      .map(([month, stats]) => ({ month, statistics: stats }));
  };

  return (
    <ScreenContent scrollable>
      <View className="px-4 pb-6 pt-2">
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-gray-800">Community Insights</Text>

          <TouchableOpacity
            onPress={toggleMockData}
            className={`rounded-full px-3 py-1 ${useMockData ? 'bg-green-500' : 'bg-gray-300'}`}>
            <Text className="text-xs font-medium text-white">
              {useMockData ? 'Using Sample Data' : 'Use Sample Data'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text className="mb-6 text-gray-500">
          See how processing times compare across the PR journey
        </Text>

        {/* View Mode buttons */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          <View className="flex-row">
            {VIEW_MODES.map((mode) => (
              <TouchableOpacity
                key={mode.label}
                className={`mr-2 rounded-full px-4 py-2 ${
                  viewMode === mode.value ? 'bg-blue-500' : 'bg-gray-100'
                }`}
                onPress={() => setViewMode(mode.value)}>
                <Text
                  className={viewMode === mode.value ? 'font-medium text-white' : 'text-gray-600'}>
                  {mode.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Filter buttons - only show in processing times mode */}
        {viewMode === 'processing_times' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
            <View className="flex-row">
              {TRANSITION_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.label}
                  className={`mr-2 rounded-full px-4 py-2 ${
                    selectedTransitionType === type.value ? 'bg-blue-500' : 'bg-gray-100'
                  }`}
                  onPress={() => setSelectedTransitionType(type.value)}>
                  <Text
                    className={
                      selectedTransitionType === type.value
                        ? 'font-medium text-white'
                        : 'text-gray-600'
                    }>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}

        {loading ? (
          <View className="items-center justify-center py-12">
            <ActivityIndicator size="large" color="#0284c7" />
            <Text className="mt-4 text-gray-500">Loading statistics...</Text>
          </View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim }}>
            {statistics.length > 0 ? (
              <>
                {/* Main Chart */}
                {renderChart()}

                {/* Weekly Breakdown Chart (when a month is selected) */}
                {renderWeeklyBreakdown()}

                {/* Statistics cards grouped by month - only shown in processing times mode */}
                {viewMode === 'processing_times' && (
                  <View>
                    {getStatisticsByMonth().map(({ month, statistics: monthStats }) => (
                      <MonthlyStatisticsGroup key={month} month={month} statistics={monthStats} />
                    ))}
                  </View>
                )}
              </>
            ) : (
              <View className="items-center justify-center rounded-xl bg-white py-12">
                <Ionicons name="bar-chart-outline" size={64} color="#94a3b8" />
                <Text className="mt-4 text-center text-gray-500">
                  No data available for the selected filters
                </Text>
                <Text className="mt-2 text-center text-sm text-gray-400">
                  Try a different selection or check back later
                </Text>
              </View>
            )}
          </Animated.View>
        )}
      </View>
    </ScreenContent>
  );
}
