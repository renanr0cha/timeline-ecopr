/**
 * Type definitions for Timeline-ecoPR application
 * This file centralizes type definitions used across the application
 */

// Re-export all custom error types
export * from './errors';

/**
 * Entry types for timeline entries
 */
export type EntryType =
  | 'submission'
  | 'aor'
  | 'biometrics_request'
  | 'biometrics_complete'
  | 'medicals_request'
  | 'medicals_complete'
  | 'background_start'
  | 'background_complete'
  | 'additional_docs'
  | 'p1'
  | 'p2'
  | 'ecopr'
  | 'pr_card';

/**
 * Timeline entry data structure
 */
export interface TimelineEntry {
  id?: string;
  user_id?: string;
  entry_type: EntryType;
  entry_date: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Community statistics data structure
 */
export interface CommunityStatistic {
  transition_type: string;
  avg_days: number;
  min_days: number;
  max_days: number;
  count: number;
  month_year?: string;
  waiting_count?: number; // Count of people waiting (e.g., with P2 waiting for ecoPR)
  week_breakdown?: WeeklyBreakdown[]; // Weekly breakdown data
}

/**
 * Weekly breakdown of statistics
 */
export interface WeeklyBreakdown {
  week_range: string;
  count: number;
}

/**
 * Device registration data
 */
export interface DeviceData {
  id: string;
  device_identifier: string;
  created_at?: string;
  last_active?: string;
}

/**
 * Navigation parameters for stack navigator
 */
export type RootStackParamList = {
  Main: undefined;
  Home: undefined;
  AddEntry: {
    entryType?: EntryType;
    entryId?: string;
    onComplete?: () => void;
    existingEntries?: TimelineEntry[];
  };
  Statistics: undefined;
  MockDataDemo: undefined;
};

/**
 * Navigation parameters for bottom tabs
 */
export type TabsParamList = {
  HomeTab: undefined;
  StatisticsTab: undefined;
};

/**
 * Environment variables type definition
 */
export interface EnvVariables {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
}

/**
 * Error response from services
 */
export interface ServiceError {
  code?: string;
  message: string;
  details?: string;
}

// Define application-wide types
export interface Device {
  id: string;
  device_identifier: string;
  created_at?: string;
  last_active?: string;
}

export interface CommunityStatistics {
  entry_type: string;
  count: number;
  average_days: number;
  min_days: number;
  max_days: number;
}

export interface SupabaseError {
  code: string;
  message: string;
  hint?: string;
  details?: string;
}

/**
 * Authentication state
 */
export interface AuthState {
  session: Session | null;
  user: User | null;
}

/**
 * User session type
 */
export interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: User;
}

/**
 * User profile
 */
export interface User {
  id: string;
  email?: string;
  app_metadata: {
    provider?: string;
    [key: string]: any;
  };
  user_metadata: {
    avatar_url?: string;
    full_name?: string;
    name?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

/**
 * Statistics for a user's journey transition metrics
 */
export interface TransitionStatistics {
  submissionToAOR: number;
  aorToBiometrics: number;
  biometricsToMedicals: number;
  backgroundCheckDuration: number;
  totalProcessingTime: number;
  applicationProgress: number;
  estimatedDaysRemaining: number;
  milestoneNotes: {
    title: string;
    description: string;
  }[];
}
