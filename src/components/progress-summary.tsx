import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { EntryType, TimelineEntry } from '../types';

interface ProgressSummaryProps {
  entries: TimelineEntry[];
  onAddEntry?: (entryType: EntryType) => void;
  emptyState?: boolean;
}

// Map entry types to their icon names
const ENTRY_TYPE_ICONS: Record<EntryType, string> = {
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

/**
 * Progress summary component that displays a visual representation of the user's journey
 * Shows a progress bar with completed and pending milestones
 */
export const ProgressSummary = ({ entries, onAddEntry, emptyState = false }: ProgressSummaryProps) => {
  // Define the fixed order of milestones in the journey - ordered from top to bottom
  const milestones: EntryType[] = [
    'submission', 
    'aor', 
    'biometrics_request',
    'biometrics_complete',
    'medicals_request',
    'medicals_complete',
    'background_start',
    'background_complete',
    // additional_docs is optional and not included by default
    'p1',
    'p2', 
    'ecopr', 
    'pr_card'
  ];

  // Get the latest milestone stage achieved
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
        return milestone;
    }
  };

  // Get milestone color
  const getMilestoneColor = (milestone: EntryType, index: number): string => {
    // If this milestone is completed, use its specific color
    if (index <= completedIndex) {
      switch (milestone) {
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
    }

    // Otherwise use a neutral color for incomplete milestones
    return 'bg-gray-300';
  };

  // Check if a milestone is a completion stage for a two-stage process
  const isCompletionStage = (milestone: EntryType): boolean => {
    return [
      'biometrics_complete', 
      'medicals_complete', 
      'background_complete'
    ].includes(milestone);
  };

  // Check if the previous stage has been completed for a completion stage
  const isPreviousStageComplete = (milestone: EntryType, index: number): boolean => {
    if (!isCompletionStage(milestone)) return true;
    
    const previousStageMilestone = milestone.replace('_complete', '_request');
    return entries.some(entry => entry.entry_type === previousStageMilestone);
  };

  // Determine the next milestone that should be added
  const getNextMilestone = (): EntryType | null => {
    const nextIndex = completedIndex + 1;
    return nextIndex < milestones.length ? milestones[nextIndex] : null;
  };

  // Check if we should show the add button for a specific milestone
  const shouldShowAddButton = (index: number, milestone: EntryType): boolean => {
    if (!onAddEntry) return false;

    // Special handling for two-stage milestones
    if (isCompletionStage(milestone)) {
      return isPreviousStageComplete(milestone, index) && 
             !entries.some(entry => entry.entry_type === milestone);
    }

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
        {milestones.map((milestone, index) => {
          // Skip completion stages if the request stage hasn't been completed
          if (isCompletionStage(milestone) && !isPreviousStageComplete(milestone, index)) {
            return null;
          }

          return (
            <View key={milestone} className="relative">
              {/* Milestone row */}
              <View className="mb-6 flex-row items-center">
                {/* Milestone circle with icon */}
                <View
                  className={`z-10 mr-4 h-10 w-10 items-center justify-center rounded-full ${getMilestoneColor(
                    milestone,
                    index
                  )}`}>
                  <Ionicons
                    name={ENTRY_TYPE_ICONS[milestone]}
                    size={18}
                    color="#FFFFFF"
                  />
                  
                  {/* Checkmark badge for completed milestones */}
                  {index <= completedIndex && (
                    <View className="absolute -right-1 -bottom-1 h-5 w-5 items-center justify-center rounded-full bg-success">
                      <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                    </View>
                  )}
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
                  {shouldShowAddButton(index, milestone) && (
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
                <View className="absolute left-5 top-10 -z-0 h-8 w-[2px] bg-gray-300" />
              )}
            </View>
          );
        })}
      </View>

      {/* Journey status */}
      <View className="mt-4 rounded-lg bg-gray-50 p-4">
        <Text className="text-center text-base text-gray-700">
          {completedIndex === -1 && 'Start tracking your PR journey!'}
          {completedIndex === 0 && 'Application submitted! Waiting for AOR.'}
          {completedIndex === 1 && 'AOR received! Waiting for biometrics request.'}
          {completedIndex === 2 && 'Biometrics requested! Schedule your appointment.'}
          {completedIndex === 3 && 'Biometrics completed! Waiting for medical exam request.'}
          {completedIndex === 4 && 'Medical exam requested! Schedule your appointment.'}
          {completedIndex === 5 && 'Medical exam passed! Waiting for background check.'}
          {completedIndex === 6 && 'Background check started! Waiting for clearance.'}
          {completedIndex === 7 && 'Background check cleared! Waiting for portal access.'}
          {completedIndex === 8 && 'P1 access granted! Waiting for P2 portal access.'}
          {completedIndex === 9 && 'P2 access granted! Waiting for ecoPR.'}
          {completedIndex === 10 && 'ecoPR received! Waiting for PR Card.'}
          {completedIndex === 11 && "Congratulations! You've completed your PR journey."}
        </Text>
      </View>
    </View>
  );
};
