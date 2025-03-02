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
import { EntryType, RootStackParamList } from '../types';

type AddEntryScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddEntry'>;

interface AddEntryScreenProps {
  route: {
    params: {
      deviceId: string;
      entryType?: EntryType;
      entryId?: string;
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
 * Screen for adding or editing a timeline entry
 * Enhanced with animations and improved UI
 */
export default function AddEntryScreen({ route }: AddEntryScreenProps) {
  const { deviceId, entryType: initialEntryType, entryId } = route.params;
  const [entryType, setEntryType] = useState<EntryType>(initialEntryType || 'aor');
  const [date, setDate] = useState(new Date());
  const [dateText, setDateText] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const navigation = useNavigation<AddEntryScreenNavigationProp>();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

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

      navigation.goBack();
    } catch (error) {
      logger.error('Error submitting entry', { error });
      Alert.alert('Error', 'There was a problem saving your entry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContent scrollable>
      <Animated.View
        className="px-4 pb-6 pt-2"
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <Text className="mb-1 text-2xl font-bold text-gray-800">
          {isEditing ? 'Edit Entry' : 'Add Entry'}
        </Text>
        <Text className="mb-6 text-gray-500">
          {isEditing
            ? 'Update your PR journey milestone'
            : 'Track a new milestone in your PR journey'}
        </Text>

        {/* Entry Type Selection */}
        <View className="mb-6">
          <Text className="mb-3 font-medium text-gray-700">Entry Type</Text>
          <View className="flex-row flex-wrap">
            {ENTRY_TYPE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                className={`mb-2 mr-2 flex-row items-center rounded-xl border px-4 py-3 ${
                  entryType === option.value
                    ? `${option.color} border-transparent`
                    : 'border-gray-200 bg-white'
                }`}
                onPress={() => setEntryType(option.value)}>
                <Ionicons
                  name={option.icon as any}
                  size={18}
                  color={entryType === option.value ? 'white' : '#64748b'}
                />
                <Text
                  className={`ml-2 font-medium ${
                    entryType === option.value ? 'text-white' : 'text-gray-700'
                  }`}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text className="mt-2 text-xs text-gray-500">
            {ENTRY_TYPE_OPTIONS.find((opt) => opt.value === entryType)?.description}
          </Text>
        </View>

        {/* Date Input */}
        <View className="mb-6">
          <Text className="mb-3 font-medium text-gray-700">Date</Text>
          <View className="flex-row">
            <View className="flex-1">
              <MaskedTextInput
                mask="9999-99-99"
                placeholder="YYYY-MM-DD"
                value={dateText}
                onChangeText={handleDateTextChange}
                keyboardType="number-pad"
                className="rounded-l-lg border border-gray-200 bg-white p-3 text-gray-700"
              />
            </View>
            <TouchableOpacity
              className="items-center justify-center rounded-r-lg bg-blue-500 px-4"
              onPress={() => setShowDatePicker(true)}>
              <Ionicons name="calendar-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
          <Text className="mt-2 text-xs text-gray-500">
            Enter the date when this milestone occurred
          </Text>
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
          <Text className="mb-3 font-medium text-gray-700">Notes (Optional)</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Add any additional details here..."
            multiline
            numberOfLines={4}
            className="h-32 rounded-lg border border-gray-200 bg-white p-3 text-gray-700"
            textAlignVertical="top"
          />
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
                {isEditing ? 'Update Entry' : 'Save Entry'}
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
