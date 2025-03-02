import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaskedTextInput } from 'react-native-mask-text';

import { ScreenContent } from '../components/screen-content';
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
    color: 'bg-blue-500',
    description: 'Acknowledgement of Receipt sent by IRCC',
  },
  {
    value: 'p2',
    label: 'P2',
    icon: 'log-in-outline',
    color: 'bg-purple-500',
    description: 'Portal 2 login access granted',
  },
  {
    value: 'ecopr',
    label: 'ecoPR',
    icon: 'mail-outline',
    color: 'bg-green-500',
    description: 'Electronic Confirmation of PR',
  },
  {
    value: 'pr_card',
    label: 'PR Card',
    icon: 'card-outline',
    color: 'bg-amber-500',
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
  const { deviceId, entryType: initialEntryType, entryId, onComplete, existingEntries = [] } = route.params;
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
    const option = ENTRY_TYPE_OPTIONS.find(opt => opt.value === type);
    return option?.color || 'bg-gray-500';
  };

  return (
    <ScreenContent scrollable>
      <Animated.View
        className="px-4 pb-6 pt-2"
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <Text className="mb-1 text-2xl font-bold text-gray-800">
          {isEditing ? 'Edit Milestone' : 'Record Milestone'}
        </Text>
        <Text className="mb-6 text-gray-500">
          {isEditing
            ? 'Update the details of your PR journey milestone'
            : 'Document your progress in the Canadian PR process'}
        </Text>

        {/* Entry Type Display with Edit Option */}
        {!showEntryTypeSelection ? (
          <View className="mb-6">
            <View className="flex-row items-center justify-between">
              <Text className="font-medium text-gray-700">Milestone Type</Text>
              <TouchableOpacity 
                onPress={() => setShowEntryTypeSelection(true)}
                className="flex-row items-center"
              >
                <Ionicons name="pencil-outline" size={18} color="#3b82f6" />
                <Text className="ml-1 text-blue-500">Change</Text>
              </TouchableOpacity>
            </View>
            
            <View className="mt-3 flex-row items-center rounded-xl border border-gray-200 bg-white p-4">
              <View className={`h-10 w-10 items-center justify-center rounded-full ${getEntryTypeColor(entryType)}`}>
                <Ionicons
                  name={ENTRY_TYPE_OPTIONS.find(opt => opt.value === entryType)?.icon as any}
                  size={20}
                  color="white"
                />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-lg font-medium text-gray-800">
                  {ENTRY_TYPE_OPTIONS.find(opt => opt.value === entryType)?.label}
                </Text>
                <Text className="text-sm text-gray-500">
                  {ENTRY_TYPE_OPTIONS.find(opt => opt.value === entryType)?.description}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          /* Entry Type Selection */
          <View className="mb-6">
            <View className="flex-row items-center justify-between">
              <Text className="font-medium text-gray-700">Select Milestone Type</Text>
              <TouchableOpacity 
                onPress={() => setShowEntryTypeSelection(false)}
                className="flex-row items-center"
              >
                <Ionicons name="close-outline" size={18} color="#64748b" />
                <Text className="ml-1 text-gray-500">Cancel</Text>
              </TouchableOpacity>
            </View>
            
            <View className="mt-3 space-y-2">
              {ENTRY_TYPE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  className={`flex-row items-center rounded-xl border p-3 ${
                    entryType === option.value
                      ? `${option.color} border-transparent`
                      : 'border-gray-200 bg-white'
                  }`}
                  onPress={() => {
                    setEntryType(option.value);
                    setShowEntryTypeSelection(false);
                  }}>
                  <View className={`h-8 w-8 items-center justify-center rounded-full ${
                    entryType === option.value ? 'bg-white bg-opacity-20' : option.color
                  }`}>
                    <Ionicons
                      name={option.icon as any}
                      size={18}
                      color={entryType === option.value ? 'white' : 'white'}
                    />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text
                      className={`font-medium ${
                        entryType === option.value ? 'text-white' : 'text-gray-700'
                      }`}>
                      {option.label}
                    </Text>
                    <Text
                      className={`text-xs ${
                        entryType === option.value ? 'text-white text-opacity-80' : 'text-gray-500'
                      }`}>
                      {option.description}
                    </Text>
                  </View>
                  {entryType === option.value && (
                    <Ionicons name="checkmark-circle" size={24} color="white" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Date Input - Improved UI with increased height */}
        <View className="mb-6">
          <Text className="mb-3 font-medium text-gray-700">Date</Text>
          <View className="overflow-hidden rounded-lg border border-gray-300 shadow-sm">
            <View className="flex-row">
              <View className="flex-1 bg-white">
                <MaskedTextInput
                  mask="9999-99-99"
                  placeholder="YYYY-MM-DD"
                  value={dateText}
                  onChangeText={handleDateTextChange}
                  keyboardType="number-pad"
                  className="p-6 text-lg font-medium text-gray-700"
                  style={{ height: 60 }}
                />
              </View>
              <TouchableOpacity
                className="items-center justify-center bg-blue-500 px-6"
                onPress={() => setShowDatePicker(true)}>
                <Ionicons name="calendar-outline" size={26} color="white" />
              </TouchableOpacity>
            </View>
            <View className="border-t border-gray-200 bg-gray-50 px-4 py-3">
              <Text className="text-xs text-gray-500">
                When did you receive this notification or document?
              </Text>
            </View>
          </View>
        </View>

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            maximumDate={new Date()}
          />
        )}

        {/* Notes Input */}
        <View className="mb-8">
          <Text className="mb-3 font-medium text-gray-700">Additional Notes</Text>
          <View className="overflow-hidden rounded-lg border border-gray-300 shadow-sm">
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Add details like reference numbers or specific information for your records..."
              multiline
              numberOfLines={4}
              className="h-32 bg-white p-4 text-gray-700"
              textAlignVertical="top"
            />
            <View className="border-t border-gray-200 bg-gray-50 px-3 py-2">
              <Text className="text-xs text-gray-500">
                Add details like reference numbers or specific information for your records
              </Text>
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <View className="mt-4">
          <TouchableOpacity
            className={`items-center rounded-xl py-4 ${submitting ? 'bg-gray-400' : 'bg-blue-500'}`}
            onPress={handleSubmit}
            disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="font-bold text-white">
                {isEditing ? 'Save Changes' : 'Save Milestone'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className="mt-2 items-center rounded-xl py-4"
            onPress={() => navigation.goBack()}
            disabled={submitting}>
            <Text className="text-gray-600">Cancel</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </ScreenContent>
  );
}
