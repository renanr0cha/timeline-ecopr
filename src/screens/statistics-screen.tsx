import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    Text,
    View
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { ProgressBar } from '../components/progress-bar';
import { colors } from '../constants/colors';
import { supabase } from '../lib/supabase';
import { RootStackParamList, TransitionStatistics } from '../types';
import { getMockTransitionStatistics } from '../utils/mock-data';

type StatisticsScreenRouteProp = RouteProp<RootStackParamList, 'Statistics'>;

type StatisticsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Statistics'
>;

type StatisticsScreenProps = {
  route: StatisticsScreenRouteProp;
  navigation: StatisticsScreenNavigationProp;
};

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
export const StatisticsScreen: React.FC<StatisticsScreenProps> = ({
  navigation,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<TransitionStatistics | null>(null);

  useEffect(() => {
    const loadStatistics = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get the current user session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          setError('No authenticated user found. Please log in.');
          setLoading(false);
          return;
        }

        const userId = session.user.id;
        
        // For now, we're still using mock statistics
        const mockStats = getMockTransitionStatistics('p1');
        
        // In the future, you'll likely fetch real statistics from Supabase using userId
        // const stats = await timelineService.getUserStatistics(userId);
        
        setStatistics(mockStats);
      } catch (err) {
        console.error('Failed to load statistics:', err);
        setError('Failed to load statistics. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadStatistics();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-white p-4">
        <Text className="text-red-500 font-bold text-lg">{error}</Text>
      </View>
    );
  }

  if (!statistics) {
    return (
      <View className="flex-1 justify-center items-center bg-white p-4">
        <Text className="text-gray-500 font-bold text-lg">No statistics available</Text>
      </View>
    );
  }

  return (
    <LinearGradient 
      colors={[colors.bgGradientStart, colors.bgGradientEnd]} 
      className="flex-1"
    >
      <ScrollView className="flex-1 p-4">
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-xl font-bold mb-2 text-gray-800">Processing Times</Text>
          <Text className="text-sm text-gray-600 mb-4">Based on your timeline and similar applications</Text>
          
          <View className="mb-4">
            <View className="flex-row justify-between mb-1">
              <Text className="text-gray-700">Submission to AOR</Text>
              <Text className="font-semibold text-gray-800">{statistics.submissionToAOR} days</Text>
            </View>
            <ProgressBar progress={statistics.submissionToAOR / 120} />
          </View>
          
          <View className="mb-4">
            <View className="flex-row justify-between mb-1">
              <Text className="text-gray-700">AOR to Biometrics</Text>
              <Text className="font-semibold text-gray-800">{statistics.aorToBiometrics} days</Text>
            </View>
            <ProgressBar progress={statistics.aorToBiometrics / 90} />
          </View>
          
          <View className="mb-4">
            <View className="flex-row justify-between mb-1">
              <Text className="text-gray-700">Biometrics to Medicals</Text>
              <Text className="font-semibold text-gray-800">{statistics.biometricsToMedicals} days</Text>
            </View>
            <ProgressBar progress={statistics.biometricsToMedicals / 30} />
          </View>
          
          <View className="mb-4">
            <View className="flex-row justify-between mb-1">
              <Text className="text-gray-700">Background Check Duration</Text>
              <Text className="font-semibold text-gray-800">{statistics.backgroundCheckDuration} days</Text>
            </View>
            <ProgressBar progress={statistics.backgroundCheckDuration / 90} />
          </View>
          
          <View>
            <View className="flex-row justify-between mb-1">
              <Text className="text-gray-700">Total Processing Time</Text>
              <Text className="font-semibold text-gray-800">{statistics.totalProcessingTime} days</Text>
            </View>
            <ProgressBar progress={statistics.totalProcessingTime / 300} />
          </View>
        </View>
        
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-xl font-bold mb-2 text-gray-800">Completion Stats</Text>
          
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-700">Application Progress</Text>
            <Text className="font-semibold text-gray-800">{statistics.applicationProgress}%</Text>
          </View>
          <ProgressBar progress={statistics.applicationProgress / 100} />
          
          <Text className="text-sm text-gray-500 mt-4">
            Based on similar applications, you are approximately {statistics.estimatedDaysRemaining} days 
            away from receiving your final decision.
          </Text>
        </View>
        
        <View className="bg-white rounded-lg p-4 shadow-sm">
          <Text className="text-xl font-bold mb-2 text-gray-800">Timeline Analysis</Text>
          
          <View className="border-l-2 border-gray-300 pl-4 ml-2">
            {statistics.milestoneNotes.map((note, index) => (
              <View key={index} className="mb-4">
                <View className="h-3 w-3 rounded-full bg-blue-500 absolute -left-[22px]" />
                <Text className="font-semibold text-gray-800 mb-1">{note.title}</Text>
                <Text className="text-gray-600">{note.description}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};
