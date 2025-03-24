import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Text, TouchableOpacity, View } from 'react-native';

import { ProgressSummary } from '../components/progress-summary';
import { ScreenContent } from '../components/screen-content';
import { SectionHeader } from '../components/section-header';
import { ThemedButton } from '../components/themed-button';
import { ThemedCard } from '../components/themed-card';
import { TimelineView } from '../components/timeline-view';
import { colors } from '../constants/colors';
import { signOut } from '../lib/auth';
import { logger } from '../lib/logger';
import { supabase } from '../lib/supabase';
import { timelineService } from '../services/timeline-service';
import { EntryType, TimelineEntry } from '../types';
import { loadMockDataForCurrentUser } from '../utils/mock-data';

interface HomeScreenProps {
  navigation: any;
}

/**
 * Home screen component that displays the user's timeline entries
 * Shows a visual progress summary and timeline view
 */
export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [useMockData, setUseMockData] = useState(false);
  const [showAddNextStepPrompt, setShowAddNextStepPrompt] = useState(false);
  const [nextStepType, setNextStepType] = useState<EntryType | null>(null);
  const [timelineExpanded, setTimelineExpanded] = useState(false);

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
        // Load mock data - now we need to get the userId from auth
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const userId = session?.user?.id || 'mock-user-id';
        const mockEntries = loadMockDataForCurrentUser(userId);
        setEntries(mockEntries);
        logger.info('Loaded mock timeline entries', { count: mockEntries.length });
      } else {
        // Load real data from the service
        const data = await timelineService.getUserTimeline();
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
  }, [useMockData]);

  // Load entries when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadEntries();
      // Reset the add button prompt state when returning to screen
      setShowAddNextStepPrompt(false);
      setNextStepType(null);
    }, [])
  );

  /**
   * Navigate to add entry screen with the specified entry type
   * @param entryType Entry type to add
   */
  const navigateToAddEntry = (entryType: EntryType) => {
    navigation.navigate('AddEntry', {
      entryType,
      existingEntries: entries,
    });
  };

  /**
   * Navigate to edit entry screen with the entry to edit
   * @param entry The timeline entry to edit
   */
  const navigateToEditEntry = (entry: TimelineEntry) => {
    navigation.navigate('AddEntry', {
      entryType: entry.entry_type,
      entryId: entry.id,
      mode: 'edit',
      existingEntries: entries,
    });
  };

  // Handle add entry for a specific milestone type
  const handleAddEntry = (entryType: EntryType) => {
    navigateToAddEntry(entryType);
  };

  /**
   * Handle editing an existing entry
   */
  const handleEditEntry = (entry: TimelineEntry) => {
    navigateToEditEntry(entry);
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
   * Handle user logout
   */
  const handleLogout = async () => {
    try {
      await signOut();
      logger.info('User logged out successfully');
    } catch (error) {
      logger.error('Error signing out', { error });
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  /**
   * Navigate to the statistics screen
   */
  const goToStatistics = () => {
    navigation.navigate('StatisticsTab');
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

  // Add this function to navigate to MockDataDemo
  const goToMockDataDemo = () => {
    navigation.navigate('MockDataDemo');
  };

  // Update useEffect to add the header right button
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={goToMockDataDemo} className="mr-2">
          <Ionicons name="layers-outline" size={24} color={colors.maple.red} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  return (
    <ScreenContent scrollable>
      <View className="flex-1 py-6">
        {/* Header Section */}
        <View className="mb-6 flex-row items-center justify-between">
          <View className="w-full flex-row items-center justify-between">
            <TouchableOpacity
              onPress={toggleMockData}
              className={`mr-2 rounded-full px-3 py-1.5 ${
                useMockData ? 'bg-success/10' : 'bg-inactive/10'
              }`}>
              <Text
                className={`text-xs font-medium ${useMockData ? 'text-success' : 'text-inactive'}`}>
                {useMockData ? 'Using Sample Data' : 'Use Sample Data'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleLogout} className="rounded-full bg-maple-red/10 p-2">
              <Ionicons name="log-out-outline" size={20} color={colors.maple.red} />
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <ThemedCard className="items-center justify-center py-12">
            <ActivityIndicator size="large" color={colors.maple.red} />
            <Text className="mt-4 text-text-secondary">Loading your journey data...</Text>
          </ThemedCard>
        ) : (
          <>
            {/* Progress Summary - Always shown, with empty state if no entries */}
            <ProgressSummary
              entries={entries}
              onAddEntry={handleAddEntry}
              onEditEntry={handleEditEntry}
              emptyState={!hasEntries}
            />
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
                    className="mb-0 flex-1"
                  />
                  <Animated.View style={{ transform: [{ rotate }] }}>
                    <Ionicons name="chevron-down" size={24} color={colors.text.secondary} />
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
                    <Text className="text-lg font-bold text-text-primary">Community Insights</Text>
                    <Text className="text-text-secondary">See how your timeline compares</Text>
                  </View>
                  <View className="rounded-full bg-maple-red/10 p-2">
                    <Ionicons name="bar-chart-outline" size={24} color={colors.maple.red} />
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
