import { betterAuth } from 'better-auth';

/**
 * BetterAuth configuration for social authentication
 */
export const auth = betterAuth({
  // Apple configuration
  apple: {
    // Enable Apple authentication
    enabled: true,
    // Options for Apple Sign In
    options: {
      // Your Apple Service ID (can be obtained from Apple Developer Portal)
      clientId: 'com.yourcompany.timeline-ecopr',
      // Redirect URL registered in your Apple Developer Portal
      redirectUri: 'https://your-supabase-project.supabase.co/auth/v1/callback',
      // Requested scopes (name and email are common)
      scopes: ['name', 'email'],
    },
  },
  
  // Google configuration
  google: {
    // Enable Google authentication
    enabled: true,
    // Options for Google Sign In
    options: {
      // Your Google Web Client ID from Google Cloud Console
      webClientId: 'your-web-client-id.apps.googleusercontent.com',
      // Optional iOS Client ID for better iOS integration
      iosClientId: 'your-ios-client-id.apps.googleusercontent.com',
      // Optional offline access for refreshing tokens
      offlineAccess: true,
      // Requested scopes (profile and email are typical defaults)
      scopes: ['profile', 'email'],
    },
  },
  
  // Common configuration
  common: {
    // URL to your Supabase auth callback endpoint
    redirectUrl: 'https://your-supabase-project.supabase.co/auth/v1/callback',
    // Optional custom error handler
    onError: (error) => {
      console.error('Authentication error:', error);
    },
  },
});

/**
 * Sign in with Google using BetterAuth
 * @returns Promise with the auth response
 */
export const signInWithGoogle = async () => {
  try {
    // Start Google sign-in flow
    const { token, user } = await auth.google.signIn();
    
    // Return the authentication result
    return { token, user };
  } catch (error) {
    console.error('Google sign-in error:', error);
    throw error;
  }
};

/**
 * Sign in with Apple using BetterAuth
 * @returns Promise with the auth response
 */
export const signInWithApple = async () => {
  try {
    // Start Apple sign-in flow
    const { token, user } = await auth.apple.signIn();
    
    // Return the authentication result
    return { token, user };
  } catch (error) {
    console.error('Apple sign-in error:', error);
    throw error;
  }
};
