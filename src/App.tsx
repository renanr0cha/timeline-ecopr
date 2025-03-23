import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { getAuthState } from './lib/auth';
import { logger } from './lib/logger';
import { AppNavigator } from './navigation/app-navigator';
import LoginScreen from './screens/login-screen';
import { AuthState } from './types';

/**
 * Main application component
 */
export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [authState, setAuthState] = useState<AuthState>({ session: null, user: null });

  useEffect(() => {
    // Load authentication state on app start
    const loadAuthState = async () => {
      try {
        setIsLoading(true);
        const state = await getAuthState();
        setAuthState(state);
        logger.info('Auth state loaded', { isAuthenticated: !!state.session });
      } catch (error) {
        logger.error('Error loading auth state', { error });
      } finally {
        setIsLoading(false);
      }
    };

    loadAuthState();
  }, []);

  // Handle successful login
  const handleLoginSuccess = () => {
    logger.info('Login successful');
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-600">Loading...</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {authState.session ? (
        <AppNavigator />
      ) : (
        <LoginScreen 
          onLoginSuccess={handleLoginSuccess} 
          authState={authState}
          setAuthState={setAuthState}
        />
      )}
      <StatusBar style="auto" />
    </NavigationContainer>
  );
} 