import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

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
  console.log('LoginScreen initializing...', { authState: !!authState });

  // Move hooks OUT of try block - hooks must be at the top level
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');

  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Handle mode transitions with animations
  const transitionToMode = (newMode: 'signin' | 'signup' | 'reset') => {
    // Start fade out
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      // Change mode after fade out
      setMode(newMode);

      // Reset slide position based on transition direction
      const slideValue = newMode === 'signin' ? -100 : 100;
      slideAnim.setValue(slideValue);

      // Start fade in and slide animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  console.log('LoginScreen states initialized');

  useEffect(() => {
    console.log('LoginScreen useEffect running');
    // Check if we already have a session
    console.log('Checking for existing session...');
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        console.log('Session check result:', { hasSession: !!session });
        if (session) {
          setAuthState({
            session: {
              access_token: session.access_token,
              refresh_token: session.refresh_token,
              expires_at: session.expires_at || 0,
              user: session.user,
            },
            user: session.user,
          });
          onLoginSuccess();
        }
      })
      .catch((err) => {
        console.error('Error getting session:', err);
      });

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', { hasSession: !!session });
      setAuthState({
        session: session
          ? {
              access_token: session.access_token,
              refresh_token: session.refresh_token,
              expires_at: session.expires_at || 0,
              user: session.user,
            }
          : null,
        user: session?.user || null,
      });
      if (session) {
        onLoginSuccess();
      }
    });

    return () => {
      console.log('LoginScreen cleaning up subscription');
      subscription.unsubscribe();
    };
  }, []);

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
      logger.info('Signed up with email', { userId: data.user?.id });

      // Check if email confirmation is required
      if (data.session === null) {
        Alert.alert(
          'Check your email',
          'We sent you an email with a confirmation link to complete your sign up.',
          [{ text: 'OK' }]
        );
        transitionToMode('signin');
      }
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

      Alert.alert('Check your email', 'We sent you an email with a password reset link.', [
        { text: 'OK' },
      ]);
      transitionToMode('signin');
    } catch (error: any) {
      logger.error('Password reset error', { error });
      setError(error.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Updated functional login screen with signup option
  console.log('Rendering login screen, mode:', mode);
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center p-6">
          {/* App Logo */}
          <View className="mb-[30px] h-[100px] w-[100px] items-center justify-center rounded-full bg-maple-red shadow-lg">
            <Text className="text-[36px] font-bold text-white">PR</Text>
          </View>

          <Text className="mb-[10px] text-[28px] font-bold text-text-primary">Timeline ecoPR</Text>

          <Animated.Text
            className="mb-[30px] text-center text-base text-text-secondary"
            style={{
              opacity: fadeAnim,
              transform: [{ translateX: slideAnim }],
            }}>
            {mode === 'signin'
              ? 'Track your PR journey with ease'
              : mode === 'signup'
                ? 'Join our community of PR applicants'
                : "We'll help you get back in"}
          </Animated.Text>

          <Animated.View
            className="w-full max-w-[350px]"
            style={{
              opacity: fadeAnim,
              transform: [{ translateX: slideAnim }],
            }}>
            <TextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              className="mb-4 w-full rounded-[10px] border border-gray-200 bg-white p-[15px] text-base"
              placeholderTextColor="#94a3b8"
            />

            {mode !== 'reset' && (
              <TextInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                className="mb-6 w-full rounded-[10px] border border-gray-200 bg-white p-[15px] text-base"
                placeholderTextColor="#94a3b8"
              />
            )}

            {/* Action button based on current mode */}
            <TouchableOpacity
              onPress={
                mode === 'signin'
                  ? handleEmailSignIn
                  : mode === 'signup'
                    ? handleEmailSignUp
                    : handleResetPassword
              }
              className="mb-5 w-full items-center rounded-[10px] bg-maple-red p-[15px] shadow"
              disabled={isLoading}>
              <Text className="text-base font-semibold text-white">
                {isLoading
                  ? 'Processing...'
                  : mode === 'signin'
                    ? 'Sign In'
                    : mode === 'signup'
                      ? 'Sign Up'
                      : 'Reset Password'}
              </Text>
            </TouchableOpacity>

            {/* Mode switchers */}
            <View className="mt-[10px] flex-row justify-center">
              {mode === 'signin' && (
                <>
                  <TouchableOpacity onPress={() => transitionToMode('signup')}>
                    <Text className="text-[15px] font-medium text-maple-red">
                      Create an account
                    </Text>
                  </TouchableOpacity>
                  <Text className="mx-2 text-text-secondary">•</Text>
                  <TouchableOpacity onPress={() => transitionToMode('reset')}>
                    <Text className="text-[15px] font-medium text-maple-red">Forgot password?</Text>
                  </TouchableOpacity>
                </>
              )}

              {mode === 'signup' && (
                <TouchableOpacity onPress={() => transitionToMode('signin')}>
                  <Text className="text-[15px] font-medium text-maple-red">
                    Already have an account? Sign in
                  </Text>
                </TouchableOpacity>
              )}

              {mode === 'reset' && (
                <TouchableOpacity onPress={() => transitionToMode('signin')}>
                  <Text className="text-[15px] font-medium text-maple-red">Back to Sign In</Text>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>

          {error && (
            <View className="border-l-status-error mt-6 w-full max-w-[350px] rounded-lg border-l-4 bg-[rgba(239,68,68,0.1)] p-3">
              <Text className="text-status-error">{error}</Text>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </>
  );
}
