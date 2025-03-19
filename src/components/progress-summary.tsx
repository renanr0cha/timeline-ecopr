import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { EntryType, TimelineEntry } from '../types';

interface ProgressSummaryProps {
  entries: TimelineEntry[];
  onAddEntry?: (entryType: EntryType) => void;
  emptyState?: boolean;
}

/**
 * Progress summary component that displays a visual representation of the user's journey
 * Shows a progress bar with completed and pending milestones
 */
export const ProgressSummary = ({ entries, onAddEntry, emptyState = false }: ProgressSummaryProps) => {
  // Define the fixed order of milestones in the journey - ordered from top to bottom
  const milestones: EntryType[] = [
    'submission', 
    'biometrics', 
    'aor', 
    'medicals', 
    'p2', 
    'bg_check', 
    'ecopr', 
    'copr', 
    'landing', 
    'pr_card'
  ];

  // Find the latest milestone achieved
  const getCompletedMilestoneIndex = (): number => {
    let completedIndex = -1;

    // Check which milestones have entries
    milestones.forEach((milestone, index) => {
      if (entries.some((entry) => entry.entry_type === milestone)) {
        completedIndex = index;
      }
    });

    return completedIndex;
  };

  const completedIndex = getCompletedMilestoneIndex();
  const progress = emptyState ? 0 : (completedIndex + 1) / milestones.length;

  // Get the date for a specific milestone if it exists
  const getMilestoneDate = (milestone: EntryType): string | null => {
    const entry = entries.find((e) => e.entry_type === milestone);
    if (!entry) return null;

    const date = new Date(entry.entry_date);
    return date.toLocaleDateString('en-CA', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Get milestone display name
  const getMilestoneName = (milestone: EntryType): string => {
    switch (milestone) {
      case 'submission':
        return 'Submission';
      case 'biometrics':
        return 'Biometrics';
      case 'aor':
        return 'AOR';
      case 'medicals':
        return 'Medicals';
      case 'p2':
        return 'P2';
      case 'bg_check':
        return 'Background Check';
      case 'ecopr':
        return 'ecoPR';
      case 'copr':
        return 'COPR';
      case 'landing':
        return 'Landing';
      case 'pr_card':
        return 'PR Card';
      default:
        return milestone;
    }
  };

  // Get milestone color
  const getMilestoneColor = (milestone: EntryType, index: number): string => {
    // If this milestone is completed, use its specific color
    if (index <= completedIndex) {
      switch (milestone) {
        case 'submission':
          return 'bg-indigo-500';
        case 'biometrics':
          return 'bg-purple-500';
        case 'aor':
          return 'bg-maple-red';
        case 'medicals':
          return 'bg-teal-500';
        case 'p2':
          return 'bg-hope-red';
        case 'bg_check':
          return 'bg-blue-500';
        case 'ecopr':
          return 'bg-success';
        case 'copr':
          return 'bg-yellow-600';
        case 'landing':
          return 'bg-orange-500';
        case 'pr_card':
          return 'bg-waiting';
        default:
          return 'bg-gray-500';
      }
    }

    // Otherwise use a neutral color for incomplete milestones
    return 'bg-gray-300';
  };

  // Determine the next milestone that should be added
  const getNextMilestone = (): EntryType | null => {
    const nextIndex = completedIndex + 1;
    return nextIndex < milestones.length ? milestones[nextIndex] : null;
  };

  // Check if we should show the add button for a specific milestone
  const shouldShowAddButton = (index: number): boolean => {
    if (!onAddEntry) return false;

    // Show the add button for the next milestone or the first milestone if none exist
    if (emptyState && index === 0) return true;
    return index === completedIndex + 1;
  };

  return (
    <View>
      <Text className="mb-4 text-xl font-bold text-gray-800">Your PR Journey</Text>

      {/* Progress bar */}
      <View className="mb-6 h-3 rounded-full bg-gray-200">
        <View className="h-3 rounded-full bg-blue-500" style={{ width: `${progress * 100}%` }} />
      </View>

      {/* Milestone display - vertical layout from top to bottom */}
      <View className="mb-2">
        {milestones.map((milestone, index) => (
          <View key={milestone} className="relative">
            {/* Milestone row */}
            <View className="mb-6 flex-row items-center">
              {/* Milestone circle */}
              <View
                className={`z-10 mr-4 h-9 w-9 items-center justify-center rounded-full ${getMilestoneColor(
                  milestone,
                  index
                )}`}>
                {index <= completedIndex && <Text className="text-sm font-bold text-white">✓</Text>}
              </View>
              
              {/* Milestone content */}
              <View className="flex-1 flex-row items-center justify-between">
                <View>
                  <Text className="text-base font-medium text-gray-700">
                    {getMilestoneName(milestone)}
                  </Text>

                  {getMilestoneDate(milestone) ? (
                    <Text className="text-sm text-gray-500">
                      {getMilestoneDate(milestone)}
                    </Text>
                  ) : (
                    <Text className="text-sm text-gray-400">
                      {index <= completedIndex ? 'Completed' : 'Pending'}
                    </Text>
                  )}
                </View>

                {/* Add button for the next milestone */}
                {shouldShowAddButton(index) && (
                  <TouchableOpacity
                    onPress={() => onAddEntry?.(milestone)}
                    className="flex-row items-center rounded-full bg-blue-100 px-4 py-2">
                    <Ionicons name="add-circle-outline" size={20} color="#3b82f6" />
                    <Text className="ml-1 font-medium text-blue-500">Add</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
            
            {/* Connect milestones with a vertical line, except for the last one */}
            {index < milestones.length - 1 && (
              <View className="absolute left-[14px] top-[38px] -z-0 h-6 w-[3px] bg-gray-300" />
            )}
          </View>
        ))}
      </View>

      {/* Journey status */}
      <View className="mt-4 rounded-lg bg-gray-50 p-4">
        <Text className="text-center text-base text-gray-700">
          {completedIndex === -1 && 'Start tracking your PR journey!'}
          {completedIndex === 0 && 'Application submitted! Complete biometrics next.'}
          {completedIndex === 1 && 'Biometrics completed! Waiting for AOR.'}
          {completedIndex === 2 && 'AOR received! Complete medical exam next.'}
          {completedIndex === 3 && 'Medical exam passed! Waiting for P2 access.'}
          {completedIndex === 4 && 'P2 access granted! Background check in progress.'}
          {completedIndex === 5 && 'Background check completed! Waiting for ecoPR.'}
          {completedIndex === 6 && 'ecoPR received! Waiting for COPR.'}
          {completedIndex === 7 && 'COPR received! Ready for landing/POE.'}
          {completedIndex === 8 && 'Successfully landed! Waiting for PR Card.'}
          {completedIndex === 9 && "Congratulations! You've completed your PR journey."}
        </Text>
      </View>
    </View>
  );
};
