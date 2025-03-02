import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaskedTextInput } from 'react-native-mask-text';
import Icon from 'react-native-vector-icons/FontAwesome';

import { timelineService } from '../services/timeline-service';

interface AddEntryScreenProps {
  route: {
    params: {
      deviceId: string;
    };
  };
}

export default function AddEntryScreen({ route }: AddEntryScreenProps) {
  const { deviceId } = route.params;
  const navigation = useNavigation();

  const [entryType, setEntryType] = useState<'aor' | 'p2' | 'ecopr' | 'pr_card'>('aor');
  const [date, setDate] = useState(new Date());
  const [dateText, setDateText] = useState(formatDate(date));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Format date as MM/DD/YYYY
  function formatDate(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  }

  // Parse date from text input (MM/DD/YYYY)
  function parseDateFromText(text: string): Date | null {
    // Basic validation
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(text)) {
      return null;
    }

    const [month, day, year] = text.split('/').map(Number);
    const newDate = new Date(year, month - 1, day);

    // Validate the date is real (e.g., not 02/31/2023)
    if (
      newDate.getFullYear() !== year ||
      newDate.getMonth() !== month - 1 ||
      newDate.getDate() !== day
    ) {
      return null;
    }

    return newDate;
  }

  const handleDateTextChange = (text: string) => {
    setDateText(text);

    // Only update the date object if we have a complete valid date
    if (text.length === 10) {
      const parsedDate = parseDateFromText(text);
      if (parsedDate) {
        setDate(parsedDate);
      }
    }
  };

  const handleDatePickerChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
      setDateText(formatDate(selectedDate));
    }
  };

  const handleSubmit = async () => {
    // Validate date
    const parsedDate = parseDateFromText(dateText);
    if (!parsedDate) {
      Alert.alert('Invalid Date', 'Please enter a valid date in MM/DD/YYYY format.');
      return;
    }

    try {
      setSubmitting(true);

      // Format as YYYY-MM-DD for the database
      const formattedDate = parsedDate.toISOString().split('T')[0];

      await timelineService.addEntry(deviceId, entryType, formattedDate, notes);

      Alert.alert('Success', 'Timeline entry added successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error adding entry:', error);
      Alert.alert('Error', 'Failed to add timeline entry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white p-4">
      <Text className="mb-6 text-2xl font-bold">Add Timeline Entry</Text>

      <Text className="mb-2 font-bold">Entry Type</Text>
      <View className="mb-4 flex-row flex-wrap">
        {[
          { value: 'aor', label: 'AOR' },
          { value: 'p2', label: 'P2' },
          { value: 'ecopr', label: 'ecoPR' },
          { value: 'pr_card', label: 'PR Card' },
        ].map((item) => (
          <TouchableOpacity
            key={item.value}
            className={`mb-2 mr-2 rounded-md px-4 py-2 ${
              entryType === item.value ? 'bg-blue-500' : 'bg-gray-200'
            }`}
            onPress={() => setEntryType(item.value as any)}>
            <Text
              className={`font-medium ${
                entryType === item.value ? 'text-white' : 'text-gray-800'
              }`}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text className="mb-2 font-bold">Date</Text>
      <View className="mb-4 flex-row items-center">
        <View className="flex-1 overflow-hidden rounded-md border border-gray-300">
          <MaskedTextInput
            mask="99/99/9999"
            placeholder="MM/DD/YYYY"
            value={dateText}
            onChangeText={handleDateTextChange}
            keyboardType="numeric"
            className="p-3"
          />
        </View>
        <TouchableOpacity
          className="ml-2 rounded-md bg-gray-200 p-3"
          onPress={() => setShowDatePicker(true)}>
          <Icon name="calendar" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={handleDatePickerChange}
        />
      )}

      <Text className="mb-2 font-bold">Notes (Optional)</Text>
      <View className="mb-6 min-h-[100px] rounded-md border border-gray-300 p-3">
        <TextInput
          multiline
          placeholder="Add any additional notes here..."
          value={notes}
          onChangeText={setNotes}
          className="h-full"
        />
      </View>

      <TouchableOpacity
        className={`items-center rounded-md px-4 py-3 ${
          submitting ? 'bg-gray-400' : 'bg-blue-500'
        }`}
        onPress={handleSubmit}
        disabled={submitting}>
        <Text className="font-bold text-white">{submitting ? 'Saving...' : 'Save Entry'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
