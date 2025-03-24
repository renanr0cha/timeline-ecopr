import { RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import { ProgressBar } from '../components/progress-bar';
import { colors } from '../constants/colors';
import { supabase } from '../lib/supabase';
import { RootStackParamList, TransitionStatistics } from '../types';
import { getMockTransitionStatistics } from '../utils/mock-data';

type StatisticsScreenRouteProp = RouteProp<RootStackParamList, 'StatisticsTab'>;

type StatisticsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'StatisticsTab'
>;

type StatisticsScreenProps = {
  route: StatisticsScreenRouteProp;
  navigation: StatisticsScreenNavigationProp;
};

/**
 * Screen for displaying community statistics with enhanced visualizations
 */
export default function StatisticsScreen({ navigation, route }: StatisticsScreenProps) {
  console.log('StatisticsScreen initializing...', {
    hasRoute: !!route,
    hasNavigation: !!navigation,
  });

  // Move all hooks outside the try-catch
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<TransitionStatistics | null>(null);

  useEffect(() => {
    console.log('StatisticsScreen useEffect running');
    const loadStatistics = async () => {
      try {
        console.log('Loading statistics data...');
        setLoading(true);
        setError(null);

        // Get the current user session
        console.log('Getting user session...');
        const {
          data: { session },
        } = await supabase.auth.getSession();

        console.log('Session check complete:', { hasSession: !!session });
        if (!session?.user) {
          console.log('No user session found');
          setError('No authenticated user found. Please log in.');
          setLoading(false);
          return;
        }

        // For now, we're still using mock statistics
        console.log('Loading mock statistics...');
        const mockStats = getMockTransitionStatistics('p1');
        console.log('Mock statistics loaded:', { hasStats: !!mockStats });

        setStatistics(mockStats);
        console.log('Statistics state updated');
      } catch (err) {
        console.error('Failed to load statistics:', err);
        setError('Failed to load statistics. Please try again later.');
      } finally {
        setLoading(false);
        console.log('Loading state set to false');
      }
    };

    loadStatistics();
  }, []);

  console.log('Navigation comparison:', {
    propsNavigation: !!navigation,
    hookNavigation: !!nav,
  });

  console.log('StatisticsScreen render state:', {
    loading,
    hasError: !!error,
    hasStats: !!statistics,
  });

  try {
    if (loading) {
      console.log('Rendering loading state');
      return (
        <View className="flex-1 items-center justify-center bg-white">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text>Loading statistics...</Text>
        </View>
      );
    }

    if (error) {
      console.log('Rendering error state:', { error });
      return (
        <View className="flex-1 items-center justify-center bg-white p-4">
          <Text className="text-lg font-bold text-red-500">{error}</Text>
        </View>
      );
    }

    if (!statistics) {
      console.log('Rendering no-data state');
      return (
        <View className="flex-1 items-center justify-center bg-white p-4">
          <Text className="text-lg font-bold text-gray-500">No statistics available</Text>
        </View>
      );
    }

    // Check for LinearGradient issues
    console.log('About to render with LinearGradient');
    console.log('Gradient colors:', {
      start: colors.bgGradientStart,
      end: colors.bgGradientEnd,
    });

    // Debugging the statistics data structure
    console.log('Statistics data structure check:', {
      hasMilestones: !!statistics.milestoneNotes,
      milestoneCount: statistics.milestoneNotes?.length,
      submissionToAOR: statistics.submissionToAOR,
    });

    return (
      <ScrollView
        className="flex-1 p-4"
        onLayout={() => console.log('ScrollView onLayout triggered')}>
        <View
          className="mb-4 rounded-lg bg-white p-4 shadow-sm"
          onLayout={() => console.log('First card onLayout triggered')}>
          <Text className="mb-2 text-xl font-bold text-gray-800">Processing Times</Text>
          <Text className="mb-4 text-sm text-gray-600">
            Based on your timeline and similar applications
          </Text>

          <View className="mb-4">
            <View className="mb-1 flex-row justify-between">
              <Text className="text-gray-700">Submission to AOR</Text>
              <Text className="font-semibold text-gray-800">{statistics.submissionToAOR} days</Text>
            </View>
            <ProgressBar progress={statistics.submissionToAOR / 120} />
          </View>

          <View className="mb-4">
            <View className="mb-1 flex-row justify-between">
              <Text className="text-gray-700">AOR to Biometrics</Text>
              <Text className="font-semibold text-gray-800">{statistics.aorToBiometrics} days</Text>
            </View>
            <ProgressBar progress={statistics.aorToBiometrics / 90} />
          </View>

          <View className="mb-4">
            <View className="mb-1 flex-row justify-between">
              <Text className="text-gray-700">Biometrics to Medicals</Text>
              <Text className="font-semibold text-gray-800">
                {statistics.biometricsToMedicals} days
              </Text>
            </View>
            <ProgressBar progress={statistics.biometricsToMedicals / 30} />
          </View>

          <View className="mb-4">
            <View className="mb-1 flex-row justify-between">
              <Text className="text-gray-700">Background Check Duration</Text>
              <Text className="font-semibold text-gray-800">
                {statistics.backgroundCheckDuration} days
              </Text>
            </View>
            <ProgressBar progress={statistics.backgroundCheckDuration / 90} />
          </View>

          <View>
            <View className="mb-1 flex-row justify-between">
              <Text className="text-gray-700">Total Processing Time</Text>
              <Text className="font-semibold text-gray-800">
                {statistics.totalProcessingTime} days
              </Text>
            </View>
            <ProgressBar progress={statistics.totalProcessingTime / 300} />
          </View>
        </View>

        <View
          className="mb-4 rounded-lg bg-white p-4 shadow-sm"
          onLayout={() => console.log('Second card onLayout triggered')}>
          <Text className="mb-2 text-xl font-bold text-gray-800">Completion Stats</Text>

          <View className="mb-2 flex-row justify-between">
            <Text className="text-gray-700">Application Progress</Text>
            <Text className="font-semibold text-gray-800">{statistics.applicationProgress}%</Text>
          </View>
          <ProgressBar progress={statistics.applicationProgress / 100} />

          <Text className="mt-4 text-sm text-gray-500">
            Based on similar applications, you are approximately {statistics.estimatedDaysRemaining}{' '}
            days away from receiving your final decision.
          </Text>
        </View>

        <View
          className="rounded-lg bg-white p-4 shadow-sm"
          onLayout={() => console.log('Third card onLayout triggered')}>
          <Text className="mb-2 text-xl font-bold text-gray-800">Timeline Analysis</Text>

          <View className="ml-2 border-l-2 border-gray-300 pl-4">
            {statistics.milestoneNotes.map((note, index) => (
              <View
                key={index}
                className="mb-4"
                onLayout={() => console.log(`Milestone ${index} onLayout triggered`)}>
                <View className="absolute -left-[22px] h-3 w-3 rounded-full bg-blue-500" />
                <Text className="mb-1 font-semibold text-gray-800">{note.title}</Text>
                <Text className="text-gray-600">{note.description}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    );
  } catch (err) {
    console.error('Fatal error in StatisticsScreen:', err);
    return (
      <View className="flex-1 items-center justify-center bg-white p-4">
        <Text className="text-lg font-bold text-red-500">Error</Text>
        <Text className="text-center text-gray-700">
          {err instanceof Error ? err.message : 'An unexpected error occurred'}
        </Text>
      </View>
    );
  }
}
