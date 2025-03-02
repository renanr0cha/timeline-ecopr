import React from 'react';
import { Text, View } from 'react-native';

import { EntryType, TimelineEntry } from '../types';

interface ProgressSummaryProps {
  entries: TimelineEntry[];
}

/**
 * Progress summary component that displays a visual representation of the user's journey
 * Shows a progress bar with completed and pending milestones
 */
export const ProgressSummary = ({ entries }: ProgressSummaryProps) => {
  // Define the fixed order of milestones in the journey
  const milestones: EntryType[] = ['aor', 'p2', 'ecopr', 'pr_card'];

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
  const progress = (completedIndex + 1) / milestones.length;

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
      case 'aor':
        return 'AOR';
      case 'p2':
        return 'P2';
      case 'ecopr':
        return 'ecoPR';
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
    }

    // Otherwise use a neutral color for incomplete milestones
    return 'bg-gray-300';
  };

  return (
    <View className="mb-4 rounded-xl bg-white p-5 shadow-sm">
      <Text className="mb-4 text-xl font-bold text-gray-800">Your PR Journey</Text>

      {/* Progress bar */}
      <View className="mb-6 h-2 rounded-full bg-gray-200">
        <View className="h-2 rounded-full bg-blue-500" style={{ width: `${progress * 100}%` }} />
      </View>

      {/* Milestone display */}
      <View className="mb-2 flex-row justify-between">
        {milestones.map((milestone, index) => (
          <View key={milestone} className="items-center" style={{ width: '22%' }}>
            <View
              className={`mb-1 h-6 w-6 items-center justify-center rounded-full ${getMilestoneColor(milestone, index)}`}>
              {index <= completedIndex && <Text className="text-xs font-bold text-white">✓</Text>}
            </View>
            <Text className="text-center text-xs font-medium text-gray-700">
              {getMilestoneName(milestone)}
            </Text>

            {getMilestoneDate(milestone) ? (
              <Text className="mt-1 text-center text-xs text-gray-500">
                {getMilestoneDate(milestone)}
              </Text>
            ) : (
              <Text className="mt-1 text-center text-xs text-gray-400">
                {index <= completedIndex ? 'Completed' : 'Pending'}
              </Text>
            )}
          </View>
        ))}
      </View>

      {/* Journey status */}
      <View className="mt-4 rounded-lg bg-gray-50 p-3">
        <Text className="text-center text-gray-700">
          {completedIndex === -1 && 'Start tracking your PR journey!'}
          {completedIndex === 0 && 'AOR received! Waiting for P2 access.'}
          {completedIndex === 1 && 'P2 access granted! Waiting for ecoPR.'}
          {completedIndex === 2 && 'ecoPR received! Waiting for PR Card.'}
          {completedIndex === 3 && "Congratulations! You've completed your PR journey."}
        </Text>
      </View>
    </View>
  );
};
