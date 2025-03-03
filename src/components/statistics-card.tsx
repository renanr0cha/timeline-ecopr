import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { CommunityStatistic } from '../types';

interface StatisticsCardProps {
  statistic: CommunityStatistic;
  hideMonth?: boolean;
}

/**
 * Statistics card component to display community statistics with animations
 * Provides a visually appealing presentation of processing time data
 */
export const StatisticsCard = ({ statistic, hideMonth = false }: StatisticsCardProps) => {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start();

    // Progress bar animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: false,
      easing: Easing.out(Easing.cubic),
    }).start();
  }, [statistic.transition_type]);

  // Format transition type for display
  const formatTransitionType = (type: string): string => {
    switch (type) {
      case 'aor-p2':
        return 'AOR → P2';
      case 'p2-ecopr':
        return 'P2 → ecoPR';
      case 'ecopr-pr_card':
        return 'ecoPR → PR Card';
      default:
        return type;
    }
  };

  // Determine the color based on transition type
  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'aor-p2':
        return 'bg-blue-500';
      case 'p2-ecopr':
        return 'bg-maple-leaf';
      case 'ecopr-pr_card':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Calculate progress width as percentage of some max value (using 365 days as max for scaling)
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', `${Math.min(100, (statistic.avg_days / 365) * 100)}%`],
  });

  // Create separate styles for standalone vs grouped cards
  const cardClasses = hideMonth ? 'pt-2' : 'rounded-xl pt-2 bg-white shadow-sm';

  return (
    <Animated.View
      className={cardClasses}
      style={[
        hideMonth ? null : styles.cardShadow,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        },
      ]}>
      <View className="mb-3 flex-row items-center justify-between">
        <View className={`rounded-full px-3 py-1 ${getTypeColor(statistic.transition_type)}`}>
          <Text className="text-xs font-medium text-white">
            {formatTransitionType(statistic.transition_type)}
          </Text>
        </View>
        {statistic.month_year && !hideMonth && (
          <Text className="text-xs font-medium text-gray-500">{statistic.month_year}</Text>
        )}
      </View>

      <View className="mb-3">
        <View className="mb-1 flex-row justify-between">
          <Text className="text-sm text-gray-600">Average Processing Time</Text>
          <Text className="font-bold text-gray-800">{statistic.avg_days.toFixed(1)} days</Text>
        </View>

        {/* Progress bar */}
        <View className="h-2 w-full rounded-full bg-gray-100">
          <Animated.View
            className={`h-2 rounded-full ${getTypeColor(statistic.transition_type)}`}
            style={{ width: progressWidth }}
          />
        </View>
      </View>

      <View className="flex-row justify-between">
        <View className="flex-1 items-center">
          <Text className="text-xs text-gray-500">Min</Text>
          <Text className="font-medium text-gray-800">{statistic.min_days} days</Text>
        </View>
        <View className="flex-1 items-center">
          <Text className="text-xs text-gray-500">Max</Text>
          <Text className="font-medium text-gray-800">{statistic.max_days} days</Text>
        </View>
        <View className="flex-1 items-center">
          <Text className="text-xs text-gray-500">Sample Size</Text>
          <Text className="font-medium text-gray-800">{statistic.count}</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
});
