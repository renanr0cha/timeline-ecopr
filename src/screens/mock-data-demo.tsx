import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

import { ProgressSummary } from '../components/progress-summary';
import { ScreenContent } from '../components/screen-content';
import { StatisticsCard } from '../components/statistics-card';
import { TimelineView } from '../components/timeline-view';
import { CommunityStatistic, TimelineEntry } from '../types';
import { generateMockTimelineEntries } from '../utils/mock-data';

/**
 * Demo screen to showcase the components with mock data
 */
export default function MockDataDemo() {
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([]);
  const [statistics, setStatistics] = useState<CommunityStatistic[]>([]);
  const [loading, setLoading] = useState(true);

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
        },
        {
          transition_type: 'p2-ecopr',
          avg_days: 112.7,
          min_days: 60,
          max_days: 245,
          count: 98,
          month_year: 'Feb 2023',
        },
        {
          transition_type: 'ecopr-pr_card',
          avg_days: 42.5,
          min_days: 28,
          max_days: 90,
          count: 76,
          month_year: 'Mar 2023',
        },
      ];

      setStatistics(mockStats);
    } catch (error) {
      console.error('Error loading mock data', error);
    } finally {
      setLoading(false);
    }
  };

  // Sort entries by date (newest first)
  const sortedEntries = [...timelineEntries].sort((a, b) => {
    return new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime();
  });

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

  return (
    <ScreenContent scrollable>
      <View className="px-4 pb-6 pt-2">
        <Text className="mb-2 text-2xl font-bold text-gray-800">Mock Data Demo</Text>
        <Text className="mb-6 text-gray-500">Preview of UI components with mock data</Text>

        <View className="mb-8">
          <Text className="mb-4 text-xl font-semibold text-gray-800">Journey Progress</Text>
          <ProgressSummary entries={timelineEntries} />
        </View>

        <View className="mb-8">
          <Text className="mb-4 text-xl font-semibold text-gray-800">Timeline</Text>
          <TimelineView entries={sortedEntries.slice(0, 5)} />

          {timelineEntries.length > 5 && (
            <TouchableOpacity className="mt-2 items-center">
              <Text className="font-medium text-blue-500">View all entries</Text>
            </TouchableOpacity>
          )}
        </View>

        <View className="mb-4">
          <Text className="mb-4 text-xl font-semibold text-gray-800">Statistics</Text>
          {statistics.map((stat, index) => (
            <StatisticsCard key={index} statistic={stat} />
          ))}
        </View>
      </View>
    </ScreenContent>
  );
}
