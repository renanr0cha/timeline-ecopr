import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { BarChart } from '../components/charts/bar-chart';
import { LineChart } from '../components/charts/line-chart';
import { ScreenContent } from '../components/screen-content';
import { SectionHeader } from '../components/section-header';
import { StatisticsCard } from '../components/statistics-card';
import { ThemedCard } from '../components/themed-card';
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
    <ThemedCard className="mb-2">
      <SectionHeader title={month} size="sm" />
      <View>
        {statistics.map((stat, index) => (
          <React.Fragment key={index}>
            <StatisticsCard statistic={stat} hideMonth />
            {index < statistics.length - 1 && <View className="mx-4 h-[1px] bg-gray-200" />}
          </React.Fragment>
        ))}
      </View>
    </ThemedCard>
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
  const [timeSeriesChartType, setTimeSeriesChartType] = useState<'line' | 'bar' | 'area'>('bar');
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

      // Set the transition type based on view mode
      const effectiveTransitionType =
        viewMode === 'p2_waiting_ecopr'
          ? 'p2-ecopr'
          : selectedTransitionType;

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
          { week_range: '1-7', count: Math.floor(Math.random() * 5) + 1 },
          { week_range: '8-14', count: Math.floor(Math.random() * 5) + 1 },
          { week_range: '15-21', count: Math.floor(Math.random() * 5) + 1 },
          { week_range: '22-28', count: Math.floor(Math.random() * 5) + 1 },
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
    className,
  }: {
    currentType: string;
    options: { value: string; label: string }[];
    onSelect: (type: any) => void;
    className?: string;
  }) => (
    <View className={`my-2 flex-row justify-center ${className || ''}`}>
      {options.map((option) => (
        <TouchableOpacity
          key={option.value}
          onPress={() => onSelect(option.value)}
          className={`mx-1 rounded-full px-3 py-1.5 ${
            currentType === option.value 
              ? 'bg-maple-leaf shadow-sm' 
              : 'bg-gray-100'
          }`}>
          <Text
            className={`text-center text-sm font-medium ${
              currentType === option.value ? 'text-white' : 'text-gray-700'
            }`}>
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
    // If no specific transition type is selected (All), show all transitions
    // Otherwise, filter by the selected transition type
    const filteredStats = statistics.filter(stat => 
      !selectedTransitionType || stat.transition_type === selectedTransitionType
    );
    return {
      labels: filteredStats.map(stat => stat.month_year || ''),
      datasets: [
        {
          data: filteredStats.map(stat => stat.avg_days || 0),
        }
      ]
    };
  };

  /**
   * Prepare data for the P2 waiting ecoPR chart
   */
  const getWaitingChartData = () => {
    const filteredStats = statistics.filter(stat => stat.transition_type === 'p2-ecopr');
    return {
      labels: filteredStats.map(stat => stat.month_year || ''),
      datasets: [
        {
          data: filteredStats.map(stat => stat.waiting_count || stat.count || 0),
        }
      ]
    };
  };

  /**
   * Prepare data for the weekly breakdown chart
   */
  const getWeeklyBreakdownChartData = () => {
    return {
      labels: weeklyBreakdown.map(week => week.week_range),
      datasets: [
        {
          data: weeklyBreakdown.map(week => week.count || 0),
        }
      ]
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

    return (
      <ThemedCard className="mb-4">
        <View>
          <Text className="mb-4 text-lg font-bold text-gray-800">{chartTitle}</Text>

          <View className="flex-row justify-end mb-2">
            <ChartTypeSelector
              currentType={timeSeriesChartType}
              options={[
                { value: 'line', label: 'Line Chart' },
                { value: 'bar', label: 'Bar Chart' },
                { value: 'area', label: 'Area Chart' }
              ]}
              onSelect={setTimeSeriesChartType}
            />
          </View>

          <Text className="mb-2 text-xs text-gray-500">
            {timeSeriesChartType === 'line' && 'Line charts better visualize trends over time'}
            {timeSeriesChartType === 'bar' && 'Bar charts provide clear comparison between periods'}
            {timeSeriesChartType === 'area' && 'Area charts emphasize the magnitude of values over time'}
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            ref={chartsScrollViewRef}
            contentContainerStyle={{ paddingHorizontal: 5 }}>
            <View className="min-w-full">
              {timeSeriesChartType === 'line' && (
                <LineChart
                  data={chartData}
                  yAxisSuffix={yAxisSuffix}
                  showDots
                  isWeekly={selectedMonth !== null}
                />
              )}

              {timeSeriesChartType === 'bar' && (
                <BarChart
                  data={chartData}
                  yAxisSuffix={yAxisSuffix}
                  isWeekly={selectedMonth !== null}
                />
              )}

              {timeSeriesChartType === 'area' && (
                <LineChart
                  data={chartData}
                  yAxisSuffix={yAxisSuffix}
                  showDots={false}
                  isArea
                  isWeekly={selectedMonth !== null}
                />
              )}
            </View>
          </ScrollView>

          <Text className="mt-2 text-center text-xs italic text-gray-500">
            Swipe horizontally to view more months
          </Text>

          {viewMode === 'p2_waiting_ecopr' && (
            <View className="mt-4">
              <Text className="mb-2 text-center text-xs text-gray-500">
                Select a month to see weekly breakdown
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row flex-wrap">
                  {statistics
                    .filter(stat => stat.transition_type === 'p2-ecopr')
                    .map((stat) => (
                      <TouchableOpacity
                        key={stat.month_year}
                        onPress={() => handleMonthSelect(stat.month_year || '')}
                        className={`m-1 rounded-full px-3 py-1 ${
                          selectedMonth === stat.month_year ? 'bg-maple-leaf' : 'bg-gray-200'
                        }`}>
                        <Text
                          className={`text-xs ${
                            selectedMonth === stat.month_year ? 'text-white' : 'text-gray-700'
                          }`}>
                          {stat.month_year}
                        </Text>
                      </TouchableOpacity>
                    ))}
                </View>
              </ScrollView>
            </View>
          )}
        </View>
      </ThemedCard>
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
            { value: 'bar', label: 'Bar' },
            { value: 'line', label: 'Line' },
            { value: 'horizontal', label: 'Horizontal' },
          ]}
          onSelect={setWeeklyChartType}
          className="text-white"
        />

        <Text className="mb-2 text-xs text-gray-500">
          {weeklyChartType === 'bar' && 'Bar charts effectively compare discrete time periods'}
          {weeklyChartType === 'horizontal' &&
            'Horizontal bars highlight differences between categories'}
          {weeklyChartType === 'line' && 'Line charts show week-to-week progression'}
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="min-w-full">
            {weeklyChartType === 'line' ? (
              <LineChart
                data={getWeeklyBreakdownChartData()}
                showDots
              />
            ) : weeklyChartType === 'horizontal' ? (
              <BarChart
                data={{
                  labels: getWeeklyBreakdownChartData().labels.reverse(),
                  datasets: [{
                    data: getWeeklyBreakdownChartData().datasets[0].data.reverse()
                  }]
                }}
                horizontal
                isWeekly
              />
            ) : (
              <BarChart
                data={getWeeklyBreakdownChartData()}
                isWeekly
              />
            )}
          </View>
        </ScrollView>
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
    <ScreenContent>
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <Animated.View style={{ opacity: fadeAnim }}>
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-2xl font-bold text-gray-800">Community Statistics</Text>
            <TouchableOpacity
              onPress={toggleMockData}
              className={`rounded-full px-3 py-1 ${
                useMockData ? 'bg-maple-leaf' : 'bg-gray-200'
              }`}>
              <Text
                className={`text-xs font-medium ${
                  useMockData ? 'text-white' : 'text-gray-700'
                }`}>
                {useMockData ? 'Using Mock Data' : 'Use Mock Data'}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="mb-4">
            <ChartTypeSelector
              currentType={viewMode}
              options={VIEW_MODES}
              onSelect={setViewMode}
            />
          </View>

          {/* Transition Type Selector */}
          {viewMode === 'processing_times' && (
            <View className="mb-4">
              <Text className="mb-2 text-sm font-medium text-gray-700">Filter by Transition Type</Text>
              <ChartTypeSelector
                currentType={selectedTransitionType || 'all'}
                options={TRANSITION_TYPES.map(type => ({
                  value: type.value || 'all',
                  label: type.label
                }))}
                onSelect={(value) => setSelectedTransitionType(value === 'all' ? undefined : value)}
              />
            </View>
          )}

          {renderChart()}
          {renderWeeklyBreakdown()}

          {/* Monthly Statistics Cards */}
          <View className="mt-6 mb-6">
            <Text className="mb-4 text-lg font-bold text-gray-800">Monthly Statistics</Text>
            {getStatisticsByMonth().map(({ month, statistics: monthStats }) => (
              <MonthlyStatisticsGroup
                key={month}
                month={month}
                statistics={monthStats}
              />
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    </ScreenContent>
  );
}
