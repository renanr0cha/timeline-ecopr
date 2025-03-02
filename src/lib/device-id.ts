import * as Application from 'expo-application';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const DEVICE_ID_KEY = 'timeline-ecopr.device-id';

/**
 * Retrieves existing device ID from secure storage or creates a new one
 */
export const getOrCreateDeviceId = async (): Promise<string> => {
  try {
    // Try to get existing ID from secure storage
    const storedDeviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);

    if (storedDeviceId) {
      return storedDeviceId;
    }

    // Generate a new device ID using the correct API methods
    let deviceId = '';

    try {
      // These methods might not be available on all platforms
      if (Platform.OS === 'android') {
        deviceId = Application.getAndroidId() || '';
      }
      if (!deviceId && Platform.OS === 'ios') {
        // iOS ID is async
        const iosId = await Application.getIosIdForVendorAsync();
        deviceId = iosId || '';
      }
    } catch (platformError) {
      console.error('Error getting platform ID:', platformError);
    }

    // If no platform ID available, generate a random one
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    }

    // Store it securely
    await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
    return deviceId;
  } catch (error) {
    console.error('Error managing device ID:', error);
    // Fallback approach
    return `fallback_${Date.now()}`;
  }
};

/**
 * Registers device with Supabase and sets the security context
 */
export const registerDeviceWithSupabase = async (supabaseClient: any): Promise<string> => {
  // Validate the Supabase client before proceeding
  if (!supabaseClient || typeof supabaseClient.rpc !== 'function') {
    console.error('Invalid Supabase client provided');
    throw new Error('Supabase client misconfigured - check your environment variables');
  }

  // Get the device ID
  const deviceId = await getOrCreateDeviceId();

  try {
    // Try to set device context for Row Level Security
    try {
      await supabaseClient.rpc('set_device_context', { device_id: deviceId });
    } catch (contextError) {
      console.error('Error setting device context:', contextError);
      // Continue despite context error - some operations might still work
    }

    // Register or update the device record with { returning: 'minimal' } to avoid SELECT after INSERT
    // This helps bypass the RLS policy check for SELECT
    const { error } = await supabaseClient.from('devices').upsert(
      {
        device_identifier: deviceId,
        last_active: new Date().toISOString(),
      },
      { 
        onConflict: 'device_identifier',
        returning: 'minimal' // Add this to avoid the SELECT operation after INSERT
      }
    );

    if (error) {
      console.error('Supabase upsert error:', error);
      
      // If this is an RLS error, provide a more helpful error message
      if (error.code === '42501' && error.message.includes('row-level security policy')) {
        console.info('This is an RLS policy error. Attempting to continue with the device ID anyway.');
        // Even if we can't register in the database, we can still return the device ID
        // This allows the app to function even with RLS issues
        return deviceId;
      }
      
      throw new Error(`Failed to register device: ${error.message}`);
    }

    return deviceId;
  } catch (error) {
    console.error('Error registering device:', error);

    // Check if this might be an environment variable issue
    if (
      error instanceof Error &&
      (error.message.includes('URL') ||
        error.message.includes('key') ||
        error.message.includes('configuration'))
    ) {
      throw new Error('Supabase connection failed - check your environment variables');
    }

    throw error; // Re-throw for App component to handle
  }
};
