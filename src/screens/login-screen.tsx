import { Ionicons } from '@expo/vector-icons';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { appleLogin } from 'better-auth';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Text, TouchableOpacity, View } from 'react-native';

import { ScreenContent } from '../components/screen-content';
import { ThemedCard } from '../components/themed-card';
import { logger } from '../lib/logger';
import { supabase } from '../lib/supabase';
import { AuthState } from '../types';

// Define the props for the component
interface LoginScreenProps {
  onLoginSuccess: () => void;
  authState: AuthState;
  setAuthState: React.Dispatch<React.SetStateAction<AuthState>>;
}

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: '1234567890-abc123def456.apps.googleusercontent.com', // replace with your web client ID
  iosClientId: '1234567890-ghi789jkl012.apps.googleusercontent.com', // replace with your iOS client ID if you have one
});

/**
 * Login screen component that provides social sign-in options
 */
export default function LoginScreen({ onLoginSuccess, authState, setAuthState }: LoginScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if we already have a session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setAuthState({ session, user: session.user });
        onLoginSuccess();
      }
    });

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setAuthState({ session, user: session?.user || null });
        if (session) {
          onLoginSuccess();
        }
      }
    );

    // Clean up subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Sign in with Google
   */
  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Ensure Google Play Services are available (Android only)
      await GoogleSignin.hasPlayServices();
      
      // Sign in with Google
      const { idToken } = await GoogleSignin.signIn();
      
      // Sign in with Supabase using Google token
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (error) throw error;

      logger.info('Signed in with Google', { userId: data.user?.id });
    } catch (error) {
      logger.error('Google sign-in error', { error });
      setError('Failed to sign in with Google. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sign in with Apple
   */
  const handleAppleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Start Apple sign-in flow
      const { appleAuthRequestResponse } = await appleLogin();
      
      // Extract the identity token (JWT)
      const { identityToken } = appleAuthRequestResponse;
      
      if (!identityToken) {
        throw new Error('No identity token returned from Apple');
      }
      
      // Sign in with Supabase using Apple token
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: identityToken,
      });

      if (error) throw error;

      logger.info('Signed in with Apple', { userId: data.user?.id });
    } catch (error) {
      logger.error('Apple sign-in error', { error });
      setError('Failed to sign in with Apple. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContent scrollable>
      <View className="flex-1 items-center justify-center py-12">
        {/* Logo and Header */}
        <View className="mb-10 items-center">
          <Image
            source={require('../../assets/icon.png')}
            style={{ width: 100, height: 100 }}
            className="mb-4 rounded-xl"
          />
          <Text className="text-3xl font-bold text-gray-800">Timeline</Text>
          <Text className="text-center text-base text-gray-600">
            Track your PR journey milestones
          </Text>
        </View>

        <ThemedCard className="w-full max-w-md">
          <View className="p-2">
            <Text className="mb-6 text-center text-lg font-medium text-gray-700">
              Sign in to continue
            </Text>

            {/* Error message */}
            {error && (
              <View className="mb-4 rounded-md bg-red-50 p-3">
                <Text className="text-center text-sm text-red-800">{error}</Text>
              </View>
            )}

            {/* Google Sign In Button */}
            <TouchableOpacity
              onPress={handleGoogleSignIn}
              disabled={isLoading}
              className="mb-4 overflow-hidden rounded-xl">
              <LinearGradient
                colors={['#ffffff', '#f8f9fa']}
                className="flex-row items-center justify-center border border-gray-300 px-6 py-3">
                <Image
                  source={require('../../assets/google-logo.png')}
                  style={{ width: 24, height: 24 }}
                  className="mr-3"
                />
                <Text className="text-base font-medium text-gray-700">Sign in with Google</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Apple Sign In Button */}
            <TouchableOpacity
              onPress={handleAppleSignIn}
              disabled={isLoading}
              className="overflow-hidden rounded-xl">
              <LinearGradient
                colors={['#000000', '#333333']}
                className="flex-row items-center justify-center px-6 py-3">
                <Ionicons name="logo-apple" size={24} color="white" className="mr-3" />
                <Text className="text-base font-medium text-white">Sign in with Apple</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Loading indicator */}
            {isLoading && (
              <View className="mt-4 items-center">
                <ActivityIndicator size="small" color="#0284c7" />
                <Text className="mt-2 text-sm text-gray-500">Signing in...</Text>
              </View>
            )}
          </View>
        </ThemedCard>

        {/* Terms and Privacy */}
        <View className="mt-8">
          <Text className="text-center text-xs text-gray-500">
            By signing in, you agree to our{' '}
            <Text className="text-blue-500">Terms of Service</Text> and{' '}
            <Text className="text-blue-500">Privacy Policy</Text>
          </Text>
        </View>
      </View>
    </ScreenContent>
  );
} 