import { betterAuth } from 'better-auth';

import { AuthState } from '../types';
import { logger } from './logger';
import { supabase } from './supabase';

/**
 * Configure BetterAuth with Supabase integration
 */
export const auth = betterAuth({
  supabase,
  logger: {
    debug: logger.debug,
    info: logger.info,
    warn: logger.warn,
    error: logger.error
  },
});

/**
 * Sign up a new user with email and password
 *
 * @param email User's email address
 * @param password User's password
 * @returns Promise resolving to the auth data or error
 */
export const signUpWithEmail = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      logger.error('Error signing up with email', { error });
      throw error;
    }

    logger.info('User signed up successfully', { userId: data.user?.id });
    return { data };
  } catch (error) {
    logger.error('Error in signUpWithEmail', { error });
    throw error;
  }
};

/**
 * Sign in a user with email and password
 *
 * @param email User's email address
 * @param password User's password
 * @returns Promise resolving to the auth data or error
 */
export const signInWithEmail = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      logger.error('Error signing in with email', { error });
      throw error;
    }

    logger.info('User signed in successfully', { userId: data.user?.id });
    return { data };
  } catch (error) {
    logger.error('Error in signInWithEmail', { error });
    throw error;
  }
};

/**
 * Sign out the current user
 */
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      logger.error('Error signing out', { error });
      throw error;
    }

    logger.info('User signed out successfully');
  } catch (error) {
    logger.error('Error in signOut', { error });
    throw error;
  }
};

/**
 * Reset a user's password
 *
 * @param email User's email address
 */
export const resetPassword = async (email: string) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'timeline-ecopr://reset-password',
    });

    if (error) {
      logger.error('Error resetting password', { error });
      throw error;
    }

    logger.info('Password reset email sent', { email });
  } catch (error) {
    logger.error('Error in resetPassword', { error });
    throw error;
  }
};

/**
 * Check current auth state
 *
 * @returns Current auth state (session and user)
 */
export const getAuthState = async (): Promise<AuthState> => {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      logger.error('Error getting session', { error });
      return { session: null, user: null };
    }

    const mappedSession = session ? {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at || 0,
      user: session.user
    } : null;

    return {
      session: mappedSession,
      user: session?.user || null,
    };
  } catch (error) {
    logger.error('Error in getAuthState', { error });
    return { session: null, user: null };
  }
};
