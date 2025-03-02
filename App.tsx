import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@env';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import './global.css';
import { registerDeviceWithSupabase } from './src/lib/device-id';
import { supabase } from './src/lib/supabase';
import { AppNavigator } from './src/navigation/app-navigator';

export default function App() {
  const [initialized, setInitialized] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [envStatus, setEnvStatus] = useState<{
    supabaseUrl: boolean;
    supabaseKey: boolean;
  }>({
    supabaseUrl: false,
    supabaseKey: false,
  });

  useEffect(() => {
    // Check environment variables
    setEnvStatus({
      supabaseUrl: !!SUPABASE_URL,
      supabaseKey: !!SUPABASE_ANON_KEY,
    });

    const initializeApp = async () => {
      try {
        // Check required environment variables
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
          throw new Error('Missing required environment variables');
        }

        // Register device and get device ID
        const id = await registerDeviceWithSupabase(supabase);
        setDeviceId(id);
        setInitialized(true);
      } catch (error) {
        console.error(
          'Error initializing app:',
          error instanceof Error ? error.message : 'Unknown error'
        );

        // Provide more specific error messages
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
          setError('Environment configuration issue: Missing Supabase credentials');
        } else {
          setError('Failed to initialize app. Please try again later.');
        }

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

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-4">
        <View className="w-full rounded-md bg-red-100 p-4">
          <Text className="text-lg font-bold text-red-700">Error</Text>
          <Text className="text-red-700">{error}</Text>
        </View>

        <View className="mt-4 w-full rounded-md bg-amber-100 p-4">
          <Text className="text-lg font-bold text-amber-700">Environment Status</Text>
          <Text className="text-amber-700">
            SUPABASE_URL: {envStatus.supabaseUrl ? 'Set ✅' : 'Missing ❌'}
          </Text>
          <Text className="text-amber-700">
            SUPABASE_ANON_KEY: {envStatus.supabaseKey ? 'Set ✅' : 'Missing ❌'}
          </Text>
        </View>

        <ScrollView className="mt-4 w-full rounded-md bg-gray-100 p-4">
          <Text className="text-lg font-bold">Troubleshooting</Text>
          <Text className="mt-2">1. Make sure you have a .env file in the project root</Text>
          <Text className="mt-2">
            2. Verify that the .env file contains both SUPABASE_URL and SUPABASE_ANON_KEY
          </Text>
          <Text className="mt-2">3. Restart the development server with:</Text>
          <Text className="mt-1 font-mono">npx expo start -c</Text>
        </ScrollView>
      </View>
    );
  }

  if (!deviceId) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text>Failed to initialize device ID</Text>
      </View>
    );
  }

  return (
    <>
      <AppNavigator deviceId={deviceId} />
      <StatusBar style="auto" />
    </>
  );
}
