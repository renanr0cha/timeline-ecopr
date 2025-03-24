import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Modal,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
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
      entryType?: EntryType;
      entryId?: string;
      onComplete?: () => void;
      existingEntries?: TimelineEntry[];
      mode?: 'create' | 'edit';
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
    value: 'submission',
    label: 'Submission',
    icon: 'paper-plane-outline',
    color: 'bg-purple-500',
    description: 'Application submission date',
  },
  {
    value: 'aor',
    label: 'AOR',
    icon: 'document-text-outline',
    color: 'bg-maple-red',
    description: 'Acknowledgement of Receipt',
  },
  {
    value: 'biometrics_request',
    label: 'Biometrics Request',
    icon: 'finger-print-outline',
    color: 'bg-teal-500',
    description: 'Biometrics request received',
  },
  {
    value: 'biometrics_complete',
    label: 'Biometrics Complete',
    icon: 'checkmark-circle-outline',
    color: 'bg-teal-600',
    description: 'Biometrics appointment completed',
  },
  {
    value: 'medicals_request',
    label: 'Medicals Request',
    icon: 'medical-outline',
    color: 'bg-blue-500',
    description: 'Medical examination request',
  },
  {
    value: 'medicals_complete',
    label: 'Medicals Complete',
    icon: 'medkit-outline',
    color: 'bg-blue-600',
    description: 'Medical examination passed',
  },
  {
    value: 'background_start',
    label: 'Background Check',
    icon: 'shield-outline',
    color: 'bg-yellow-500',
    description: 'Background check started',
  },
  {
    value: 'background_complete',
    label: 'Background Cleared',
    icon: 'shield-checkmark-outline',
    color: 'bg-yellow-600',
    description: 'Background check completed',
  },
  {
    value: 'additional_docs',
    label: 'Additional Docs',
    icon: 'folder-open-outline',
    color: 'bg-orange-500',
    description: 'Additional documents submitted',
  },
  {
    value: 'p1',
    label: 'P1',
    icon: 'person-outline',
    color: 'bg-hope-red',
    description: 'Principal applicant portal access',
  },
  {
    value: 'p2',
    label: 'P2',
    icon: 'people-outline',
    color: 'bg-hope-red',
    description: 'Secondary applicant portal access',
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
 * Screen for adding or editing a timeline entry
 * Enhanced with animations and improved UI
 */
export default function AddEntryScreen({ route }: AddEntryScreenProps) {
  const {
    entryType: initialEntryType,
    entryId,
    onComplete,
    existingEntries = [],
    mode = 'create', // Default to create mode if not specified
  } = route.params;

  const [entryType, setEntryType] = useState<EntryType>(initialEntryType || 'aor');
  const [date, setDate] = useState(new Date());
  const [dateText, setDateText] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isEditing] = useState(mode === 'edit'); // Set based on mode parameter
  const [showEntryTypeSelection, setShowEntryTypeSelection] = useState(false);
  const navigation = useNavigation<AddEntryScreenNavigationProp>();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  /**
   * Load entry data for editing
   */
  const loadEntry = async () => {
    if (!isEditing || !entryId) return;

    try {
      setSubmitting(true);

      // Check if we have the entry data in existingEntries
      const existingEntry = existingEntries.find((entry) => entry.id === entryId);

      if (existingEntry) {
        // Use existing entry data
        setEntryType(existingEntry.entry_type);

        if (existingEntry.entry_date) {
          const parsedDate = new Date(existingEntry.entry_date);
          if (!isNaN(parsedDate.getTime())) {
            setDate(parsedDate);
            setDateText(formatDate(parsedDate));
          }
        }

        if (existingEntry.notes) {
          setNotes(existingEntry.notes);
        }
      } else {
        // If for some reason we don't have the entry in existingEntries,
        // we could fetch it from the API here
        logger.warn('Entry not found in existingEntries', { entryId });
        Alert.alert('Error', 'Could not find the entry to edit');
        navigation.goBack();
      }
    } catch (error) {
      logger.error('Error loading entry for editing', { error, entryId });
      Alert.alert('Error', 'Failed to load entry data');
    } finally {
      setSubmitting(false);
    }
  };

  // Use effect to set up the screen based on mode
  useEffect(() => {
    // Hide the navigation header
    navigation.setOptions({
      headerShown: false,
    });
    
    // Run entrance animations
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

    // Load entry data when in edit mode
    if (isEditing) {
      loadEntry();
    } else {
      // For new entries, set the date to today by default
      const today = new Date();
      setDate(today);
      setDateText(formatDate(today));
    }
  }, [isEditing, entryId, navigation]);

  /**
   * Format date for display
   */
  const formatDate = (date: Date): string => {
    // Create a date with timezone offset to ensure the correct day is used
    const correctedDate = new Date(date);

    // We need to ensure the date values reflect local time, not UTC
    const year = correctedDate.getFullYear();
    const month = String(correctedDate.getMonth() + 1).padStart(2, '0');
    const day = String(correctedDate.getDate()).padStart(2, '0');

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

  const handleCalendarPress = () => {
    setShowDatePicker(true);
  };

  /**
   * Handle date change from the date picker
   */
  const handleDateChange = (event: any, selectedDate?: Date) => {
    // On Android, pressing cancel results in selectedDate being undefined
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

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
        await timelineService.updateEntry(entryId, {
          entry_type: entryType,
          entry_date: dateText,
          notes,
        });
      } else {
        // Add new entry
        await timelineService.addEntry(entryType, dateText, notes);
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
            <Text className="mb-2 text-sm font-medium text-text-primary">Milestone Type</Text>
            <TouchableOpacity
              onPress={() => setShowEntryTypeSelection(!showEntryTypeSelection)}
              className="flex-row items-center justify-between rounded-lg border border-frost bg-pure-white p-3">
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
                  <Text className="text-base font-medium text-text-primary">
                    {ENTRY_TYPE_OPTIONS.find((opt) => opt.value === entryType)?.label}
                  </Text>
                  <Text className="text-sm text-text-secondary">
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
              <View className="mt-2 rounded-lg border border-frost bg-pure-white">
                {ENTRY_TYPE_OPTIONS.map((option, index) => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => {
                      setEntryType(option.value);
                      setShowEntryTypeSelection(false);
                    }}
                    className={`flex-row items-center border-frost p-3 ${
                      index !== ENTRY_TYPE_OPTIONS.length - 1 ? 'border-b' : ''
                    }`}>
                    <View className={`mr-3 rounded-full p-2 ${option.color}`}>
                      <Ionicons name={option.icon as any} size={20} color="#FFFFFF" />
                    </View>
                    <View>
                      <Text className="text-base font-medium text-text-primary">
                        {option.label}
                      </Text>
                      <Text className="text-sm text-text-secondary">{option.description}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Date Input */}
          <View className="mb-4">
            <Text className="mb-2 text-sm font-medium text-text-primary">Date Received</Text>
            <View className="flex-row items-center">
              <View className="flex-1">
                <MaskedTextInput
                  mask="9999-99-99"
                  onChangeText={handleDateTextChange}
                  value={dateText}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#6C757D"
                  keyboardType="numeric"
                  className="rounded-lg border border-frost bg-pure-white px-4 text-base text-text-primary"
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
                onPress={handleCalendarPress}
                className="ml-2 rounded-lg border border-frost bg-pure-white"
                style={{
                  height: 56, // Match the input height
                  width: 56,
                  justifyContent: 'center',
                  alignItems: 'center',
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
        <View className="w-full flex-row justify-end gap-4 space-x-3">
          <ThemedButton variant="secondary" onPress={() => navigation.goBack()}>
            Cancel
          </ThemedButton>
          <ThemedButton variant="primary" onPress={handleSubmit} loading={submitting}>
            {isEditing ? 'Save Changes' : 'Add Entry'}
          </ThemedButton>
        </View>

        {/* Date Picker */}
        {showDatePicker &&
          (Platform.OS === 'ios' ? (
            <Modal
              animationType="slide"
              transparent
              visible={showDatePicker}
              onRequestClose={() => setShowDatePicker(false)}>
              <View className="flex-1 justify-end bg-black/50">
                <View className="rounded-t-xl bg-white p-4">
                  <View className="mb-4 flex-row items-center justify-between">
                    <ThemedButton
                      variant="secondary"
                      size="sm"
                      onPress={() => setShowDatePicker(false)}>
                      Cancel
                    </ThemedButton>
                    <Text className="text-lg font-medium">Select Date</Text>
                    <ThemedButton
                      variant="primary"
                      size="sm"
                      onPress={() => {
                        setShowDatePicker(false);
                      }}>
                      Done
                    </ThemedButton>
                  </View>

                  <DateTimePicker
                    value={date}
                    mode="date"
                    display="spinner"
                    onChange={handleDateChange}
                    textColor="#FF1E38"
                    accentColor="#FF1E38"
                    maximumDate={new Date()}
                  />
                </View>
              </View>
            </Modal>
          ) : (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          ))}
      </Animated.View>
    </ScreenContent>
  );
}
