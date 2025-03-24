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
import { ThemedCard } from './themed-card';

// Constants for consistent layout
const DOT_SIZE = 36;
const CONNECTOR_WIDTH = 2;
const TIMELINE_LEFT_MARGIN = 0;
const CONNECTOR_HEIGHT = 20;

interface ProgressSummaryProps {
  entries: TimelineEntry[];
  onAddEntry?: (entryType: EntryType) => void;
  emptyState?: boolean;
}

/**
 * Progress summary component that displays a visual representation of the user's journey
 * Shows a progress bar with completed and pending milestones
 */
export const ProgressSummary = ({
  entries,
  onAddEntry,
  emptyState = false,
}: ProgressSummaryProps) => {
  // Animation values
  const progressWidth = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const scaleInOut = useRef(new Animated.Value(0.95)).current;

  // Define the fixed order of milestones in the journey - ordered from top to bottom
  const milestones: EntryType[] = [
    'submission',
    'aor',
    'biometrics_request',
    'biometrics_complete',
    'medicals_complete',
    'background_complete',
    // additional_docs is optional and not included by default
    'p1',
    'p2',
    'ecopr',
    'pr_card',
  ];

  // Get the latest milestone stage achieved
  const getCompletedMilestoneIndex = (): number => {
    let completedIndex = -1;

    // Create a sorted array of entries that match our milestones
    const sortedMilestoneEntries = entries
      .filter((entry) => milestones.includes(entry.entry_type))
      .sort((a, b) => {
        // First sort by date (newest first)
        const dateA = a.entry_date ? new Date(a.entry_date).getTime() : 0;
        const dateB = b.entry_date ? new Date(b.entry_date).getTime() : 0;

        if (dateB !== dateA) {
          return dateB - dateA;
        }

        // If dates are the same, sort by milestone sequence
        const indexA = milestones.indexOf(a.entry_type);
        const indexB = milestones.indexOf(b.entry_type);

        return indexA - indexB; // Earlier in milestone sequence comes first
      });

    // Check which milestones have entries and find the furthest one in the sequence
    milestones.forEach((milestone, index) => {
      if (sortedMilestoneEntries.some((entry) => entry.entry_type === milestone)) {
        completedIndex = index;
      }
    });

    return completedIndex;
  };

  const completedIndex = getCompletedMilestoneIndex();
  const progress = emptyState ? 0 : (completedIndex + 1) / milestones.length;

  // Run animations when component mounts or progress changes
  useEffect(() => {
    Animated.parallel([
      Animated.timing(progressWidth, {
        toValue: progress,
        duration: 1200,
        useNativeDriver: false,
      }),
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleInOut, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [progress]);

  // Get the date for a specific milestone if it exists
  const getMilestoneDate = (milestone: EntryType): string | null => {
    const entry = entries.find((e) => e.entry_type === milestone);
    if (!entry) return null;

    // Make sure we're using entry_date (the date the milestone was received)
    if (!entry.entry_date) {
      console.warn('Entry missing entry_date', { milestone });
      return null;
    }

    try {
      const date = new Date(entry.entry_date);
      if (isNaN(date.getTime())) {
        console.warn('Invalid entry date format', { date: entry.entry_date, milestone });
        return null;
      }

      return date.toLocaleDateString('en-CA', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (error) {
      console.warn('Error formatting milestone date', { error, milestone });
      return null;
    }
  };

  // Get gradient colors for milestone
  const getGradientForMilestone = (
    milestone: EntryType,
    index: number
  ): readonly [string, string] => {
    const isCompleted = index <= completedIndex;
    return getMilestoneGradient(milestone, isCompleted);
  };

  // Check if a milestone is a completion stage for a two-stage process
  const isCompletionStage = (milestone: EntryType): boolean => {
    return ['biometrics_complete', 'medicals_complete', 'background_complete'].includes(milestone);
  };

  // Check if the previous stage has been completed for a completion stage
  const isPreviousStageComplete = (milestone: EntryType, index: number): boolean => {
    // Map completion stages to their prerequisite request stages
    const stageMap: Partial<Record<EntryType, EntryType>> = {
      biometrics_complete: 'biometrics_request',
    };

    // Check if the prerequisite stage exists in the entries
    if (stageMap[milestone]) {
      return entries.some((entry) => entry.entry_type === stageMap[milestone]);
    }

    return true;
  };

  // Add useCallback for the onAddEntry handler to prevent unnecessary re-renders
  const handleAddEntry = useCallback(
    (entryType: EntryType) => {
      if (onAddEntry) {
        onAddEntry(entryType);
      }
    },
    [onAddEntry]
  );

  // Check if we should show the add button for a specific milestone
  const shouldShowAddButton = (index: number, milestone: EntryType): boolean => {
    if (!onAddEntry) return false;

    // Special handling for two-stage milestones
    if (isCompletionStage(milestone)) {
      // For biometrics_complete, only show add button if biometrics_request exists
      if (milestone === 'biometrics_complete') {
        return (
          !entries.some((entry) => entry.entry_type === milestone) &&
          entries.some((entry) => entry.entry_type === 'biometrics_request')
        );
      }

      // For medicals_complete and background_complete, they can be added directly
      // but only if they're the next logical step in the timeline
      // AND they don't already exist in entries
      return (
        !entries.some((entry) => entry.entry_type === milestone) && index === completedIndex + 1
      );
    }

    // For first milestone when no entries exist
    if (emptyState && index === 0) return true;

    // For the next logical milestone after the last completed one
    return index === completedIndex + 1;
  };

  // Get a motivating message based on the completion percentage
  const getMotivationMessage = (): string => {
    if (progress === 0) return 'Ready to start your PR journey!';
    if (progress <= 0.25) return 'Great start! Keep going!';
    if (progress <= 0.5) return "You're making good progress!";
    if (progress <= 0.75) return 'Almost there! Keep pushing forward!';
    if (progress < 1) return 'The finish line is in sight!';
    return 'Congratulations on completing your PR journey!';
  };

  return (
    <Animated.View style={[{ opacity: fadeIn, transform: [{ scale: scaleInOut }] }]}>
      <ThemedCard className="mb-5 bg-transparent">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-lg font-bold text-[#1e293b]">Your PR Journey</Text>
          <View className="overflow-hidden rounded-2xl shadow-sm">
            <LinearGradient
              colors={['rgba(255, 4, 33, 0.644)', '#ee8989ac']}
              style={{ paddingHorizontal: 12, paddingVertical: 6 }}>
              <Text className="text-sm font-semibold text-white">
                {Math.round(progress * 100)}% Complete
              </Text>
            </LinearGradient>
          </View>
        </View>

        {/* Motivational message */}
        <Text className="mb-4 text-sm italic text-[#64748b]">{getMotivationMessage()}</Text>

        {/* Journey status */}
        <View className="mb-4 overflow-hidden rounded-2xl shadow-sm">
          <LinearGradient
            colors={
              completedIndex >= 0
                ? [
                    `${getGradientForMilestone(milestones[completedIndex], completedIndex)[0]}25`,
                    `${getGradientForMilestone(milestones[completedIndex], completedIndex)[1]}10`,
                  ]
                : ['rgba(255, 30, 56, 0.15)', 'rgba(255, 30, 56, 0.05)']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 14,
            }}>
            <Text className="text-center text-sm font-medium text-[#1e293b]">
              {completedIndex === -1 && 'Start tracking your PR journey!'}
              {completedIndex === 0 && 'Application submitted! Waiting for AOR.'}
              {completedIndex === 1 && 'AOR received! Waiting for biometrics request.'}
              {completedIndex === 2 && 'Biometrics requested! Schedule your appointment.'}
              {completedIndex === 3 && 'Biometrics completed! Waiting for medical exam clearance.'}
              {completedIndex === 4 &&
                'Medical exam passed! Waiting for background check clearance.'}
              {completedIndex === 5 && 'Background check cleared! Waiting for portal access.'}
              {completedIndex === 6 && 'P1 access granted! Waiting for P2 portal access.'}
              {completedIndex === 7 && 'P2 access granted! Waiting for ecoPR.'}
              {completedIndex === 8 && 'ecoPR received! Waiting for PR Card.'}
              {completedIndex === 9 && "Congratulations! You've completed your PR journey."}
            </Text>
          </LinearGradient>
        </View>

        {/* Milestone timeline with enhanced visuals - vertical layout */}
        <View className="mt-1">
          {/* Create a sorted array of milestones based on their actual completion dates */}
          {entries.length > 0
            ? milestones
                .filter((milestone) => {
                  // Skip completion stages if the request stage hasn't been completed
                  if (
                    isCompletionStage(milestone) &&
                    !isPreviousStageComplete(milestone, milestones.indexOf(milestone))
                  ) {
                    return false;
                  }
                  return true;
                })
                .sort((a, b) => {
                  // First check if both milestones have entries
                  const entryA = entries.find((e) => e.entry_type === a);
                  const entryB = entries.find((e) => e.entry_type === b);

                  // If both have entries, sort by date
                  if (entryA && entryB) {
                    const dateA = entryA.entry_date ? new Date(entryA.entry_date).getTime() : 0;
                    const dateB = entryB.entry_date ? new Date(entryB.entry_date).getTime() : 0;

                    if (dateA !== dateB) {
                      return dateA - dateB; // Sort chronologically (earliest first)
                    }
                  }

                  // If entries don't have dates or dates are equal, fall back to sequence order
                  return milestones.indexOf(a) - milestones.indexOf(b);
                })
                .map((milestone, index) => {
                  // Determine if this milestone is completed
                  const isCompleted = milestones.indexOf(milestone) <= completedIndex;
                  // Determine if this is the next pending milestone
                  const isNextPending = milestones.indexOf(milestone) === completedIndex + 1;
                  // Get gradient colors
                  const gradientColors = getGradientForMilestone(
                    milestone,
                    milestones.indexOf(milestone)
                  );

                  // Get milestone date and calculate days ago
                  const milestoneDate = getMilestoneDate(milestone);
                  const daysAgo = milestoneDate ? getDaysAgo(milestoneDate) : 0;

                  return (
                    <View key={milestone} className="relative pb-0">
                      {/* Connecting line to previous milestone */}
                      {index > 0 && (
                        <View
                          className="absolute z-10 w-[2px] overflow-hidden"
                          style={{
                            top: -CONNECTOR_HEIGHT,
                            left: TIMELINE_LEFT_MARGIN + DOT_SIZE / 2 - CONNECTOR_WIDTH / 2,
                            height: CONNECTOR_HEIGHT * 1.65,
                            opacity: isCompleted ? 1 : 0.4,
                          }}>
                          <LinearGradient
                            colors={[index > 0 ? '#d1d5db' : '#d1d5db', gradientColors[0]]}
                            start={{ x: 0.5, y: 0 }}
                            end={{ x: 0.5, y: 1 }}
                            style={{ height: '100%', width: '100%' }}
                          />
                        </View>
                      )}

                      <View className="mb-2.5 flex-row items-center">
                        {/* Milestone circle with icon and gradient */}
                        <View
                          className={`z-10 ml-0 mr-2.5 mt-0 ${isCompleted || isNextPending ? 'opacity-100' : 'opacity-60'}`}>
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
                                elevation: 4,
                              }}>
                              <Ionicons
                                name={ENTRY_TYPE_ICONS[milestone]}
                                size={20}
                                color="#FFFFFF"
                              />
                            </LinearGradient>
                          </View>

                          {/* Checkmark badge for completed milestones - moved outside overflow container */}
                          {isCompleted && (
                            <View className="elevation-2 absolute -bottom-[3px] -right-[3px] h-4 w-4 items-center justify-center rounded-full bg-[#22c55e] shadow shadow-black/20">
                              <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                            </View>
                          )}
                        </View>

                        {/* Milestone content card - ensure background color is applied */}
                        <View
                          className={`elevation-2 flex-1 rounded-[14px] border border-[#f1f5f9] p-3 shadow ${isCompleted || isNextPending ? 'opacity-100' : 'opacity-70'}`}
                          style={{
                            backgroundColor: isCompleted ? `${gradientColors[0]}10` : 'white', // Increased opacity to 10 (6.25%)
                            shadowColor: isCompleted ? gradientColors[0] : '#000000',
                            shadowOpacity: isCompleted ? 0.15 : 0.05,
                            shadowOffset: { width: 0, height: 2 },
                            shadowRadius: 4,
                          }}>
                          <View className="flex-row items-center justify-between">
                            <View className="flex-1">
                              <Text
                                className={`text-sm ${isCompleted ? 'font-semibold text-[#1e293b]' : 'font-medium text-[#475569]'}`}>
                                {getMilestoneName(milestone)}
                              </Text>

                              {milestoneDate ? (
                                <Text className="mt-0.5 text-xs text-[#64748b]">
                                  {milestoneDate}
                                </Text>
                              ) : (
                                <Text className="mt-0.5 text-xs text-[#94a3b8]">
                                  {isCompleted
                                    ? 'Completed'
                                    : isNextPending
                                      ? 'Next Step'
                                      : 'Pending'}
                                </Text>
                              )}
                            </View>

                            {/* Days ago counter - only show for completed milestones with a date */}
                            {isCompleted && milestoneDate && (
                              <View className="min-w-[45px] items-center pl-2">
                                <Text className="text-lg font-bold leading-[22px] text-[#94a3b8]">
                                  {daysAgo}
                                </Text>
                                <Text className="text-[10px] leading-[14px] text-[#94a3b8]">
                                  {daysAgo === 1 ? 'day ago' : 'days ago'}
                                </Text>
                              </View>
                            )}

                            {/* Add button for the next milestone */}
                            {shouldShowAddButton(index, milestone) && (
                              <TouchableOpacity
                                onPress={() => handleAddEntry(milestone)}
                                className="elevation-3 shadow-md shadow-[#FF1E38]/20">
                                <View className="overflow-hidden rounded-2xl">
                                  <LinearGradient
                                    colors={['#FF1E38', '#E01730']}
                                    style={{
                                      flexDirection: 'row',
                                      alignItems: 'center',
                                      paddingHorizontal: 12,
                                      paddingVertical: 6,
                                      shadowColor: '#FF1E38',
                                      shadowOpacity: 0.2,
                                      shadowOffset: { width: 0, height: 2 },
                                      shadowRadius: 3,
                                      elevation: 3,
                                    }}>
                                    <Ionicons name="add-circle-outline" size={16} color="#FFFFFF" />
                                    <Text className="ml-1 text-sm font-medium text-white">Add</Text>
                                  </LinearGradient>
                                </View>
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      </View>

                      {/* Connecting line to next milestone */}
                      {index < milestones.length - 1 && (
                        <View
                          className="absolute z-10 w-[2px] overflow-hidden rounded-full"
                          style={{
                            top: DOT_SIZE + 10,
                            left: TIMELINE_LEFT_MARGIN + DOT_SIZE / 2 - CONNECTOR_WIDTH / 2,
                            height: CONNECTOR_HEIGHT / 2,
                            opacity: isCompleted ? 1 : 0.4,
                          }}>
                          <LinearGradient
                            colors={[gradientColors[1], '#d1d5db']}
                            start={{ x: 0.5, y: 0 }}
                            end={{ x: 0.5, y: 1 }}
                            style={{ height: '100%', width: '100%' }}
                          />
                        </View>
                      )}
                    </View>
                  );
                })
            : null}
        </View>
      </ThemedCard>
    </Animated.View>
  );
};
