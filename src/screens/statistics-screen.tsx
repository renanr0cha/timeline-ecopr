import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BarChart } from 'react-native-chart-kit';

import { ScreenContent } from '../components/screen-content';
import { StatisticsCard } from '../components/statistics-card';
import { logger } from '../lib/logger';
import { statisticsService } from '../services/statistics-service';
import { CommunityStatistic } from '../types';

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
 * Screen for displaying community statistics with enhanced visualizations
 */
export default function StatisticsScreen() {
  const [statistics, setStatistics] = useState<CommunityStatistic[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransitionType, setSelectedTransitionType] = useState<string | undefined>(
    undefined
  );
  const screenWidth = Dimensions.get('window').width;
  const fadeAnim = useState(new Animated.Value(0))[0];

  /**
   * Load community statistics from the service
   */
  const loadStatistics = async () => {
    try {
      setLoading(true);
      fadeAnim.setValue(0);

      const data = await statisticsService.getCommunityStats(selectedTransitionType);
      setStatistics(data);

      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      logger.error('Error loading statistics', { error });
    } finally {
      setLoading(false);
    }
  };

  // Load statistics when component mounts or filter changes
  useEffect(() => {
    loadStatistics();
  }, [selectedTransitionType]);

  /**
   * Prepare data for the bar chart
   */
  const getChartData = () => {
    // If no data, return empty chart data
    if (!statistics.length) {
      return {
        labels: ['No Data'],
        datasets: [{ data: [0] }],
      };
    }

    // Sort by date and take last 6 for the chart
    const sortedStats = [...statistics].sort((a, b) => {
      if (!a.month_year || !b.month_year) return 0;
      return new Date(a.month_year).getTime() - new Date(b.month_year).getTime();
    });

    const recentStats = sortedStats.slice(-6);

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
   * Get chart background gradient based on selected transition type
   */
  const getChartGradient = () => {
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

  return (
    <ScreenContent scrollable>
      <View className="px-4 pb-6 pt-2">
        <Text className="mb-1 text-2xl font-bold text-gray-800">Community Statistics</Text>
        <Text className="mb-6 text-gray-500">View processing times from the community</Text>

        {/* Filter buttons */}
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

        {loading ? (
          <View className="items-center justify-center py-12">
            <ActivityIndicator size="large" color="#0284c7" />
            <Text className="mt-4 text-gray-500">Loading statistics...</Text>
          </View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim }}>
            {statistics.length > 0 ? (
              <>
                <View className="mb-6 rounded-xl bg-white p-4 shadow-sm">
                  <Text className="mb-4 text-lg font-bold text-gray-800">
                    Processing Times Trend
                  </Text>
                  <BarChart
                    data={getChartData()}
                    width={screenWidth - 40}
                    height={220}
                    yAxisLabel=""
                    yAxisSuffix=" days"
                    chartConfig={{
                      backgroundColor: '#ffffff',
                      ...getChartGradient(),
                      decimalPlaces: 0,
                      color: (opacity = 1) => `rgba(2, 132, 199, ${opacity})`,
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
                    }}
                    style={{
                      marginVertical: 8,
                      borderRadius: 16,
                    }}
                    verticalLabelRotation={30}
                    showValuesOnTopOfBars
                  />
                </View>

                {/* Statistics cards */}
                {statistics.map((stat, index) => (
                  <StatisticsCard key={index} statistic={stat} />
                ))}
              </>
            ) : (
              <View className="items-center justify-center rounded-xl bg-white py-12">
                <Ionicons name="bar-chart-outline" size={64} color="#94a3b8" />
                <Text className="mt-4 text-center text-gray-500">
                  No statistics available for this selection
                </Text>
              </View>
            )}
          </Animated.View>
        )}
      </View>
    </ScreenContent>
  );
}
