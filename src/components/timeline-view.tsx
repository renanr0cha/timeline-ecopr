import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef } from 'react';
import { Animated, Text, TouchableOpacity, View } from 'react-native';

import {
  ENTRY_TYPE_ICONS,
  getDaysAgo,
  getMilestoneGradient,
  getMilestoneName,
} from '../constants/milestone-utils';
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
      'pr_card',
    ];

    const indexA = milestoneOrder.indexOf(a.entry_type);
    const indexB = milestoneOrder.indexOf(b.entry_type);

    return indexA - indexB; // Earlier in sequence comes first when dates are equal
  });

  // Helper function to format the entry date nicely
  const formatEntryDate = (dateString: string): string => {
    try {
      if (!dateString) return 'No date';

      // For ISO format dates (YYYY-MM-DD)
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateString.split('-').map((num) => parseInt(num, 10));
        // Create date in UTC to avoid timezone issues
        const date = new Date(Date.UTC(year, month - 1, day));

        return date.toLocaleDateString('en-CA', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          timeZone: 'UTC', // Ensure display in UTC
        });
      }

      // For other date formats
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
      <View key={entry.id} className="relative mb-4">
        {/* Connector line to previous entry */}
        {!isFirstEntry && (
          <View className="absolute left-[18px] top-0 h-[20px] w-[2px] bg-[#e2e8f0]" />
        )}

        <View className="flex-row">
          {/* Entry icon with gradient */}
          <View className="z-10">
            <View className="overflow-hidden rounded-[18px]">
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
                  elevation: 3,
                }}>
                <Ionicons name={ENTRY_TYPE_ICONS[entry.entry_type]} size={20} color="#FFFFFF" />
              </LinearGradient>
            </View>

            {/* Add small checkmark badge */}
            <View className="elevation-2 absolute -bottom-1 -right-1 h-[18px] w-[18px] items-center justify-center rounded-[9px] bg-[#22c55e] shadow shadow-black/20">
              <Ionicons name="checkmark" size={12} color="#FFFFFF" />
            </View>
          </View>

          {/* Entry content card */}
          <View
            className="elevation-2 ml-3 flex-1 rounded-[14px] border border-[#f1f5f9] p-3 shadow shadow-black/10"
            style={{
              backgroundColor: `${gradientColors[0]}10`, // Increased opacity to 10 (6.25%)
            }}>
            {/* Entry header with title and date */}
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <View className="flex-row items-center">
                  <Text className="text-base font-semibold text-[#1e293b]">
                    {getMilestoneName(entry.entry_type)}
                  </Text>
                </View>
                <Text className="mt-0.5 text-xs text-[#64748b]">{formattedDate}</Text>
              </View>

              {/* Days ago counter */}
              <View className="min-w-[45px] items-center">
                <Text className="text-lg font-bold leading-[22px] text-[#94a3b8]">{daysAgo}</Text>
                <Text className="text-[10px] leading-[12px] text-[#94a3b8]">
                  {daysAgo === 1 ? 'day ago' : 'days ago'}
                </Text>
              </View>
            </View>

            {/* Entry notes/comments if available */}
            {entry.notes && (
              <View className="mt-2 rounded-lg border border-[#f1f5f9] bg-[#f8fafc] p-2.5">
                <Text className="text-sm text-[#475569]">{entry.notes}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Connector line to next entry */}
        {!isLastEntry && (
          <View className="absolute bottom-[-20px] left-[18px] h-[20px] w-[2px] bg-[#e2e8f0]" />
        )}
      </View>
    );
  };

  // Check if there are no entries to display
  if (sortedEntries.length === 0) {
    return (
      <Animated.View
        className="elevation-2 rounded-2xl border border-[#f1f5f9] bg-[#f8fafc] p-5 shadow shadow-black/10"
        style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
        <View className="items-center justify-center py-5">
          <Ionicons name="time-outline" size={48} color="#94a3b8" />
          <Text className="mt-2 text-center text-base text-[#64748b]">
            No timeline entries yet. Add your first milestone to start tracking your PR journey.
          </Text>
          {onAddEntry && (
            <TouchableOpacity onPress={() => handleAddEntry('submission')} className="mt-4">
              <View className="elevation-2 overflow-hidden rounded-xl shadow shadow-[#3b82f6]/20">
                <LinearGradient
                  colors={['#3b82f6', '#2563eb']}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                  }}>
                  <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
                  <Text className="ml-1.5 font-medium text-white">Add First Entry</Text>
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
      style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-lg font-bold text-[#1e293b]">Timeline</Text>
        <View className="flex-row">
          <TouchableOpacity
            className="mr-2"
            onPress={() => {
              /* refresh function */
            }}>
            <View className="h-[32px] w-[32px] items-center justify-center rounded-full bg-[#f1f5f9]">
              <Ionicons name="refresh-outline" size={18} color="#64748b" />
            </View>
          </TouchableOpacity>
          {onAddEntry && (
            <TouchableOpacity
              onPress={() => {
                // Find next logical milestone to add based on existing entries
                const entryTypes = entries.map((e) => e.entry_type);

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
              }}>
              <View className="elevation-2 overflow-hidden rounded-full shadow shadow-[#3b82f6]/20">
                <LinearGradient
                  colors={['#3b82f6', '#2563eb']}
                  style={{
                    height: 32,
                    width: 32,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                </LinearGradient>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View className="elevation-2 rounded-2xl border border-[#f1f5f9] bg-white p-4 shadow shadow-black/10">
        {sortedEntries.map(renderTimelineEntry)}
      </View>
    </Animated.View>
  );
};
