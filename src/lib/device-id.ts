import * as Application from 'expo-application';
import * as SecureStore from 'expo-secure-store';

const DEVICE_ID_KEY = 'timelineEcoPR.deviceId';

/**
 * Retrieves existing device ID from secure storage or creates a new one
 */
export const getOrCreateDeviceId = async (): Promise<string> => {
  try {
    // Try to get existing ID from secure storage
    let deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);

    if (!deviceId) {
      // Generate a new device ID
      deviceId =
        Application.androidId ||
        Application.iosIdForVendor ||
        `device_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

      // Store it securely
      await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
    }

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
  const deviceId = await getOrCreateDeviceId();

  try {
    // Set device context for Row Level Security
    await supabaseClient.rpc('set_device_context', { device_id: deviceId });

    // Register or update the device record
    const { data, error } = await supabaseClient.from('devices').upsert(
      {
        device_identifier: deviceId,
        last_active: new Date().toISOString(),
      },
      { onConflict: 'device_identifier' }
    );

    if (error) throw error;

    return deviceId;
  } catch (error) {
    console.error('Error registering device:', error);
    return deviceId; // Still return the ID even if registration fails
  }
};
