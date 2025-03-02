import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { ProgressSummary } from '../components/progress-summary';
import { ScreenContent } from '../components/screen-content';
import { TimelineView } from '../components/timeline-view';
import { logger } from '../lib/logger';
import { timelineService } from '../services/timeline-service';
import { EntryType, RootStackParamList, TimelineEntry } from '../types';
import { loadMockDataForCurrentDevice } from '../utils/mock-data';

// Updated to include onComplete in the AddEntry params
type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList & {
    AddEntry: {
      deviceId: string;
      entryType?: EntryType;
      entryId?: string;
      onComplete?: () => void;
    };
  },
  'Home'
>;

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
  const [showAddNextStepPrompt, setShowAddNextStepPrompt] = useState(false);
  const [nextStepType, setNextStepType] = useState<EntryType | null>(null);
  const [timelineExpanded, setTimelineExpanded] = useState(false);
  const navigation = useNavigation<HomeScreenNavigationProp>();

  // Animation for timeline section
  const rotateAnim = useState(new Animated.Value(0))[0];
  const contentHeight = useState(new Animated.Value(0))[0];

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
   * Handle adding an entry and showing the next step prompt
   */
  const handleAddEntry = (entryType: EntryType) => {
    setNextStepType(entryType);
    navigation.navigate('AddEntry', { 
      deviceId, 
      entryType,
      existingEntries: entries,
      onComplete: () => {
        loadEntries(); // Reload entries after adding
        
        // Determine the next step to prompt for
        const milestones: EntryType[] = ['aor', 'p2', 'ecopr', 'pr_card'];
        const currentIndex = milestones.findIndex(m => m === entryType);
        
        if (currentIndex < milestones.length - 1) {
          setNextStepType(milestones[currentIndex + 1]);
          setShowAddNextStepPrompt(true);
        }
      }
    });
  };

  /**
   * Handle the response to the "Add next step?" prompt
   */
  const handleAddNextStepResponse = (addNext: boolean) => {
    if (addNext && nextStepType) {
      handleAddEntry(nextStepType);
    } else {
      setShowAddNextStepPrompt(false);
      setNextStepType(null);
    }
  };

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

  // Rotate interpolation for the chevron icon
  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  // Check if user has entries
  const hasEntries = entries.length > 0;

  return (
    <ScreenContent scrollable>
      <View className="mb-4 flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-gray-800">Your PR Timeline</Text>

        <TouchableOpacity
          onPress={toggleMockData}
          className={`rounded-full px-3 py-1 ${useMockData ? 'bg-green-500' : 'bg-gray-300'}`}>
          <Text className="text-xs font-medium text-white">
            {useMockData ? 'Using Sample Data' : 'Use Sample Data'}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="items-center justify-center py-12">
          <ActivityIndicator size="large" color="#0284c7" />
          <Text className="mt-4 text-gray-500">Loading your journey data...</Text>
        </View>
      ) : (
        <>
          {/* Progress Summary - Always shown, with empty state if no entries */}
          <ProgressSummary 
            entries={entries} 
            onAddEntry={handleAddEntry} 
            emptyState={!hasEntries}
          />

          {/* Collapsible Timeline Section - Not in a card component anymore */}
          {hasEntries && (
            <View className="mb-6">
              {/* Timeline Header with Toggle */}
              <TouchableOpacity
                onPress={toggleTimelineExpanded}
                className="flex-row items-center justify-between p-4">
                <Text className="text-lg font-bold text-gray-800">Journey History</Text>
                <Animated.View style={{ transform: [{ rotate }] }}>
                  <Ionicons name="chevron-down" size={24} color="#64748b" />
                </Animated.View>
              </TouchableOpacity>

              {/* Timeline Content - using maxHeight instead of height for better behavior */}
              {timelineExpanded && (
                <View className="bg-white">
                  <TimelineView entries={entries} />
                </View>
              )}
            </View>
          )}

          {/* Add Next Step Prompt - shown after adding an entry */}
          {showAddNextStepPrompt && nextStepType && (
            <View className="mb-6 rounded-xl bg-white p-4 shadow-sm">
              <Text className="mb-2 text-lg font-bold text-gray-800">
                Next Step Available
              </Text>
              <Text className="mb-4 text-gray-600">
                Ready to record your {nextStepType.toUpperCase()} milestone? Adding it now will keep your timeline up-to-date.
              </Text>
              <View className="flex-row justify-end space-x-3">
                <TouchableOpacity
                  onPress={() => handleAddNextStepResponse(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2">
                  <Text className="text-gray-700">Later</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleAddNextStepResponse(true)}
                  className="rounded-lg bg-blue-500 px-4 py-2">
                  <Text className="text-white">Add {nextStepType.toUpperCase()}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Statistics Card - Always shown */}
          <TouchableOpacity
            onPress={goToStatistics}
            className="mb-6 rounded-xl bg-white p-5 shadow-sm">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-lg font-bold text-gray-800">Community Insights</Text>
                <Text className="text-gray-500">See how your timeline compares</Text>
              </View>
              <Ionicons name="bar-chart-outline" size={28} color="#8b5cf6" />
            </View>
          </TouchableOpacity>
        </>
      )}
    </ScreenContent>
  );
}
