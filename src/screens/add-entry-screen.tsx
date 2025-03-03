import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, Platform, Text, TouchableOpacity, View } from 'react-native';
import { MaskedTextInput } from 'react-native-mask-text';

import { ScreenContent } from '../components/screen-content';
import { SectionHeader } from '../components/section-header';
import { ThemedButton } from '../components/themed-button';
import { ThemedCard } from '../components/themed-card';
import { ThemedInput } from '../components/themed-input';
import { logger } from '../lib/logger';
import { timelineService } from '../services/timeline-service';
import { EntryType, RootStackParamList, TimelineEntry } from '../types';

type AddEntryScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddEntry'>;

interface AddEntryScreenProps {
  route: {
    params: {
      deviceId: string;
      entryType?: EntryType;
      entryId?: string;
      onComplete?: () => void;
      existingEntries?: TimelineEntry[];
    };
  };
}

/**
 * Entry type options and display information
 */
const ENTRY_TYPE_OPTIONS: {
  value: EntryType;
  label: string;
  icon: string;
  color: string;
  description: string;
}[] = [
  {
    value: 'aor',
    label: 'AOR',
    icon: 'document-text-outline',
    color: 'bg-maple-red',
    description: 'Acknowledgement of Receipt sent by IRCC',
  },
  {
    value: 'p2',
    label: 'P2',
    icon: 'log-in-outline',
    color: 'bg-hope-red',
    description: 'Portal 2 login access granted',
  },
  {
    value: 'ecopr',
    label: 'ecoPR',
    icon: 'mail-outline',
    color: 'bg-success',
    description: 'Electronic Confirmation of PR',
  },
  {
    value: 'pr_card',
    label: 'PR Card',
    icon: 'card-outline',
    color: 'bg-waiting',
    description: 'Permanent Resident Card received',
  },
];

/**
 * Get the milestone sequence for determining next steps
 */
const MILESTONE_SEQUENCE: EntryType[] = ['aor', 'p2', 'ecopr', 'pr_card'];

/**
 * Screen for adding or editing a timeline entry
 * Enhanced with animations and improved UI
 */
export default function AddEntryScreen({ route }: AddEntryScreenProps) {
  const {
    deviceId,
    entryType: initialEntryType,
    entryId,
    onComplete,
    existingEntries = [],
  } = route.params;
  const [entryType, setEntryType] = useState<EntryType>(initialEntryType || 'aor');
  const [date, setDate] = useState(new Date());
  const [dateText, setDateText] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showEntryTypeSelection, setShowEntryTypeSelection] = useState(false);
  const navigation = useNavigation<AddEntryScreenNavigationProp>();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Get the current progress to determine the next step
  const getCurrentStepIndex = (): number => {
    let completedIndex = -1;

    MILESTONE_SEQUENCE.forEach((milestone, index) => {
      if (existingEntries.some((entry) => entry.entry_type === milestone)) {
        completedIndex = index;
      }
    });

    return completedIndex;
  };

  // Determine the next milestone that needs to be added
  const getNextMilestoneType = (): EntryType => {
    const currentIndex = getCurrentStepIndex();
    const nextIndex = currentIndex + 1;

    // If we have next milestone, return it, otherwise default to first
    return nextIndex < MILESTONE_SEQUENCE.length
      ? MILESTONE_SEQUENCE[nextIndex]
      : MILESTONE_SEQUENCE[0];
  };

  useEffect(() => {
    // Run entry animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
    ]).start();

    // If no entry type is specified, but we have existing entries,
    // automatically detect and use the next step
    if (!initialEntryType && existingEntries.length > 0) {
      const nextType = getNextMilestoneType();
      setEntryType(nextType);
    }

    // Load entry data if editing
    if (entryId) {
      loadEntry();
    } else {
      // Set today's date as default
      const today = new Date();
      setDateText(formatDate(today));
    }
  }, []);

  /**
   * Load entry data when editing an existing entry
   */
  const loadEntry = async () => {
    try {
      // Placeholder for loading existing entry data
      // Would need to implement a getEntry method in the timelineService
      setIsEditing(true);
    } catch (error) {
      logger.error('Error loading entry', { error });
      Alert.alert('Error', 'Failed to load entry data');
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  /**
   * Parse date string to Date object
   */
  const parseDate = (dateStr: string): Date | null => {
    // Validate date format (YYYY-MM-DD)
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateStr)) return null;

    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    // Validate date (e.g., 2023-02-31 is invalid)
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      return null;
    }

    return date;
  };

  /**
   * Handle date text change and validate format
   */
  const handleDateTextChange = (text: string) => {
    setDateText(text);
    const parsedDate = parseDate(text);
    if (parsedDate) {
      setDate(parsedDate);
    }
  };

  /**
   * Handle date selection from date picker
   */
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
      setDateText(formatDate(selectedDate));
    }
  };

  /**
   * Submit the entry to the timeline service
   */
  const handleSubmit = async () => {
    // Validate date input
    const parsedDate = parseDate(dateText);
    if (!parsedDate) {
      Alert.alert('Invalid Date', 'Please enter a valid date in YYYY-MM-DD format');
      return;
    }

    // Check if date is in the future
    if (parsedDate > new Date()) {
      Alert.alert('Future Date', 'The date cannot be in the future');
      return;
    }

    try {
      setSubmitting(true);

      if (isEditing && entryId) {
        // Update existing entry
        await timelineService.updateEntry(deviceId, entryId, {
          entry_type: entryType,
          entry_date: dateText,
          notes,
        });
      } else {
        // Add new entry
        await timelineService.addEntry(deviceId, entryType, dateText, notes);
      }

      // Call the onComplete callback if provided
      if (onComplete) {
        onComplete();
      }

      navigation.goBack();
    } catch (error) {
      logger.error('Error submitting entry', { error });
      Alert.alert('Error', 'There was a problem saving your entry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Get color for specific entry type
   */
  const getEntryTypeColor = (type: EntryType): string => {
    const option = ENTRY_TYPE_OPTIONS.find((opt) => opt.value === type);
    return option?.color || 'bg-gray-500';
  };

  return (
    <ScreenContent scrollable>
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
        className="flex-1 py-6">
        <SectionHeader
          title={isEditing ? 'Edit Timeline Entry' : 'Add Timeline Entry'}
          description="Record your PR journey milestones"
          size="lg"
          className="mb-6"
        />

        <ThemedCard className="mb-6">
          {/* Entry Type Selection */}
          <View className="mb-4">
            <Text className="text-text-primary mb-2 text-sm font-medium">Milestone Type</Text>
            <TouchableOpacity
              onPress={() => setShowEntryTypeSelection(!showEntryTypeSelection)}
              className="border-frost bg-pure-white flex-row items-center justify-between rounded-lg border p-3">
              <View className="flex-row items-center">
                <View
                  className={`mr-3 rounded-full p-2 ${ENTRY_TYPE_OPTIONS.find((opt) => opt.value === entryType)?.color}`}>
                  <Ionicons
                    name={ENTRY_TYPE_OPTIONS.find((opt) => opt.value === entryType)?.icon as any}
                    size={20}
                    color="#FFFFFF"
                  />
                </View>
                <View>
                  <Text className="text-text-primary text-base font-medium">
                    {ENTRY_TYPE_OPTIONS.find((opt) => opt.value === entryType)?.label}
                  </Text>
                  <Text className="text-text-secondary text-sm">
                    {ENTRY_TYPE_OPTIONS.find((opt) => opt.value === entryType)?.description}
                  </Text>
                </View>
              </View>
              <Ionicons
                name={showEntryTypeSelection ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#6C757D"
              />
            </TouchableOpacity>

            {/* Entry Type Options */}
            {showEntryTypeSelection && (
              <View className="border-frost bg-pure-white mt-2 rounded-lg border">
                {ENTRY_TYPE_OPTIONS.map((option, index) => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => {
                      setEntryType(option.value);
                      setShowEntryTypeSelection(false);
                    }}
                    className={`border-frost flex-row items-center p-3 ${
                      index !== ENTRY_TYPE_OPTIONS.length - 1 ? 'border-b' : ''
                    }`}>
                    <View className={`mr-3 rounded-full p-2 ${option.color}`}>
                      <Ionicons name={option.icon as any} size={20} color="#FFFFFF" />
                    </View>
                    <View>
                      <Text className="text-text-primary text-base font-medium">
                        {option.label}
                      </Text>
                      <Text className="text-text-secondary text-sm">{option.description}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Date Input */}
          <View className="mb-4">
            <Text className="text-text-primary mb-2 text-sm font-medium">Date Received</Text>
            <View className="flex-row items-center">
              <View className="flex-1">
                <MaskedTextInput
                  mask="9999-99-99"
                  onChangeText={handleDateTextChange}
                  value={dateText}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#6C757D"
                  keyboardType="numeric"
                  className="border-frost bg-pure-white text-text-primary rounded-lg border px-4 text-base"
                  style={{
                    backgroundColor: '#FFFFFF',
                    height: 56, // Match ThemedInput height
                    fontSize: 16,
                    paddingVertical: 16,
                    paddingHorizontal: 16,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: '#E0E0E0',
                  }}
                />
              </View>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                className="border-frost bg-pure-white ml-2 rounded-lg border"
                style={{ 
                  height: 56, // Match the input height
                  width: 56, 
                  justifyContent: 'center', 
                  alignItems: 'center' 
                }}>
                <Ionicons name="calendar-outline" size={24} color="#FF1E38" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Notes Input */}
          <ThemedInput
            label="Notes (Optional)"
            value={notes}
            onChangeText={setNotes}
            placeholder="Add any additional details..."
            multiline
            numberOfLines={4}
            className="h-24"
          />
        </ThemedCard>

        {/* Action Buttons */}
        <View className="flex-row justify-end space-x-3">
          <ThemedButton variant="secondary" onPress={() => navigation.goBack()}>
            Cancel
          </ThemedButton>
          <ThemedButton variant="primary" onPress={handleSubmit} loading={submitting}>
            {isEditing ? 'Save Changes' : 'Add Entry'}
          </ThemedButton>
        </View>

        {/* Date Picker Modal */}
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
          />
        )}
      </Animated.View>
    </ScreenContent>
  );
}
