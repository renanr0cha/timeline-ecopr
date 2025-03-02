import { PostgrestError } from '@supabase/supabase-js';

import { logger } from '../lib/logger';
import { supabase } from '../lib/supabase';

type EntryType = 'aor' | 'p2' | 'ecopr' | 'pr_card';

interface TimelineEntry {
  id?: string;
  entry_type: EntryType;
  entry_date: string;
  notes?: string;
}

/**
 * Service for managing timeline entries
 * Handles CRUD operations for timeline entries through Supabase
 */
export const timelineService = {
  /**
   * Adds a new timeline entry or updates an existing one
   *
   * @param deviceId - Unique identifier for the device
   * @param entryType - Type of timeline entry (aor, p2, ecopr, pr_card)
   * @param entryDate - Date of the entry in ISO format (YYYY-MM-DD)
   * @param notes - Optional notes for the entry
   * @returns Promise resolving to the created/updated entry
   * @throws Error if device not found or database operation fails
   */
  async addEntry(
    deviceId: string,
    entryType: EntryType,
    entryDate: string,
    notes: string = ''
  ): Promise<any> {
    if (!deviceId) {
      throw new Error('Device ID is required');
    }

    try {
      // First get the device record to link to
      const { data: deviceData, error: deviceError } = await supabase
        .from('devices')
        .select('id')
        .eq('device_identifier', deviceId)
        .single();

      if (deviceError) {
        if (deviceError.code === 'PGRST116') {
          logger.error('Device not found', { deviceId });
          throw new Error('Device not found');
        }
        logger.error('Error retrieving device', { error: deviceError, deviceId });
        throw deviceError;
      }

      if (!deviceData?.id) {
        logger.error('Device data missing ID', { deviceId });
        throw new Error('Device not found');
      }

      // Then add the entry
      const { data, error } = await supabase.from('timeline_entries').upsert(
        {
          device_id: deviceData.id,
          entry_type: entryType,
          entry_date: entryDate,
          notes,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'device_id,entry_type',
        }
      );

      if (error) {
        logger.error('Error adding timeline entry', { error, deviceId, entryType });
        throw error;
      }

      logger.info('Timeline entry added/updated successfully', { deviceId, entryType });
      return data;
    } catch (error) {
      // Specific handling for different error types
      if (error instanceof PostgrestError) {
        logger.error('Supabase error adding timeline entry', {
          code: error.code,
          message: error.message,
          hint: error.hint,
          details: error.details,
        });
        throw new Error(`Database error: ${error.message}`);
      } else if (error instanceof Error) {
        logger.error('Error adding timeline entry', { message: error.message });
        throw error;
      } else {
        logger.error('Unknown error adding timeline entry', { error });
        throw new Error('An unexpected error occurred');
      }
    }
  },

  /**
   * Retrieves the timeline entries for a specific device
   *
   * @param deviceId - Unique identifier for the device
   * @returns Promise resolving to an array of timeline entries
   */
  async getUserTimeline(deviceId: string): Promise<TimelineEntry[]> {
    if (!deviceId) {
      logger.warn('Attempted to get timeline with empty deviceId');
      return [];
    }

    try {
      const { data: deviceData, error: deviceError } = await supabase
        .from('devices')
        .select('id')
        .eq('device_identifier', deviceId)
        .single();

      if (deviceError) {
        if (deviceError.code === 'PGRST116') {
          logger.info('No device found for timeline retrieval', { deviceId });
          return [];
        }
        logger.error('Error retrieving device for timeline', { error: deviceError, deviceId });
        throw deviceError;
      }

      if (!deviceData?.id) {
        logger.info('No device ID found for timeline retrieval', { deviceId });
        return [];
      }

      const { data, error } = await supabase
        .from('timeline_entries')
        .select('*')
        .eq('device_id', deviceData.id)
        .order('entry_date', { ascending: true });

      if (error) {
        logger.error('Error retrieving timeline entries', { error, deviceId });
        throw error;
      }

      logger.info('Timeline entries retrieved successfully', {
        deviceId,
        count: data?.length || 0,
      });
      return data || [];
    } catch (error) {
      if (error instanceof PostgrestError) {
        logger.error('Supabase error retrieving timeline', {
          code: error.code,
          message: error.message,
        });
        return [];
      } else {
        logger.error('Error retrieving timeline', { error });
        return [];
      }
    }
  },

  /**
   * Updates a timeline entry
   * 
   * @param deviceId - Unique identifier for the device
   * @param entryId - ID of the entry to update
   * @param updates - Object containing fields to update
   * @returns Promise resolving to the updated entry
   */
  async updateEntry(
    deviceId: string,
    entryId: string,
    updates: Partial<TimelineEntry>
  ): Promise<any> {
    if (!deviceId) {
      logger.warn('Attempted to update entry with empty deviceId');
      throw new Error('Device ID is required');
    }
    
    if (!entryId) {
      logger.warn('Attempted to update entry with empty entryId');
      throw new Error('Entry ID is required');
    }

    try {
      const { data: deviceData, error: deviceError } = await supabase
        .from('devices')
        .select('id')
        .eq('device_identifier', deviceId)
        .single();

      if (deviceError) {
        logger.error('Error retrieving device for update', { error: deviceError, deviceId });
        throw deviceError;
      }

      if (!deviceData?.id) {
        logger.error('Device not found for update', { deviceId });
        throw new Error('Device not found');
      }

      const { data, error } = await supabase
        .from('timeline_entries')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', entryId)
        .eq('device_id', deviceData.id);

      if (error) {
        logger.error('Error updating timeline entry', { error, deviceId, entryId });
        throw error;
      }
      
      logger.info('Timeline entry updated successfully', { deviceId, entryId });
      return data;
    } catch (error) {
      if (error instanceof PostgrestError) {
        logger.error('Supabase error updating timeline entry', {
          code: error.code,
          message: error.message,
          hint: error.hint,
        });
      } else if (error instanceof Error) {
        logger.error('Error updating timeline entry', { message: error.message });
      } else {
        logger.error('Unknown error updating timeline entry', { error });
      }
      throw error;
    }
  },

  /**
   * Deletes a timeline entry
   * 
   * @param deviceId - Unique identifier for the device
   * @param entryId - ID of the entry to delete
   * @returns Promise that resolves when the entry is deleted
   */
  async deleteEntry(deviceId: string, entryId: string): Promise<void> {
    if (!deviceId) {
      logger.warn('Attempted to delete entry with empty deviceId');
      throw new Error('Device ID is required');
    }
    
    if (!entryId) {
      logger.warn('Attempted to delete entry with empty entryId');
      throw new Error('Entry ID is required');
    }

    try {
      const { data: deviceData, error: deviceError } = await supabase
        .from('devices')
        .select('id')
        .eq('device_identifier', deviceId)
        .single();

      if (deviceError) {
        logger.error('Error retrieving device for deletion', { error: deviceError, deviceId });
        throw deviceError;
      }

      if (!deviceData?.id) {
        logger.error('Device not found for deletion', { deviceId });
        throw new Error('Device not found');
      }

      const { error } = await supabase
        .from('timeline_entries')
        .delete()
        .eq('id', entryId)
        .eq('device_id', deviceData.id);

      if (error) {
        logger.error('Error deleting timeline entry', { error, deviceId, entryId });
        throw error;
      }
      
      logger.info('Timeline entry deleted successfully', { deviceId, entryId });
    } catch (error) {
      if (error instanceof PostgrestError) {
        logger.error('Supabase error deleting timeline entry', {
          code: error.code,
          message: error.message,
          hint: error.hint,
        });
      } else if (error instanceof Error) {
        logger.error('Error deleting timeline entry', { message: error.message });
      } else {
        logger.error('Unknown error deleting timeline entry', { error });
      }
      throw error;
    }
  },
};
