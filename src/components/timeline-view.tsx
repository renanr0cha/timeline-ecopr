import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef } from 'react';
import { Animated, Text, TouchableOpacity, View } from 'react-native';

import { ENTRY_TYPE_ICONS, getDaysAgo, getMilestoneGradient, getMilestoneName } from '../constants/milestone-utils';
import { EntryType, TimelineEntry } from '../types';

interface TimelineViewProps {
  entries: TimelineEntry[];
  onAddEntry?: (entryType: EntryType) => void;
}

/**
 * Timeline view component that displays a chronological list of PR journey entries
 */
export const TimelineView = ({ entries, onAddEntry }: TimelineViewProps) => {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  
  // Safely handle add entry
  const handleAddEntry = useCallback(
    (entryType: EntryType) => {
      if (onAddEntry) {
        onAddEntry(entryType);
      }
    },
    [onAddEntry]
  );

  // Run entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Sort entries by date, newest first
  const sortedEntries = [...entries].sort((a, b) => {
    // Use entry_date (the date the milestone was received)
    const dateA = a.entry_date ? new Date(a.entry_date).getTime() : 0;
    const dateB = b.entry_date ? new Date(b.entry_date).getTime() : 0;

    // First sort by date (newest first)
    if (dateB !== dateA) {
      return dateB - dateA;
    }
    
    // If dates are the same, sort by milestone sequence
    // Define milestone sequence order for sorting
    const milestoneOrder = [
      'submission',
      'aor',
      'biometrics_request',
      'biometrics_complete',
      'medicals_request',
      'medicals_complete',
      'background_start',
      'background_complete',
      'p1',
      'p2',
      'ecopr',
      'pr_card'
    ];
    
    const indexA = milestoneOrder.indexOf(a.entry_type);
    const indexB = milestoneOrder.indexOf(b.entry_type);
    
    return indexA - indexB; // Earlier in sequence comes first when dates are equal
  });

  // Helper function to format the entry date nicely
  const formatEntryDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.warn('Invalid date format', dateString);
        return 'Invalid date';
      }
      return date.toLocaleDateString('en-CA', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (error) {
      console.warn('Error formatting date', error);
      return 'Date error';
    }
  };

  // Render a single timeline entry
  const renderTimelineEntry = (entry: TimelineEntry, index: number) => {
    const entryDate = entry.entry_date || entry.created_at || '';
    const formattedDate = entryDate ? formatEntryDate(entryDate) : 'No date';
    const daysAgo = getDaysAgo(entryDate);
    const gradientColors = getMilestoneGradient(entry.entry_type);
    const isFirstEntry = index === 0;
    const isLastEntry = index === sortedEntries.length - 1;

    return (
      <View key={entry.id} className="mb-4 relative">
        {/* Connector line to previous entry */}
        {!isFirstEntry && (
          <View className="absolute top-0 left-[18px] w-[2px] h-[20px] bg-[#e2e8f0]"></View>
        )}
        
        <View className="flex-row">
          {/* Entry icon with gradient */}
          <View className="z-10">
            <View className="rounded-[18px] overflow-hidden">
              <LinearGradient
                colors={gradientColors}
                style={{ 
                  width: 36, 
                  height: 36, 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  shadowColor: '#000',
                  shadowOpacity: 0.2,
                  shadowOffset: { width: 0, height: 2 },
                  shadowRadius: 4,
                  elevation: 3
                }}
              >
                <Ionicons
                  name={ENTRY_TYPE_ICONS[entry.entry_type]}
                  size={20}
                  color="#FFFFFF"
                />
              </LinearGradient>
            </View>
            
            {/* Add small checkmark badge */}
            <View className="absolute -right-1 -bottom-1 w-[18px] h-[18px] rounded-[9px] bg-[#22c55e] items-center justify-center shadow shadow-black/20 elevation-2">
              <Ionicons name="checkmark" size={12} color="#FFFFFF" />
            </View>
          </View>
          
          {/* Entry content card */}
          <View 
            className="flex-1 ml-3 rounded-[14px] p-3 shadow shadow-black/10 elevation-2 border border-[#f1f5f9]"
            style={{
              backgroundColor: `${gradientColors[0]}10`, // Increased opacity to 10 (6.25%)
            }}
          >
            {/* Entry header with title and date */}
            <View className="flex-row justify-between items-center">
              <View className="flex-1">
                <View className="flex-row items-center">
                  <Text className="text-[#1e293b] text-base font-semibold">
                    {getMilestoneName(entry.entry_type)}
                  </Text>
                </View>
                <Text className="text-[#64748b] text-xs mt-0.5">
                  {formattedDate}
                </Text>
              </View>
              
              {/* Days ago counter */}
              <View className="items-center min-w-[45px]">
                <Text className="text-lg font-bold text-[#94a3b8] leading-[22px]">{daysAgo}</Text>
                <Text className="text-[10px] text-[#94a3b8] leading-[12px]">
                  {daysAgo === 1 ? 'day ago' : 'days ago'}
                </Text>
              </View>
            </View>
            
            {/* Entry notes/comments if available */}
            {entry.notes && (
              <View className="mt-2 p-2.5 bg-[#f8fafc] rounded-lg border border-[#f1f5f9]">
                <Text className="text-[#475569] text-sm">{entry.notes}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Connector line to next entry */}
        {!isLastEntry && (
          <View className="absolute bottom-[-20px] left-[18px] w-[2px] h-[20px] bg-[#e2e8f0]"></View>
        )}
      </View>
    );
  };

  // Check if there are no entries to display
  if (sortedEntries.length === 0) {
    return (
      <Animated.View 
        className="bg-[#f8fafc] p-5 rounded-2xl shadow shadow-black/10 elevation-2 border border-[#f1f5f9]"
        style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}
      >
        <View className="items-center justify-center py-5">
          <Ionicons name="time-outline" size={48} color="#94a3b8" />
          <Text className="text-[#64748b] text-base mt-2 text-center">
            No timeline entries yet. Add your first milestone to start tracking your PR journey.
          </Text>
          {onAddEntry && (
            <TouchableOpacity
              onPress={() => handleAddEntry('submission')}
              className="mt-4"
            >
              <View className="rounded-xl overflow-hidden shadow shadow-[#3b82f6]/20 elevation-2">
                <LinearGradient
                  colors={['#3b82f6', '#2563eb']}
                  style={{ 
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 20,
                    paddingVertical: 10
                  }}
                >
                  <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
                  <Text className="ml-1.5 text-white font-medium">Add First Entry</Text>
                </LinearGradient>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View 
      className="mb-4"
      style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}
    >
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-lg font-bold text-[#1e293b]">Timeline</Text>
        <View className="flex-row">
          <TouchableOpacity 
            className="mr-2"
            onPress={() => {/* refresh function */}}
          >
            <View className="w-[32px] h-[32px] rounded-full bg-[#f1f5f9] items-center justify-center">
              <Ionicons name="refresh-outline" size={18} color="#64748b" />
            </View>
          </TouchableOpacity>
          {onAddEntry && (
            <TouchableOpacity
              onPress={() => {
                // Find next logical milestone to add based on existing entries
                const entryTypes = entries.map(e => e.entry_type);
                
                // Default to submission if no entries exist
                if (entryTypes.length === 0) {
                  handleAddEntry('submission');
                  return;
                }
                
                // Define milestone sequence to check for next logical one
                const milestones: EntryType[] = [
                  'submission',
                  'aor',
                  'biometrics_request',
                  'biometrics_complete',
                  'medicals_request',
                  'medicals_complete',
                  'background_start',
                  'background_complete',
                  'p1',
                  'p2',
                  'ecopr',
                  'pr_card',
                ];
                
                // Find the last completed milestone
                let lastCompletedIndex = -1;
                milestones.forEach((milestone, index) => {
                  if (entryTypes.includes(milestone)) {
                    lastCompletedIndex = index;
                  }
                });
                
                // Get the next milestone in sequence
                const nextIndex = lastCompletedIndex + 1;
                if (nextIndex < milestones.length) {
                  handleAddEntry(milestones[nextIndex]);
                } else {
                  // If all milestones are completed, start the add entry flow
                  handleAddEntry('submission');
                }
              }}
            >
              <View className="rounded-full overflow-hidden shadow shadow-[#3b82f6]/20 elevation-2">
                <LinearGradient
                  colors={['#3b82f6', '#2563eb']}
                  style={{ 
                    height: 32, 
                    width: 32, 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}
                >
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                </LinearGradient>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      <View className="bg-white rounded-2xl p-4 shadow shadow-black/10 elevation-2 border border-[#f1f5f9]">
        {sortedEntries.map(renderTimelineEntry)}
      </View>
    </Animated.View>
  );
};
