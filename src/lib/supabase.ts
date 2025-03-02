import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

// Use environment variables for Supabase configuration
const supabaseUrl = SUPABASE_URL;
const supabaseAnonKey = SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Sets the device context in Supabase for Row Level Security
 */
export const setDeviceContext = async (deviceId: string): Promise<void> => {
  try {
    await supabase.rpc('set_device_context', { device_id: deviceId });
  } catch (error) {
    console.error('Failed to set device context:', error);
  }
};