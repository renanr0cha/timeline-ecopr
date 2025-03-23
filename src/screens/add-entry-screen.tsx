import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { format } from 'date-fns';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../constants/colors';
import { logger } from '../lib/logger';
import { supabase } from '../lib/supabase';
import { timelineService } from '../services/timeline-service';
import { RootStackParamList } from '../types';
import { getEntryTypeOptions, translateEntryType } from '../utils/entry-types';

type AddEntryScreenProps = {
  route: RouteProp<RootStackParamList, 'AddEntry'>;
  navigation: NativeStackNavigationProp<RootStackParamList, 'AddEntry'>;
};

export const AddEntryScreen = ({ route, navigation }: AddEntryScreenProps) => {
  const { entryToEdit, mode } = route.params || {};
  const isEditMode = mode === 'edit' && entryToEdit;

  const [entryType, setEntryType] = useState(entryToEdit?.entry_type || '');
  const [notes, setNotes] = useState(entryToEdit?.notes || '');
  const [entryDate, setEntryDate] = useState(
    entryToEdit?.entry_date ? new Date(entryToEdit.entry_date) : new Date()
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  
  const notesInputRef = useRef<TextInput>(null);
  const entryTypeOptions = getEntryTypeOptions();

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setEntryDate(selectedDate);
    }
  };

  const validateForm = () => {
    if (!entryType) {
      Alert.alert('Missing Information', 'Please select an entry type');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        setError('Authentication required. Please sign in to add entries.');
        setLoading(false);
        return;
      }

      const entryData = {
        entry_type: entryType,
        entry_date: format(entryDate, 'yyyy-MM-dd'),
        notes,
      };

      let result;
      if (isEditMode && entryToEdit) {
        // Update existing entry
        result = await timelineService.updateEntry(entryToEdit.id, entryData);
        if (result) {
          logger.info('Timeline entry updated successfully', { entryId: entryToEdit.id });
          navigation.goBack();
        }
      } else {
        // Add new entry
        result = await timelineService.addEntry(entryData);
        if (result) {
          logger.info('New timeline entry added successfully');
          navigation.goBack();
        }
      }

      if (!result) {
        setError('Failed to save entry. Please try again.');
      }
    } catch (err) {
      logger.error('Error saving timeline entry', { error: err });
      setError('An error occurred while saving your entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEntryTypeSelect = (type: string) => {
    setEntryType(type);
    setTypeMenuOpen(false);
    
    // Focus on notes input after selecting type
    setTimeout(() => {
      if (notesInputRef.current) {
        notesInputRef.current.focus();
      }
    }, 100);
  };

  return (
    <LinearGradient
      colors={[colors.bgGradientStart, colors.bgGradientEnd]}
      className="flex-1"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView
          className="flex-1 p-4"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <View className="bg-white rounded-lg p-5 shadow-sm mb-4">
            <Text className="text-xl font-bold mb-1 text-gray-800">
              {isEditMode ? 'Edit Timeline Entry' : 'Add Timeline Entry'}
            </Text>
            <Text className="text-gray-500 mb-4">
              {isEditMode
                ? 'Update information about this milestone'
                : 'Record a new milestone in your journey'}
            </Text>

            {/* Entry Type Selector */}
            <View className="mb-4">
              <Text className="text-gray-700 mb-1 font-medium">Entry Type</Text>
              <TouchableOpacity
                onPress={() => setTypeMenuOpen(!typeMenuOpen)}
                className="border border-gray-300 rounded-lg p-3 flex-row justify-between items-center bg-white"
              >
                <Text className={entryType ? "text-gray-800" : "text-gray-400"}>
                  {entryType ? translateEntryType(entryType) : 'Select entry type'}
                </Text>
                <Ionicons
                  name={typeMenuOpen ? "chevron-up" : "chevron-down"}
                  size={16}
                  color="#666"
                />
              </TouchableOpacity>

              {/* Entry Type Dropdown Menu */}
              {typeMenuOpen && (
                <View className="border border-gray-300 rounded-lg mt-1 bg-white max-h-60 overflow-hidden">
                  <ScrollView nestedScrollEnabled={true} className="max-h-60">
                    {entryTypeOptions.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        onPress={() => handleEntryTypeSelect(option.value)}
                        className={`p-3 border-b border-gray-100 ${
                          entryType === option.value ? "bg-gray-100" : ""
                        }`}
                      >
                        <Text className="text-gray-800">{option.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Date Picker */}
            <View className="mb-4">
              <Text className="text-gray-700 mb-1 font-medium">Date</Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                className="border border-gray-300 rounded-lg p-3 bg-white"
              >
                <Text className="text-gray-800">
                  {format(entryDate, 'MMMM d, yyyy')}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={entryDate}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                />
              )}
            </View>

            {/* Notes */}
            <View className="mb-4">
              <Text className="text-gray-700 mb-1 font-medium">Notes</Text>
              <TextInput
                ref={notesInputRef}
                value={notes}
                onChangeText={setNotes}
                placeholder="Add details about this milestone..."
                multiline
                className="border border-gray-300 rounded-lg p-3 min-h-[100px] bg-white text-gray-800"
                textAlignVertical="top"
                placeholderTextColor="#9ca3af"
              />
            </View>

            {/* Error message */}
            {error && (
              <View className="mb-4 p-3 bg-red-50 rounded-lg">
                <Text className="text-red-600">{error}</Text>
              </View>
            )}
          </View>

          {/* Submit Button */}
          {!isKeyboardVisible && (
            <View className="mt-auto">
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={loading}
                className={`rounded-lg p-4 ${
                  loading ? "bg-gray-400" : "bg-maple-leaf"
                } shadow-sm`}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="text-white font-bold text-center text-lg">
                    {isEditMode ? 'Update Entry' : 'Add Entry'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};
