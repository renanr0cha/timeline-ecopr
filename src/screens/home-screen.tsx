import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';

import { RootStackParamList } from '../navigation/app-navigator';
import { timelineService } from '../services/timeline-service';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

interface HomeScreenProps {
  route: {
    params: {
      deviceId: string;
    };
  };
}

export default function HomeScreen({ route }: HomeScreenProps) {
  const { deviceId } = route.params;
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const data = await timelineService.getUserTimeline(deviceId);
      setEntries(data);
    } catch (error) {
      console.error('Error loading entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEntryTypeLabel = (type: string) => {
    switch (type) {
      case 'aor': return 'AOR (Acknowledgement of Receipt)';
      case 'p2': return 'P2 (Portal 2 Login)';
      case 'ecopr': return 'ecoPR (Electronic Confirmation of PR)';
      case 'pr_card': return 'PR Card';
      default: return type;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <View className="flex-1 bg-white p-4">
      <Text className="text-2xl font-bold mb-6">Your PR Timeline</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : entries.length === 0 ? (
        <View className="items-center justify-center flex-1">
          <Text className="text-gray-500 mb-4">No timeline entries yet</Text>
          <TouchableOpacity
            className="bg-blue-500 py-2 px-4 rounded-md"
            onPress={() => navigation.navigate('AddEntry', { deviceId })}
          >
            <Text className="text-white font-bold">Add Your First Entry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View className="bg-gray-50 p-4 rounded-md mb-3 border border-gray-200">
              <Text className="font-bold text-lg">{getEntryTypeLabel(item.entry_type)}</Text>
              <Text className="text-gray-600">Date: {formatDate(item.entry_date)}</Text>
              {item.notes && <Text className="mt-2">{item.notes}</Text>}
            </View>
          )}
        />
      )}
      
      <View className="flex-row justify-between mt-4">
        <TouchableOpacity
          className="bg-blue-500 py-3 px-4 rounded-md flex-1 mr-2 items-center"
          onPress={() => navigation.navigate('AddEntry', { deviceId })}
        >
          <Text className="text-white font-bold">Add Entry</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          className="bg-green-500 py-3 px-4 rounded-md flex-1 ml-2 items-center"
          onPress={() => navigation.navigate('Statistics', { deviceId })}
        >
          <Text className="text-white font-bold">View Statistics</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
