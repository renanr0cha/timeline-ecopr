/**
 * Type definitions for Timeline-ecoPR application
 * This file centralizes type definitions used across the application
 */

/**
 * Entry types for timeline entries
 */
export type EntryType = 'aor' | 'p2' | 'ecopr' | 'pr_card';

/**
 * Timeline entry data structure
 */
export interface TimelineEntry {
  id?: string;
  device_id?: string;
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
  Home: undefined;
  AddEntry: { entryType?: EntryType; entryId?: string };
  Statistics: undefined;
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