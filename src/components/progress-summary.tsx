import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Text, TouchableOpacity, View } from 'react-native';

import { EntryType, TimelineEntry } from '../types';
import { ThemedCard } from './themed-card';

interface ProgressSummaryProps {
  entries: TimelineEntry[];
  onAddEntry?: (entryType: EntryType) => void;
  emptyState?: boolean;
}

// Map entry types to their icon names from Ionicons
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

/**
 * Progress summary component that displays a visual representation of the user's journey
 * Shows a progress bar with completed and pending milestones
 */
export const ProgressSummary = ({ entries, onAddEntry, emptyState = false }: ProgressSummaryProps) => {
  // Screen width for responsive sizing
  const screenWidth = Dimensions.get('window').width;
  
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
  
  // Run animations when component mounts or progress changes
  useEffect(() => {
    Animated.parallel([
      Animated.timing(progressWidth, {
        toValue: progress,
        duration: 1500,
        useNativeDriver: false,
      }),
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleInOut, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
  }, [progress]);

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
  
  // Get gradient colors for milestone
  const getMilestoneGradient = (milestone: EntryType, index: number): string[] => {
    if (index <= completedIndex) {
      switch (milestone) {
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
    }
    return ['#e5e7eb', '#d1d5db']; // neutral gradient for incomplete
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
  
  // Get a motivating message based on the completion percentage
  const getMotivationMessage = (): string => {
    if (progress === 0) return "Ready to start your PR journey!";
    if (progress <= 0.25) return "Great start! Keep going!";
    if (progress <= 0.5) return "You're making good progress!";
    if (progress <= 0.75) return "Almost there! Keep pushing forward!";
    if (progress < 1) return "The finish line is in sight!";
    return "Congratulations on completing your PR journey!";
  };

  return (
    <Animated.View style={{ opacity: fadeIn, transform: [{ scale: scaleInOut }] }}>
      <ThemedCard className="p-5 mb-6">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xl font-bold text-gray-800">Your PR Journey</Text>
          <View className="bg-gray-100 rounded-full px-3 py-1">
            <Text className="text-gray-700 font-medium">
              {Math.round(progress * 100)}% Complete
            </Text>
          </View>
        </View>

        {/* Motivational message */}
        <View className="mb-4">
          <Text className="text-gray-600 italic">{getMotivationMessage()}</Text>
        </View>

        {/* Custom Progress bar */}
        <View className="mb-6 h-4 rounded-full bg-gray-100 overflow-hidden">
          <Animated.View 
            className="h-4 rounded-full"
            style={{
              width: progressWidth.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%']
              }),
              backgroundColor: completedIndex >= 0 ? '#E31837' : '#e5e5e5'
            }}
          >
            <LinearGradient
              colors={['#E31837', '#F43F5E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="h-full w-full"
            />
          </Animated.View>
        </View>

        {/* Journey status */}
        <View className="mb-6 px-4 py-3 bg-gradient-to-r from-[#f8fafc] to-[#f1f5f9] rounded-xl border border-gray-100">
          <Text className="text-center text-base text-gray-700 font-medium">
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

        {/* Milestone display with enhanced visuals - vertical layout */}
        <View className="mb-2">
          {milestones.map((milestone, index) => {
            // Skip completion stages if the request stage hasn't been completed
            if (isCompletionStage(milestone) && !isPreviousStageComplete(milestone, index)) {
              return null;
            }

            // Determine if this milestone is completed
            const isCompleted = index <= completedIndex;
            // Determine if this is the next pending milestone
            const isNextPending = index === completedIndex + 1;
            // Get gradient colors
            const gradientColors = getMilestoneGradient(milestone, index);

            return (
              <View key={milestone} className="relative">
                {/* Milestone row with improved styling */}
                <Animated.View 
                  className={`mb-6 ${isNextPending ? 'scale-[1.02]' : ''}`}
                  style={{
                    opacity: isCompleted || isNextPending ? 1 : 0.7,
                    transform: [{
                      translateX: isNextPending ? 4 : 0
                    }]
                  }}
                >
                  <View className="flex-row items-center">
                    {/* Milestone circle with icon and gradient */}
                    <View className="z-10 mr-4">
                      <LinearGradient
                        colors={gradientColors}
                        className="h-12 w-12 items-center justify-center rounded-full shadow-md"
                        style={{ 
                          elevation: isCompleted ? 8 : 2,
                          shadowColor: gradientColors[0],
                          shadowOffset: { width: 0, height: 3 },
                          shadowOpacity: isCompleted ? 0.3 : 0.1,
                          shadowRadius: 4
                        }}
                      >
                        <Ionicons
                          name={ENTRY_TYPE_ICONS[milestone]}
                          size={20}
                          color="#FFFFFF"
                        />
                        
                        {/* Checkmark badge for completed milestones with animation */}
                        {isCompleted && (
                          <View className="absolute -right-1 -bottom-1 h-6 w-6 items-center justify-center rounded-full bg-success shadow-sm">
                            <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                          </View>
                        )}
                      </LinearGradient>
                    </View>
                    
                    {/* Milestone content with improved card styling */}
                    <View className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm p-4" 
                      style={{
                        shadowColor: isCompleted ? gradientColors[0] : '#000000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: isCompleted ? 0.15 : 0.05,
                        shadowRadius: 4,
                        elevation: isCompleted ? 4 : 1
                      }}
                    >
                      <View className="flex-row items-center justify-between">
                        <View>
                          <Text className={`text-base font-medium ${isCompleted ? 'text-gray-800' : 'text-gray-600'}`}>
                            {getMilestoneName(milestone)}
                          </Text>

                          {getMilestoneDate(milestone) ? (
                            <Text className="text-sm text-gray-500 mt-1">
                              {getMilestoneDate(milestone)}
                            </Text>
                          ) : (
                            <Text className="text-sm text-gray-400 mt-1">
                              {isCompleted ? 'Completed' : isNextPending ? 'Next Step' : 'Pending'}
                            </Text>
                          )}
                        </View>

                        {/* Add button for the next milestone with gradient */}
                        {shouldShowAddButton(index, milestone) && (
                          <TouchableOpacity
                            onPress={() => onAddEntry?.(milestone)}
                            className="shadow-sm"
                            style={{ 
                              shadowColor: gradientColors[0],
                              shadowOffset: { width: 0, height: 2 },
                              shadowOpacity: 0.2,
                              shadowRadius: 3,
                              elevation: 3
                            }}
                          >
                            <LinearGradient
                              colors={['#3b82f6', '#2563eb']}
                              className="flex-row items-center rounded-full px-4 py-2"
                            >
                              <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
                              <Text className="ml-1 font-medium text-white">Add</Text>
                            </LinearGradient>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                </Animated.View>
                
                {/* Connecting line to next milestone with gradient */}
                {index < milestones.length - 1 && (
                  <View className="absolute left-6 top-12 -z-0 h-10 w-[2px] overflow-hidden" style={{ 
                    opacity: isCompleted ? 1 : 0.4
                  }}>
                    <LinearGradient
                      colors={[gradientColors[0], index <= completedIndex ? getMilestoneGradient(milestones[index + 1], index + 1)[0] : '#d1d5db']}
                      start={{ x: 0.5, y: 0 }}
                      end={{ x: 0.5, y: 1 }}
                      className="h-full w-full"
                    />
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ThemedCard>
    </Animated.View>
  );
};
