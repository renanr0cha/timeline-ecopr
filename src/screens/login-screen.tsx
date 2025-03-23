import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import { ScreenContent } from '../components/screen-content';
import { ThemedCard } from '../components/themed-card';
import { colors } from '../constants/colors';
import { resetPassword, signInWithEmail, signUpWithEmail } from '../lib/auth';
import { logger } from '../lib/logger';
import { supabase } from '../lib/supabase';
import { AuthState } from '../types';

// Define the props for the component
interface LoginScreenProps {
  onLoginSuccess: () => void;
  authState: AuthState;
  setAuthState: React.Dispatch<React.SetStateAction<AuthState>>;
}

/**
 * Login screen component that provides email sign-in options
 */
export default function LoginScreen({ onLoginSuccess, authState, setAuthState }: LoginScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');

  useEffect(() => {
    // Check if we already have a session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setAuthState({ 
          session: {
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at || 0,
            user: session.user
          }, 
          user: session.user 
        });
        onLoginSuccess();
      }
    });

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setAuthState({ 
          session: session ? {
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at || 0,
            user: session.user
          } : null, 
          user: session?.user || null 
        });
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
   * Handle email sign in
   */
  const handleEmailSignIn = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data } = await signInWithEmail(email, password);
      
      logger.info('Signed in with email', { userId: data.user?.id });
    } catch (error: any) {
      logger.error('Email sign-in error', { error });
      setError(error.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle email sign up
   */
  const handleEmailSignUp = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data } = await signUpWithEmail(email, password);
      
      // Check if email confirmation is required
      if (data.session === null) {
        Alert.alert(
          'Check your email',
          'We sent you an email with a confirmation link to complete your sign up.',
          [{ text: 'OK' }]
        );
        setMode('signin');
      }
      
      logger.info('Signed up with email', { userId: data.user?.id });
    } catch (error: any) {
      logger.error('Email sign-up error', { error });
      setError(error.message || 'Failed to sign up. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle password reset request
   */
  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      await resetPassword(email);
      
      Alert.alert(
        'Check your email',
        'We sent you an email with a password reset link.',
        [{ text: 'OK' }]
      );
      setMode('signin');
    } catch (error: any) {
      logger.error('Password reset error', { error });
      setError(error.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Render based on current mode (signin, signup, reset)
   */
  const renderAuthForm = () => {
    return (
      <View>
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          className="mb-4 rounded-lg border border-gray-300 bg-white p-3 text-gray-800"
        />

        {mode !== 'reset' && (
          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            className="mb-4 rounded-lg border border-gray-300 bg-white p-3 text-gray-800"
          />
        )}

        {mode === 'signin' && (
          <>
            <TouchableOpacity
              onPress={handleEmailSignIn}
              disabled={isLoading}
              className="mb-4 overflow-hidden rounded-lg">
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                className="flex-row items-center justify-center px-6 py-3">
                <Ionicons name="log-in-outline" size={20} color="white" className="mr-2" />
                <Text className="text-base font-medium text-white">Sign In</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View className="mb-4 flex-row justify-between">
              <TouchableOpacity onPress={() => setMode('reset')}>
                <Text className="text-sm text-blue-600">Forgot Password?</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setMode('signup')}>
                <Text className="text-sm text-blue-600">Create Account</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {mode === 'signup' && (
          <>
            <TouchableOpacity
              onPress={handleEmailSignUp}
              disabled={isLoading}
              className="mb-4 overflow-hidden rounded-lg">
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                className="flex-row items-center justify-center px-6 py-3">
                <Ionicons name="person-add-outline" size={20} color="white" className="mr-2" />
                <Text className="text-base font-medium text-white">Sign Up</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View className="mb-4 flex-row justify-center">
              <TouchableOpacity onPress={() => setMode('signin')}>
                <Text className="text-sm text-blue-600">Already have an account? Sign In</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {mode === 'reset' && (
          <>
            <TouchableOpacity
              onPress={handleResetPassword}
              disabled={isLoading}
              className="mb-4 overflow-hidden rounded-lg">
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                className="flex-row items-center justify-center px-6 py-3">
                <Ionicons name="key-outline" size={20} color="white" className="mr-2" />
                <Text className="text-base font-medium text-white">Reset Password</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View className="mb-4 flex-row justify-center">
              <TouchableOpacity onPress={() => setMode('signin')}>
                <Text className="text-sm text-blue-600">Back to Sign In</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
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
            <View className="p-4">
              <Text className="mb-4 text-lg font-medium text-gray-700">
                {mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
              </Text>

              {/* Error message */}
              {error && (
                <View className="mb-4 rounded-md bg-red-50 p-3">
                  <Text className="text-center text-sm text-red-800">{error}</Text>
                </View>
              )}

              {/* Email Password Form */}
              {renderAuthForm()}

              {/* Loading indicator */}
              {isLoading && (
                <View className="mt-4 items-center">
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text className="mt-2 text-sm text-gray-500">Processing...</Text>
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
    </KeyboardAvoidingView>
  );
} 