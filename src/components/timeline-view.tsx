import React, { useEffect } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { EntryType, TimelineEntry } from '../types';

interface TimelineViewProps {
  entries: TimelineEntry[];
  onEntryPress?: (entry: TimelineEntry) => void;
}

/**
 * Timeline component that displays entries in a vertically connected timeline
 * Includes animation effects for a modern and visually appealing UI
 */
export const TimelineView = ({ entries, onEntryPress }: TimelineViewProps) => {
  // Define the fixed order of milestones in the journey - ordered from top to bottom
  const milestoneOrder: EntryType[] = [
    'submission', 
    'aor', 
    'biometrics_request',
    'biometrics_complete',
    'medicals_request',
    'medicals_complete',
    'background_start',
    'background_complete',
    'additional_docs', // Optional step, but included in ordering
    'p1',
    'p2', 
    'ecopr', 
    'pr_card'
  ];
  
  // Filter entries to remove optional steps that don't have entries
  const filteredEntries = entries.filter(
    entry => entry.entry_type !== 'additional_docs' || entries.some(e => e.entry_type === 'additional_docs')
  );
  
  // Sort entries by the fixed milestone order, not by date
  const orderedEntries = [...filteredEntries].sort((a, b) => {
    const orderA = milestoneOrder.indexOf(a.entry_type);
    const orderB = milestoneOrder.indexOf(b.entry_type);
    return orderA - orderB;
  });
  
  // Create animated values for each entry (for fade-in and slide effects)
  const animatedValues = orderedEntries.map(() => new Animated.Value(0));

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
      case 'submission':
        return 'bg-purple-500';
      case 'aor':
        return 'bg-maple-red';
      case 'biometrics_request':
        return 'bg-teal-500';
      case 'biometrics_complete':
        return 'bg-teal-600';
      case 'medicals_request':
        return 'bg-blue-500';
      case 'medicals_complete':
        return 'bg-blue-600';
      case 'background_start':
        return 'bg-yellow-500';
      case 'background_complete':
        return 'bg-yellow-600';
      case 'additional_docs':
        return 'bg-orange-500';
      case 'p1':
        return 'bg-hope-red';
      case 'p2':
        return 'bg-hope-red';
      case 'ecopr':
        return 'bg-success';
      case 'pr_card':
        return 'bg-waiting';
      default:
        return 'bg-gray-500';
    }
  };

  const getEntryTypeName = (entryType: string) => {
    switch (entryType) {
      case 'submission':
        return 'Submission';
      case 'aor':
        return 'AOR';
      case 'biometrics_request':
        return 'Biometrics Request';
      case 'biometrics_complete':
        return 'Biometrics Complete';
      case 'medicals_request':
        return 'Medicals Request';
      case 'medicals_complete':
        return 'Medicals Complete';
      case 'background_start':
        return 'Background Check';
      case 'background_complete':
        return 'Background Cleared';
      case 'additional_docs':
        return 'Additional Docs';
      case 'p1':
        return 'P1';
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
    <View className="py-2">
      {orderedEntries.map((entry, index) => {
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
            className="relative">
            {/* Timeline row */}
            <View className="mb-4 flex-row">
              {/* Timeline line and dot */}
              <View className="z-10 mr-4 items-center" style={{ width: 24 }}>
                <View className={`h-4 w-4 rounded-full ${getEntryTypeColor(entry.entry_type)}`} />
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
            </View>
            
            {/* Connecting line to next milestone (except for the last one) */}
            {index !== orderedEntries.length - 1 && (
              <View 
                className="absolute left-3 top-4 -z-0 w-0.5 bg-gray-300" 
                style={{ height: 60 }} 
              />
            )}
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
