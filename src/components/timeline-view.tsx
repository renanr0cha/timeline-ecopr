import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { EntryType, TimelineEntry } from '../types';

interface TimelineViewProps {
  entries: TimelineEntry[];
  onEntryPress?: (entry: TimelineEntry) => void;
}

// Map entry types to their icon names
const ENTRY_TYPE_ICONS: Record<EntryType, keyof typeof Ionicons.glyphMap> = {
  'submission': 'paper-plane-outline',
  'aor': 'document-text-outline',
  'biometrics_request': 'finger-print-outline',
  'biometrics_complete': 'checkmark-circle-outline',
  'medicals_request': 'medical-outline',
  'medicals_complete': 'medkit-outline',
  'background_start': 'shield-outline',
  'background_complete': 'shield-checkmark-outline',
  'additional_docs': 'folder-open-outline',
  'p1': 'person-outline',
  'p2': 'people-outline',
  'ecopr': 'mail-outline',
  'pr_card': 'card-outline'
};

// Get gradient colors for milestone type
const getMilestoneGradient = (entryType: string): string[] => {
  switch (entryType) {
    case 'submission':
      return ['#9333ea', '#a855f7']; // purple gradient
    case 'aor':
      return ['#e11e38', '#ef4444']; // maple red gradient
    case 'biometrics_request':
      return ['#0d9488', '#14b8a6']; // teal gradient
    case 'biometrics_complete':
      return ['#0d9488', '#0f766e']; // dark teal gradient
    case 'medicals_request':
      return ['#3b82f6', '#60a5fa']; // blue gradient
    case 'medicals_complete':
      return ['#2563eb', '#3b82f6']; // darker blue gradient
    case 'background_start':
      return ['#eab308', '#facc15']; // yellow gradient
    case 'background_complete':
      return ['#ca8a04', '#eab308']; // darker yellow gradient
    case 'additional_docs':
      return ['#f97316', '#fb923c']; // orange gradient
    case 'p1':
      return ['#dc2626', '#ef4444']; // hope red gradient
    case 'p2':
      return ['#dc2626', '#b91c1c']; // darker hope red gradient
    case 'ecopr':
      return ['#22c55e', '#4ade80']; // success gradient
    case 'pr_card':
      return ['#f59e0b', '#fbbf24']; // waiting/amber gradient
    default:
      return ['#6b7280', '#9ca3af']; // gray gradient
  }
};

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
        
        // Get gradient colors for this entry type
        const gradientColors = getMilestoneGradient(entry.entry_type);

        return (
          <Animated.View
            key={entry.id || index.toString()}
            style={[{ opacity, transform: [{ translateY }] }]}
            className="relative">
            {/* Timeline row */}
            <View className="mb-4 flex-row">
              {/* Timeline dot with icon and gradient */}
              <View className="z-10 mr-4 items-center" style={{ width: 32 }}>
                <LinearGradient
                  colors={gradientColors}
                  className="h-10 w-10 items-center justify-center rounded-full shadow-md"
                  style={{ 
                    elevation: 4,
                    shadowColor: gradientColors[0],
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 3,
                  }}
                >
                  <Ionicons 
                    name={ENTRY_TYPE_ICONS[entry.entry_type as EntryType]} 
                    size={18} 
                    color="#FFFFFF" 
                  />
                  {/* Small checkmark badge for completed items */}
                  <View className="absolute -right-1 -bottom-1 h-5 w-5 items-center justify-center rounded-full bg-success shadow-sm">
                    <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                  </View>
                </LinearGradient>
              </View>

              {/* Content card with improved styling */}
              <TouchableOpacity
                onPress={() => onEntryPress?.(entry)}
                activeOpacity={onEntryPress ? 0.7 : 1}
                className="mb-4 flex-1"
              >
                <View
                  className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
                  style={{
                    ...styles.cardShadow,
                    shadowColor: gradientColors[0],
                    shadowOpacity: 0.15,
                  }}
                >
                  <View className="mb-2 flex-row items-center justify-between">
                    <LinearGradient
                      colors={gradientColors}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      className="rounded-full px-3 py-1 shadow-sm"
                    >
                      <Text className="text-xs font-medium text-white">
                        {getEntryTypeName(entry.entry_type)}
                      </Text>
                    </LinearGradient>
                    <Text className="text-sm text-gray-500 font-medium">{formatDate(entry.entry_date)}</Text>
                  </View>

                  {entry.notes && <Text className="text-gray-700 mt-1">{entry.notes}</Text>}
                </View>
              </TouchableOpacity>
            </View>
            
            {/* Connecting line to next milestone with gradient */}
            {index !== orderedEntries.length - 1 && (
              <View 
                className="absolute left-4 top-10 -z-0 w-[2px] overflow-hidden" 
                style={{ height: 70 }}
              >
                <LinearGradient
                  colors={[
                    gradientColors[0],
                    index < orderedEntries.length - 1 ? 
                      getMilestoneGradient(orderedEntries[index + 1].entry_type)[0] : 
                      '#d1d5db'
                  ]}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  className="h-full w-full"
                />
              </View>
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
