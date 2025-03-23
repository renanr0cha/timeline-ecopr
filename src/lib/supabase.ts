import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

// Check environment variables and warn instead of throwing errors
if (!SUPABASE_URL) {
  console.warn('SUPABASE_URL is not defined in environment variables');
}

if (!SUPABASE_ANON_KEY) {
  console.warn('SUPABASE_ANON_KEY is not defined in environment variables');
}

// Use environment variables for Supabase configuration
const supabaseUrl = SUPABASE_URL || '';
const supabaseAnonKey = SUPABASE_ANON_KEY || '';

console.log('Initializing Supabase client with URL:', supabaseUrl ? 'Configured' : 'MISSING');
console.log('Supabase key status:', supabaseAnonKey ? 'Configured' : 'MISSING');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
