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
import { SectionHeader } from '../components/section-header';
import { ThemedButton } from '../components/themed-button';
import { ThemedCard } from '../components/themed-card';
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
      existingEntries?: TimelineEntry[];
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
        const milestones: EntryType[] = [
          'submission', 
          'biometrics', 
          'aor', 
          'medicals', 
          'p2', 
          'bg_check', 
          'ecopr', 
          'copr', 
          'landing', 
          'pr_card'
        ];
        const currentIndex = milestones.findIndex(m => m === entryType);
        
        if (currentIndex < milestones.length - 1) {
          setNextStepType(milestones[currentIndex + 1]);
          setShowAddNextStepPrompt(true);
        }
      },
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
      <View className="flex-1 px-4 py-6">
        {/* Header Section */}
        <View className="mb-6 flex-row items-center justify-between">
          <SectionHeader
            title="Your PR Journey"
            description="Track your progress towards permanent residency"
            size="lg"
            className="flex-1 mb-0"
          />

          <TouchableOpacity
            onPress={toggleMockData}
            className={`rounded-full px-3 py-1.5 ${
              useMockData ? 'bg-success/10' : 'bg-inactive/10'
            }`}>
            <Text className={`text-xs font-medium ${
              useMockData ? 'text-success' : 'text-inactive'
            }`}>
              {useMockData ? 'Using Sample Data' : 'Use Sample Data'}
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ThemedCard className="items-center justify-center py-12">
            <ActivityIndicator size="large" color="#FF1E38" />
            <Text className="mt-4 text-text-secondary">
              Loading your journey data...
            </Text>
          </ThemedCard>
        ) : (
          <>
            {/* Progress Summary - Always shown, with empty state if no entries */}
            <ThemedCard className="mb-6" variant="elevated">
              <ProgressSummary 
                entries={entries} 
                onAddEntry={handleAddEntry} 
                emptyState={!hasEntries}
              />
            </ThemedCard>

            {/* Collapsible Timeline Section */}
            {hasEntries && (
              <ThemedCard className="mb-6" variant="default">
                {/* Timeline Header with Toggle */}
                <TouchableOpacity
                  onPress={toggleTimelineExpanded}
                  className="flex-row items-center justify-between">
                  <SectionHeader
                    title="Journey History"
                    description="View your milestone timeline"
                    className="flex-1 mb-0"
                  />
                  <Animated.View style={{ transform: [{ rotate }] }}>
                    <Ionicons name="chevron-down" size={24} color="#6C757D" />
                  </Animated.View>
                </TouchableOpacity>

                {/* Timeline Content */}
                {timelineExpanded && (
                  <View className="mt-4">
                    <TimelineView entries={entries} />
                  </View>
                )}
              </ThemedCard>
            )}

            {/* Add Next Step Prompt */}
            {showAddNextStepPrompt && nextStepType && (
              <ThemedCard className="mb-6" variant="elevated">
                <SectionHeader
                  title="Next Step Available"
                  description={`Ready to record your ${nextStepType.toUpperCase()} milestone? Adding it now will keep your timeline up-to-date.`}
                />
                <View className="mt-4 flex-row justify-end space-x-3">
                  <ThemedButton
                    variant="secondary"
                    size="sm"
                    onPress={() => handleAddNextStepResponse(false)}>
                    Later
                  </ThemedButton>
                  <ThemedButton
                    variant="primary"
                    size="sm"
                    onPress={() => handleAddNextStepResponse(true)}>
                    {`Add ${nextStepType.toUpperCase()}`}
                  </ThemedButton>
                </View>
              </ThemedCard>
            )}

            {/* Statistics Card */}
            <TouchableOpacity onPress={goToStatistics} className="mb-6">
              <ThemedCard variant="elevated">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-text-primary">
                      Community Insights
                    </Text>
                    <Text className="text-text-secondary">
                      See how your timeline compares
                    </Text>
                  </View>
                  <View className="rounded-full bg-maple-red/10 p-2">
                    <Ionicons name="bar-chart-outline" size={24} color="#FF1E38" />
                  </View>
                </View>
              </ThemedCard>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScreenContent>
  );
}
