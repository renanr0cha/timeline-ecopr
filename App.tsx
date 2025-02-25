import { ScreenContent } from 'components/screen-content'; // Updated import path
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import './global.css';
import { registerDeviceWithSupabase } from './src/lib/device-id'; // Updated import path
import { supabase } from './src/lib/supabase';


export default function App() {
  const [initialized, setInitialized] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Register device and get device ID
        const id = await registerDeviceWithSupabase(supabase);
        setDeviceId(id);
        setInitialized(true);
      } catch (error) {
        console.error(
          'Error initializing app:',
          error instanceof Error ? error.message : 'Unknown error'
        );
        setError('Failed to initialize app. Please try again later.');
        setInitialized(true); // Still mark as initialized to show error UI
      }
    };

    initializeApp();
  }, []);

  if (!initialized) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#0000ff" />
        <Text className="mt-4">Initializing app...</Text>
      </View>
    );
  }

  return (
    <>
      <ScreenContent title="Timeline ecoPR" path="App.tsx" />
      {error && (
        <View className="m-4 rounded-md bg-red-100 p-4">
          <Text className="text-red-700">{error}</Text>
        </View>
      )}
      {deviceId && (
        <View className="p-4">
          <Text className="text-gray-500">Device ID: {deviceId}</Text>
        </View>
      )}
      <StatusBar style="auto" />
    </>
  );
}
