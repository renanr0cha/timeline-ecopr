import React, { useEffect } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { TimelineEntry } from '../types';

interface TimelineViewProps {
  entries: TimelineEntry[];
  onEntryPress?: (entry: TimelineEntry) => void;
}

/**
 * Timeline component that displays entries in a vertically connected timeline
 * Includes animation effects for a modern and visually appealing UI
 */
export const TimelineView = ({ entries, onEntryPress }: TimelineViewProps) => {
  // Create animated values for each entry (for fade-in and slide effects)
  const animatedValues = entries.map(() => new Animated.Value(0));

  useEffect(() => {
    // Animate entries sequentially with a staggered effect
    const animations = animatedValues.map((value, index) => {
      return Animated.timing(value, {
        toValue: 1,
        duration: 400,
        delay: index * 150, // Stagger the animations
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      });
    });

    Animated.stagger(100, animations).start();
  }, [entries.length]); // Re-animate when entries length changes

  if (!entries.length) {
    return (
      <View className="items-center justify-center py-8">
        <Text className="text-lg text-gray-500">No timeline entries yet</Text>
      </View>
    );
  }

  const getEntryTypeColor = (entryType: string) => {
    switch (entryType) {
      case 'aor':
        return 'bg-blue-500';
      case 'p2':
        return 'bg-purple-500';
      case 'ecopr':
        return 'bg-green-500';
      case 'pr_card':
        return 'bg-amber-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getEntryTypeName = (entryType: string) => {
    switch (entryType) {
      case 'aor':
        return 'AOR';
      case 'p2':
        return 'P2';
      case 'ecopr':
        return 'ecoPR';
      case 'pr_card':
        return 'PR Card';
      default:
        return entryType;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <View className="px-1 py-2">
      {entries.map((entry, index) => {
        // Calculate opacity and translation based on the animated value
        const opacity = animatedValues[index];
        const translateY = animatedValues[index].interpolate({
          inputRange: [0, 1],
          outputRange: [50, 0],
        });

        return (
          <Animated.View
            key={entry.id || index.toString()}
            style={[{ opacity, transform: [{ translateY }] }]}
            className="flex-row">
            {/* Timeline line and dot */}
            <View className="mr-4 w-8 items-center">
              <View className={`h-4 w-4 rounded-full ${getEntryTypeColor(entry.entry_type)}`} />
              {index !== entries.length - 1 && <View className="my-1 w-1 flex-1 bg-gray-300" />}
            </View>

            {/* Content */}
            <View
              className="mb-4 flex-1 rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
              style={styles.cardShadow}>
              <View className="mb-2 flex-row items-center justify-between">
                <View className={`rounded-full px-3 py-1 ${getEntryTypeColor(entry.entry_type)}`}>
                  <Text className="text-xs font-medium text-white">
                    {getEntryTypeName(entry.entry_type)}
                  </Text>
                </View>
                <Text className="text-sm text-gray-500">{formatDate(entry.entry_date)}</Text>
              </View>

              {entry.notes && <Text className="text-gray-700">{entry.notes}</Text>}
            </View>
          </Animated.View>
        );
      })}
    </View>
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
