import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';

import { ProgressSummary } from '../components/progress-summary';
import { ScreenContent } from '../components/screen-content';
import { TimelineView } from '../components/timeline-view';
import { logger } from '../lib/logger';
import { timelineService } from '../services/timeline-service';
import { RootStackParamList, TimelineEntry } from '../types';
import { loadMockDataForCurrentDevice } from '../utils/mock-data';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

interface HomeScreenProps {
  route: {
    params: {
      deviceId: string;
    };
  };
}

/**
 * Home screen component that displays the user's timeline entries
 * Shows a visual progress summary and timeline view
 */
export default function HomeScreen({ route }: HomeScreenProps) {
  const { deviceId } = route.params;
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [useMockData, setUseMockData] = useState(false);
  const navigation = useNavigation<HomeScreenNavigationProp>();

  /**
   * Load timeline entries from the service or mock data
   */
  const loadEntries = async () => {
    try {
      setLoading(true);

      if (useMockData) {
        // Load mock data
        const mockEntries = loadMockDataForCurrentDevice(deviceId);
        setEntries(mockEntries);
        logger.info('Loaded mock timeline entries', { count: mockEntries.length });
      } else {
        // Load real data from the service
        const data = await timelineService.getUserTimeline(deviceId);
        setEntries(data);
        logger.info('Loaded timeline entries', { count: data.length });
      }
    } catch (error) {
      logger.error('Error loading timeline entries', { error });
      Alert.alert(
        'Error Loading Timeline',
        'There was a problem loading your timeline. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  // Load entries when component mounts or when useMockData changes
  useEffect(() => {
    loadEntries();
  }, [deviceId, useMockData]);

  /**
   * Toggle between real and mock data
   */
  const toggleMockData = () => {
    setUseMockData((prev) => !prev);
  };

  /**
   * Navigate to the statistics screen
   */
  const goToStatistics = () => {
    navigation.navigate('Statistics', { deviceId });
  };

  /**
   * Navigate to add entry screen with a specific entry type
   */
  const addEntry = (entryType?: TimelineEntry['entry_type']) => {
    navigation.navigate('AddEntry', { deviceId, entryType });
  };

  // Order entries by date (newest first)
  const sortedEntries = [...entries].sort((a, b) => {
    return new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime();
  });

  return (
    <ScreenContent scrollable padding>
      <View className="mb-4 flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-gray-800">Timeline</Text>

        <TouchableOpacity
          onPress={toggleMockData}
          className={`rounded-full px-3 py-1 ${useMockData ? 'bg-green-500' : 'bg-gray-300'}`}>
          <Text className="text-xs font-medium text-white">
            {useMockData ? 'Using Mock Data' : 'Use Mock Data'}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="items-center justify-center py-12">
          <ActivityIndicator size="large" color="#0284c7" />
          <Text className="mt-4 text-gray-500">Loading timeline...</Text>
        </View>
      ) : (
        <>
          {/* Progress Summary */}
          <ProgressSummary entries={entries} />

          {/* Timeline View */}
          {entries.length === 0 ? (
            <View className="items-center justify-center rounded-xl bg-white py-8 shadow-sm">
              <Ionicons name="calendar-outline" size={48} color="#94a3b8" />
              <Text className="mb-2 mt-4 text-center text-gray-500">No timeline entries yet</Text>
              <Text className="mb-6 px-4 text-center text-gray-400">
                Add your first entry to start tracking your PR journey
              </Text>
              <TouchableOpacity
                onPress={() => addEntry()}
                className="rounded-full bg-blue-500 px-6 py-3">
                <Text className="font-medium text-white">Add First Entry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TimelineView entries={sortedEntries} />
          )}

          {/* Action Buttons */}
          <View className="mb-4 mt-6 flex-row justify-between">
            <TouchableOpacity
              className="mr-2 flex-1 flex-row items-center justify-center rounded-lg bg-blue-500 py-3 shadow-sm"
              onPress={() => addEntry()}>
              <Ionicons name="add-circle-outline" size={20} color="white" />
              <Text className="ml-2 font-medium text-white">Add Entry</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="ml-2 flex-1 flex-row items-center justify-center rounded-lg bg-purple-500 py-3 shadow-sm"
              onPress={goToStatistics}>
              <Ionicons name="bar-chart-outline" size={20} color="white" />
              <Text className="ml-2 font-medium text-white">Statistics</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScreenContent>
  );
}
