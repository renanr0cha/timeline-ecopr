import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@env';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import 'react-native-get-random-values';
import './global.css';
import { logger } from './src/lib/logger';
import { supabase } from './src/lib/supabase';
import { AppNavigator } from './src/navigation/app-navigator';
import LoginScreen from './src/screens/login-screen';
import { AuthState } from './src/types';

export default function App() {
  console.log('App starting...', {
    SUPABASE_URL_EXISTS: !!SUPABASE_URL,
    SUPABASE_KEY_EXISTS: !!SUPABASE_ANON_KEY,
  });

  // Initialize state outside of try block to fix React hooks rules violation
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authState, setAuthState] = useState<AuthState>({
    session: null,
    user: null,
  });
  const [envStatus, setEnvStatus] = useState<{
    supabaseUrl: boolean;
    supabaseKey: boolean;
  }>({
    supabaseUrl: false,
    supabaseKey: false,
  });

  // Move the initialization logic to a useEffect hook
  useEffect(() => {
    // Check environment variables
    console.log('Setting env status...');
    setEnvStatus({
      supabaseUrl: !!SUPABASE_URL,
      supabaseKey: !!SUPABASE_ANON_KEY,
    });

    const initializeApp = async () => {
      console.log('Initializing app...');
      try {
        // Check required environment variables
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
          console.log('Missing environment variables');
          throw new Error('Missing required environment variables');
        }

        // Get the current session
        console.log('Getting auth session...');
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.log('Session error:', sessionError.message);
          logger.warn('Error getting session', { error: sessionError });
        }

        console.log('Session found:', !!session);
        setAuthState({
          session: session
            ? {
                ...session,
                expires_at: session.expires_at || 0,
              }
            : null,
          user: session?.user || null,
        });

        setInitialized(true);
        setLoading(false);
        console.log('App initialized:', { hasError: !!error, hasSession: !!session });
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
        setLoading(false);
        console.log('App initialization failed:', {
          hasError: true,
          errorMsg: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    };

    initializeApp();

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', { hasSession: !!session });
      setAuthState({
        session: session
          ? {
              ...session,
              expires_at: session.expires_at || 0,
            }
          : null,
        user: session?.user || null,
      });
    });

    // Clean up the subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLoginSuccess = () => {
    logger.info('Login successful');
  };

  console.log('About to render App component', {
    loading,
    hasError: !!error,
    hasSession: !!authState?.session,
  });

  // Wrap the component in an error boundary to catch rendering errors
  try {
    // Use a single NavigationContainer with conditional rendering of screens
    return (
      <NavigationContainer>
        {loading ? (
          <View className="flex-1 items-center justify-center bg-white">
            <ActivityIndicator size="large" color="#0000ff" />
            <Text className="mt-4">Initializing app...</Text>
          </View>
        ) : error ? (
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
        ) : !authState.session ? (
          <LoginScreen
            onLoginSuccess={handleLoginSuccess}
            authState={authState}
            setAuthState={setAuthState}
          />
        ) : (
          <AppNavigator authState={authState} />
        )}
        <StatusBar style="auto" />
      </NavigationContainer>
    );
  } catch (fatalError) {
    console.error('Fatal error in App component:', fatalError);
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 18, marginBottom: 20, color: 'red' }}>Critical Error</Text>
        <Text>There was a fatal error in the application. Please restart.</Text>
      </View>
    );
  }
}
