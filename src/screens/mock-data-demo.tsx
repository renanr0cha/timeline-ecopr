import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { BarChart, LineChart, ProgressChart, StackedBarChart } from 'react-native-chart-kit';

import { ProgressSummary } from '../components/progress-summary';
import { ScreenContent } from '../components/screen-content';
import { StatisticsCard } from '../components/statistics-card';
import { TimelineView } from '../components/timeline-view';
import { CommunityStatistic, EntryType, TimelineEntry, WeeklyBreakdown } from '../types';
import { generateMockTimelineEntries } from '../utils/mock-data';

/**
 * Demo screen to showcase the components with mock data
 */
export default function MockDataDemo() {
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([]);
  const [statistics, setStatistics] = useState<CommunityStatistic[]>([]);
  const [loading, setLoading] = useState(true);
  const [timelineExpanded, setTimelineExpanded] = useState(false);
  const [weeklyBreakdown, setWeeklyBreakdown] = useState<WeeklyBreakdown[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  
  // Chart type selection states
  const [timeSeriesChartType, setTimeSeriesChartType] = useState<'line' | 'bar' | 'area'>('line');
  const [weeklyChartType, setWeeklyChartType] = useState<'bar' | 'horizontal' | 'line'>('bar');
  const [distributionChartType, setDistributionChartType] = useState<'stacked' | 'progress' | 'horizontal'>('stacked');
  
  const screenWidth = Dimensions.get('window').width;

  // Animation for timeline section
  const rotateAnim = useState(new Animated.Value(0))[0];
  const contentHeight = useState(new Animated.Value(0))[0];

  // Rotate interpolation for the chevron icon
  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  // Load mock data on component mount
  useEffect(() => {
    loadMockData();
  }, []);

  /**
   * Load all mock data
   */
  const loadMockData = async () => {
    setLoading(true);
    try {
      // Generate mock timeline entries
      const mockEntries = generateMockTimelineEntries('demo-device-id', 20);

      // Filter entries for the demo device
      const deviceEntries = mockEntries.filter((entry) => entry.device_id === 'demo-device-id');
      setTimelineEntries(deviceEntries);

      // Generate mock statistics
      const mockStats: CommunityStatistic[] = [
        {
          transition_type: 'aor-p2',
          avg_days: 85.2,
          min_days: 45,
          max_days: 180,
          count: 124,
          month_year: 'Jan 2023',
          waiting_count: 65,
        },
        {
          transition_type: 'p2-ecopr',
          avg_days: 112.7,
          min_days: 60,
          max_days: 245,
          count: 98,
          month_year: 'Feb 2023',
          waiting_count: 78,
          week_breakdown: [
            { week_range: 'Feb 1-7', count: 18 },
            { week_range: 'Feb 8-14', count: 22 },
            { week_range: 'Feb 15-21', count: 25 },
            { week_range: 'Feb 22-28', count: 13 },
          ],
        },
        {
          transition_type: 'ecopr-pr_card',
          avg_days: 42.5,
          min_days: 28,
          max_days: 90,
          count: 76,
          month_year: 'Mar 2023',
          waiting_count: 42,
        },
      ];

      setStatistics(mockStats);
    } catch (error) {
      console.error('Error loading mock data', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Mock function to handle adding an entry
   */
  const handleAddEntry = (entryType: EntryType) => {
    alert(`Adding ${entryType.toUpperCase()} entry`);
  };

  /**
   * Toggle timeline section expansion
   */
  const toggleTimelineExpanded = () => {
    const newValue = !timelineExpanded;
    setTimelineExpanded(newValue);
    
    Animated.parallel([
      Animated.timing(rotateAnim, {
        toValue: newValue ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(contentHeight, {
        toValue: newValue ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  };

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
        // Otherwise generate mock weekly data
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

  // Get data for the waiting chart - now supporting multiple chart types
  const getWaitingChartData = () => {
    if (!statistics.length) {
      return {
        labels: ['No Data'],
        datasets: [{ data: [0] }],
      };
    }

    const labels = statistics.map((stat) => stat.month_year || 'Unknown');
    const data = statistics.map((stat) => stat.waiting_count || stat.count || 0);

    // For area chart, we need different data structure
    if (timeSeriesChartType === 'area') {
      return {
        labels,
        datasets: [
          {
            data,
            color: (opacity = 1) => `rgba(168, 85, 247, ${opacity})`,
            strokeWidth: 2,
            fillShadowGradient: 'rgba(168, 85, 247, 0.8)',
            fillShadowGradientOpacity: 0.3,
          },
        ],
      };
    }

    // Line and Bar charts use same data structure
    return {
      labels,
      datasets: [
        {
          data,
          color: (opacity = 1) => `rgba(168, 85, 247, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };
  };

  // Get data for the weekly breakdown chart - supporting multiple chart types
  const getWeeklyBreakdownChartData = () => {
    if (!weeklyBreakdown.length) {
      return {
        labels: ['No Data'],
        datasets: [{ data: [0] }],
      };
    }

    const labels = weeklyBreakdown.map((week) => week.week_range);
    const data = weeklyBreakdown.map((week) => week.count);

    return {
      labels,
      datasets: [
        {
          data,
          color: (opacity = 1) => `rgba(168, 85, 247, ${opacity})`,
          strokeWidth: weeklyChartType === 'line' ? 2 : 0,
        },
      ],
    };
  };

  // Get data for the distribution chart - using stacked bar chart
  const getDistributionChartData = () => {
    if (!statistics.length) {
      return {
        labels: ['No Data'],
        legend: ['No Data'],
        data: [[0]],
        barColors: ['#ddd'],
      };
    }

    // For stacked bar chart
    if (distributionChartType === 'stacked') {
      return {
        labels: ['Jan', 'Feb', 'Mar'],
        legend: ['AOR', 'P2', 'ecoPR', 'PR Card'],
        data: [
          [12, 18, 8, 4],
          [9, 15, 12, 6],
          [7, 9, 11, 9]
        ],
        barColors: ['#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b'],
      };
    }
    
    // For progress chart
    else if (distributionChartType === 'progress') {
      return {
        labels: ['AOR', 'P2', 'ecoPR', 'PR Card'],
        data: [0.23, 0.35, 0.26, 0.16], // Normalize to values between 0-1
        colors: ['#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b'],
      };
    }
    
    // For horizontal bar chart
    else {
      return {
        labels: ['AOR', 'P2', 'ecoPR', 'PR Card'],
        datasets: [
          {
            data: [28, 42, 31, 19],
            color: (opacity = 1) => `rgba(110, 86, 207, ${opacity})`,
            strokeWidth: 0,
          },
        ],
      };
    }
  };

  // Sort entries by date (newest first)
  const sortedEntries = [...timelineEntries].sort((a, b) => {
    return new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime();
  });

  // Group statistics by month
  const getStatisticsByMonth = () => {
    if (!statistics.length) return [];

    const monthMap = new Map<string, CommunityStatistic[]>();
    
    statistics.forEach(stat => {
      if (stat.month_year) {
        if (!monthMap.has(stat.month_year)) {
          monthMap.set(stat.month_year, []);
        }
        monthMap.get(stat.month_year)!.push(stat);
      }
    });
    
    return Array.from(monthMap.entries())
      .map(([month, stats]) => ({ month, statistics: stats }));
  };

  if (loading) {
    return (
      <ScreenContent>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0284c7" />
          <Text className="mt-4 text-gray-500">Loading mock data...</Text>
        </View>
      </ScreenContent>
    );
  }

  // Chart selection component
  const ChartTypeSelector = ({ 
    currentType, 
    options, 
    onSelect 
  }: { 
    currentType: string, 
    options: {value: string, label: string}[], 
    onSelect: (type: any) => void 
  }) => (
    <View className="flex-row justify-center my-2">
      {options.map((option) => (
        <TouchableOpacity
          key={option.value}
          onPress={() => onSelect(option.value)}
          className={`mx-1 px-3 py-1 rounded-full ${
            currentType === option.value ? 'bg-purple-500' : 'bg-gray-200'
          }`}
        >
          <Text className={`text-xs ${
            currentType === option.value ? 'text-white' : 'text-gray-700'
          }`}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <ScreenContent scrollable>
      <View className="px-4 pb-6 pt-2">
        <Text className="mb-2 text-2xl font-bold text-gray-800">UI Components Demo</Text>
        <Text className="mb-6 text-gray-500">Preview of all UI components with mock data</Text>

        <View className="mb-8">
          <Text className="mb-4 text-xl font-semibold text-gray-800">Interactive PR Journey</Text>
          <ProgressSummary 
            entries={timelineEntries} 
            onAddEntry={handleAddEntry}
            emptyState={false}
          />
        </View>

        <View className="mb-8">
          <Text className="mb-4 text-xl font-semibold text-gray-800">Empty State Journey</Text>
          <ProgressSummary 
            entries={[]} 
            onAddEntry={handleAddEntry}
            emptyState={true}
          />
        </View>

        <View className="mb-8">
          <Text className="mb-4 text-xl font-semibold text-gray-800">Collapsible Timeline</Text>
          
          {/* Timeline Header with Toggle */}
          <TouchableOpacity
            onPress={toggleTimelineExpanded}
            className="flex-row items-center justify-between rounded-t-xl bg-white p-4 shadow-sm">
            <Text className="text-lg font-bold text-gray-800">Detailed Timeline</Text>
            <Animated.View style={{ transform: [{ rotate }] }}>
              <Ionicons name="chevron-down" size={24} color="#64748b" />
            </Animated.View>
          </TouchableOpacity>

          {/* Timeline Content - conditionally visible */}
          <Animated.View 
            style={{ 
              height: contentHeight.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 250]
              }),
              overflow: 'hidden',
            }}
            className="rounded-b-xl bg-white shadow-sm"
          >
            <TimelineView entries={sortedEntries.slice(0, 5)} />
          </Animated.View>
        </View>

        <View className="mb-8">
          <Text className="mb-4 text-xl font-semibold text-gray-800">Charts</Text>
          
          {/* Time Series Chart Section */}
          <View className="mb-6 rounded-xl bg-white p-4 shadow-sm">
            <Text className="mb-2 text-lg font-bold text-gray-800">P2 Waiting for ecoPR by Month</Text>
            
            <ChartTypeSelector
              currentType={timeSeriesChartType}
              options={[
                {value: 'line', label: 'Line Chart'},
                {value: 'bar', label: 'Bar Chart'},
                {value: 'area', label: 'Area Chart'}
              ]}
              onSelect={(type) => setTimeSeriesChartType(type)}
            />
            
            <Text className="mb-2 text-xs text-gray-500">
              {timeSeriesChartType === 'line' && 'Line charts better visualize trends over time'}
              {timeSeriesChartType === 'bar' && 'Bar charts provide clear comparison between periods'}
              {timeSeriesChartType === 'area' && 'Area charts emphasize the magnitude of values over time'}
            </Text>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              {timeSeriesChartType === 'line' && (
                <LineChart
                  data={getWaitingChartData()}
                  width={Math.max(screenWidth - 40, statistics.length * 120)}
                  height={180}
                  yAxisLabel=""
                  yAxisSuffix=""
                  chartConfig={{
                    backgroundColor: '#ffffff',
                    backgroundGradientFrom: '#f3e8ff',
                    backgroundGradientTo: '#ffffff',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(168, 85, 247, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(71, 85, 105, ${opacity})`,
                    style: {
                      borderRadius: 16,
                    },
                    propsForDots: {
                      r: '6',
                      strokeWidth: '2',
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
                    strokeWidth: 3,
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
              
              {timeSeriesChartType === 'bar' && (
                <BarChart
                  data={getWaitingChartData()}
                  width={Math.max(screenWidth - 40, statistics.length * 120)}
                  height={180}
                  yAxisLabel=""
                  yAxisSuffix=""
                  chartConfig={{
                    backgroundColor: '#ffffff',
                    backgroundGradientFrom: '#f3e8ff',
                    backgroundGradientTo: '#ffffff',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(168, 85, 247, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(71, 85, 105, ${opacity})`,
                    style: {
                      borderRadius: 16,
                    },
                    barPercentage: 0.7,
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
                />
              )}
              
              {timeSeriesChartType === 'area' && (
                <LineChart
                  data={getWaitingChartData()}
                  width={Math.max(screenWidth - 40, statistics.length * 120)}
                  height={180}
                  yAxisLabel=""
                  yAxisSuffix=""
                  chartConfig={{
                    backgroundColor: '#ffffff',
                    backgroundGradientFrom: '#f3e8ff',
                    backgroundGradientTo: '#ffffff',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(168, 85, 247, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(71, 85, 105, ${opacity})`,
                    style: {
                      borderRadius: 16,
                    },
                    propsForDots: {
                      r: '4',
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
                    fillShadowGradientFrom: '#a855f7',
                    fillShadowGradientTo: '#ffffff',
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
            
            <View className="mt-2">
              <Text className="mb-2 text-center text-xs text-gray-500">
                Tap on a month to see weekly breakdown
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row flex-wrap">
                  {statistics.map((stat) => (
                    <TouchableOpacity
                      key={stat.month_year}
                      onPress={() => handleMonthSelect(stat.month_year || '')}
                      className={`m-1 rounded-full px-3 py-1 ${
                        selectedMonth === stat.month_year ? 'bg-purple-500' : 'bg-gray-200'
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
          </View>
          
          {/* Weekly Breakdown Chart Section */}
          {selectedMonth && weeklyBreakdown.length > 0 && (
            <View className="mb-6 rounded-xl bg-white p-4 shadow-sm">
              <Text className="mb-2 text-lg font-bold text-gray-800">
                Weekly Breakdown: {selectedMonth}
              </Text>
              
              <ChartTypeSelector
                currentType={weeklyChartType}
                options={[
                  {value: 'bar', label: 'Bar Chart'},
                  {value: 'horizontal', label: 'Horizontal Bars'},
                  {value: 'line', label: 'Line Chart'}
                ]}
                onSelect={(type) => setWeeklyChartType(type)}
              />
              
              <Text className="mb-2 text-xs text-gray-500">
                {weeklyChartType === 'bar' && 'Bar charts effectively compare discrete time periods'}
                {weeklyChartType === 'horizontal' && 'Horizontal bars highlight differences between categories'}
                {weeklyChartType === 'line' && 'Line charts show week-to-week progression'}
              </Text>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                {weeklyChartType === 'bar' && (
                  <BarChart
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
                      barPercentage: 0.7,
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
                        rotation: 90, // Rotate labels for horizontal chart
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
          )}
          
          {/* Distribution Chart - Replacing the Pie Chart */}
          <View className="mb-6 rounded-xl bg-white p-4 shadow-sm">
            <Text className="mb-2 text-lg font-bold text-gray-800">
              Application Status Distribution
            </Text>
            
            <ChartTypeSelector
              currentType={distributionChartType}
              options={[
                {value: 'stacked', label: 'Stacked Bars'},
                {value: 'horizontal', label: 'Horizontal Bars'},
                {value: 'progress', label: 'Progress Rings'}
              ]}
              onSelect={(type) => setDistributionChartType(type)}
            />
            
            <Text className="mb-2 text-xs text-gray-500">
              {distributionChartType === 'stacked' && 'Stacked bars show both absolute values and proportions'}
              {distributionChartType === 'horizontal' && 'Horizontal bars directly compare quantities'}
              {distributionChartType === 'progress' && 'Progress rings visualize completion percentages'}
            </Text>
            
            <View className="items-center">
              {distributionChartType === 'stacked' && (
                <StackedBarChart
                  data={{
                    labels: ['Jan', 'Feb', 'Mar'],
                    legend: ['AOR', 'P2', 'ecoPR', 'PR Card'],
                    data: [
                      [12, 18, 8, 4],
                      [9, 15, 12, 6],
                      [7, 9, 11, 9]
                    ],
                    barColors: ['#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b'],
                  }}
                  width={screenWidth - 40}
                  height={220}
                  chartConfig={{
                    backgroundColor: '#ffffff',
                    backgroundGradientFrom: '#f3f3ff',
                    backgroundGradientTo: '#ffffff',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(110, 86, 207, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(71, 85, 105, ${opacity})`,
                    style: {
                      borderRadius: 16,
                    },
                    barPercentage: 0.5,
                    propsForBackgroundLines: {
                      strokeDasharray: '6, 4',
                      strokeWidth: 1,
                      stroke: '#e2e8f0',
                    },
                    propsForLabels: {
                      fontSize: 10,
                      rotation: 0,
                    },
                  }}
                  style={{
                    marginVertical: 8,
                    borderRadius: 16,
                  }}
                  hideLegend={false}
                />
              )}
              
              {distributionChartType === 'horizontal' && (
                <BarChart
                  data={{
                    labels: ['AOR', 'P2', 'ecoPR', 'PR Card'],
                    datasets: [
                      {
                        data: [28, 42, 31, 19],
                        color: (opacity = 1) => `rgba(110, 86, 207, ${opacity})`,
                        strokeWidth: 0,
                      },
                    ],
                  }}
                  width={screenWidth - 40}
                  height={220}
                  yAxisLabel=""
                  yAxisSuffix=""
                  chartConfig={{
                    backgroundColor: '#ffffff',
                    backgroundGradientFrom: '#f3f3ff',
                    backgroundGradientTo: '#ffffff',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(110, 86, 207, ${opacity})`,
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
              
              {distributionChartType === 'progress' && (
                <ProgressChart
                  data={{
                    labels: ['AOR', 'P2', 'ecoPR', 'PR Card'],
                    data: [0.23, 0.35, 0.26, 0.16],
                    colors: ['#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b'],
                  }}
                  width={screenWidth - 40}
                  height={220}
                  chartConfig={{
                    backgroundColor: '#ffffff',
                    backgroundGradientFrom: '#f3f3ff',
                    backgroundGradientTo: '#ffffff',
                    decimalPlaces: 1,
                    color: (opacity = 1, index) => {
                      const colors = ['#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b'];
                      return index !== undefined ? colors[index] : `rgba(110, 86, 207, ${opacity})`;
                    },
                    labelColor: (opacity = 1) => `rgba(71, 85, 105, ${opacity})`,
                    style: {
                      borderRadius: 16,
                    },
                    strokeWidth: 8,
                  }}
                  style={{
                    marginVertical: 8,
                    borderRadius: 16,
                  }}
                  hideLegend={false}
                />
              )}
            </View>
            
            <Text className="mt-2 text-center text-xs italic text-gray-500">
              Distribution across different application status categories
            </Text>
          </View>
        </View>

        <View className="mb-8">
          <Text className="mb-4 text-xl font-semibold text-gray-800">Statistics Cards</Text>
          
          {/* Individual Statistics Cards */}
          {statistics.map((stat, index) => (
            <View key={index} className="mb-4">
              <StatisticsCard statistic={stat} />
            </View>
          ))}
          
          {/* Grouped Statistics Cards */}
          {getStatisticsByMonth().map(({ month, statistics: monthStats }) => (
            <View key={month} className="mb-4 rounded-xl bg-white p-4 shadow-sm">
              <Text className="mb-4 text-lg font-bold text-gray-800">{month}</Text>
              <View className="rounded-lg overflow-hidden border border-gray-100">
                {monthStats.map((stat, index) => (
                  <React.Fragment key={index}>
                    <StatisticsCard statistic={stat} hideMonth />
                    {index < monthStats.length - 1 && (
                      <View className="h-[1px] bg-gray-200 mx-4" />
                    )}
                  </React.Fragment>
                ))}
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScreenContent>
  );
}
function alert(arg0: string) {
  throw new Error('Function not implemented.');
}

