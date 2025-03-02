import { PostgrestError } from '@supabase/supabase-js';

import { logger } from '../lib/logger';
import { supabase } from '../lib/supabase';
import {
  DatabaseError,
  DeviceNotFoundError,
  EntryNotFoundError,
  EntryType,
  NetworkError,
  TimelineEntry,
  ValidationError
} from '../types';

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
   * @throws ValidationError if required fields are missing
   * @throws DeviceNotFoundError if device is not found
   * @throws DatabaseError if a database operation fails
   */
  async addEntry(
    deviceId: string,
    entryType: EntryType,
    entryDate: string,
    notes: string = ''
  ): Promise<TimelineEntry> {
    if (!deviceId) {
      logger.warn('Attempted to add entry with empty deviceId');
      throw new ValidationError('deviceId');
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
          throw new DeviceNotFoundError(deviceId);
        }
        logger.error('Error retrieving device', { error: deviceError, deviceId });
        throw new DatabaseError(deviceError.message, {
          code: deviceError.code,
          details: deviceError.details,
          hint: deviceError.hint
        });
      }

      if (!deviceData?.id) {
        logger.error('Device data missing ID', { deviceId });
        throw new DeviceNotFoundError(deviceId);
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
        throw new DatabaseError(error.message, {
          code: error.code,
          details: error.details,
          hint: error.hint
        });
      }

      logger.info('Timeline entry added/updated successfully', { deviceId, entryType });
      if (!data) {
        // This should never happen if there was no error, but handle it just in case
        return {
          entry_type: entryType,
          entry_date: entryDate,
          notes,
          device_id: deviceData.id
        } as TimelineEntry;
      }
      return data as TimelineEntry;
    } catch (error) {
      // Rethrow our custom errors
      if (error instanceof ValidationError || 
          error instanceof DeviceNotFoundError || 
          error instanceof DatabaseError) {
        throw error;
      }
      
      // Handle Supabase errors
      if (error instanceof PostgrestError) {
        logger.error('Supabase error adding timeline entry', {
          code: error.code,
          message: error.message,
          hint: error.hint,
          details: error.details,
        });
        throw new DatabaseError(error.message, {
          code: error.code,
          details: error.details,
          hint: error.hint
        });
      } else if (error instanceof Error) {
        logger.error('Error adding timeline entry', { message: error.message });
        throw new NetworkError(`Failed to add timeline entry: ${error.message}`, error);
      } else {
        logger.error('Unknown error adding timeline entry', { error });
        throw new NetworkError('An unexpected error occurred when adding timeline entry');
      }
    }
  },

  /**
   * Retrieves the timeline entries for a specific device
   *
   * @param deviceId - Unique identifier for the device
   * @returns Promise resolving to an array of timeline entries
   * @throws DatabaseError if a database operation fails
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
        throw new DatabaseError(deviceError.message, {
          code: deviceError.code,
          details: deviceError.details,
          hint: deviceError.hint
        });
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
        throw new DatabaseError(error.message, {
          code: error.code,
          details: error.details,
          hint: error.hint
        });
      }

      logger.info('Timeline entries retrieved successfully', {
        deviceId,
        count: data?.length || 0,
      });
      return (data || []) as TimelineEntry[];
    } catch (error) {
      // Rethrow our custom errors
      if (error instanceof DatabaseError) {
        throw error;
      }
      
      if (error instanceof PostgrestError) {
        logger.error('Supabase error retrieving timeline', {
          code: error.code,
          message: error.message,
        });
        throw new DatabaseError(error.message, {
          code: error.code,
          hint: error.hint
        });
      } else if (error instanceof Error) {
        logger.error('Error retrieving timeline', { message: error.message });
        throw new NetworkError(`Failed to retrieve timeline: ${error.message}`, error);
      } else {
        logger.error('Unknown error retrieving timeline', { error });
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
   * @throws ValidationError if required fields are missing
   * @throws DeviceNotFoundError if device is not found
   * @throws EntryNotFoundError if entry is not found
   * @throws DatabaseError if a database operation fails
   */
  async updateEntry(
    deviceId: string,
    entryId: string,
    updates: Partial<TimelineEntry>
  ): Promise<TimelineEntry> {
    if (!deviceId) {
      logger.warn('Attempted to update entry with empty deviceId');
      throw new ValidationError('deviceId');
    }
    
    if (!entryId) {
      logger.warn('Attempted to update entry with empty entryId');
      throw new ValidationError('entryId');
    }

    try {
      // First get the device record to link to
      const { data: deviceData, error: deviceError } = await supabase
        .from('devices')
        .select('id')
        .eq('device_identifier', deviceId)
        .single();

      if (deviceError) {
        logger.error('Error retrieving device for update', { error: deviceError, deviceId });
        if (deviceError.code === 'PGRST116') {
          throw new DeviceNotFoundError(deviceId);
        }
        throw new DatabaseError(deviceError.message, {
          code: deviceError.code,
          details: deviceError.details,
          hint: deviceError.hint
        });
      }

      if (!deviceData?.id) {
        logger.error('Device not found for update', { deviceId });
        throw new DeviceNotFoundError(deviceId);
      }

      // Then update the entry with the device ID constraint
      const updatePayload = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('timeline_entries')
        .update(updatePayload)
        .eq('id', entryId)
        .eq('device_id', deviceData.id);

      if (error) {
        logger.error('Error updating timeline entry', { error, deviceId, entryId });
        throw new DatabaseError(error.message, {
          code: error.code,
          details: error.details,
          hint: error.hint
        });
      }
      
      // Check if any rows were affected - if not, the entry wasn't found
      if (!data) {
        logger.error('Entry not found for update', { entryId, deviceId });
        throw new EntryNotFoundError(entryId);
      }
      
      const typedData = data as unknown as any[];
      if (Array.isArray(typedData) && typedData.length === 0) {
        logger.error('Entry not found for update', { entryId, deviceId });
        throw new EntryNotFoundError(entryId);
      }
      
      logger.info('Timeline entry updated successfully', { deviceId, entryId });
      // In some versions of Supabase, the data might be an array or single object
      return Array.isArray(typedData) ? typedData[0] as TimelineEntry : data as TimelineEntry;
    } catch (error) {
      // Rethrow our custom errors
      if (error instanceof ValidationError || 
          error instanceof DeviceNotFoundError || 
          error instanceof EntryNotFoundError ||
          error instanceof DatabaseError) {
        throw error;
      }
      
      if (error instanceof PostgrestError) {
        logger.error('Supabase error updating timeline entry', {
          code: error.code,
          message: error.message,
          hint: error.hint,
        });
        throw new DatabaseError(error.message, {
          code: error.code,
          hint: error.hint
        });
      } else if (error instanceof Error) {
        logger.error('Error updating timeline entry', { message: error.message });
        throw new NetworkError(`Failed to update timeline entry: ${error.message}`, error);
      } else {
        logger.error('Unknown error updating timeline entry', { error });
        throw new NetworkError('An unexpected error occurred when updating timeline entry');
      }
    }
  },

  /**
   * Deletes a timeline entry
   * 
   * @param deviceId - Unique identifier for the device
   * @param entryId - ID of the entry to delete
   * @returns Promise that resolves when the entry is deleted
   * @throws ValidationError if required fields are missing
   * @throws DeviceNotFoundError if device is not found
   * @throws EntryNotFoundError if entry is not found
   * @throws DatabaseError if a database operation fails
   */
  async deleteEntry(deviceId: string, entryId: string): Promise<void> {
    if (!deviceId) {
      logger.warn('Attempted to delete entry with empty deviceId');
      throw new ValidationError('deviceId');
    }
    
    if (!entryId) {
      logger.warn('Attempted to delete entry with empty entryId');
      throw new ValidationError('entryId');
    }

    try {
      // First get the device record to link to
      const { data: deviceData, error: deviceError } = await supabase
        .from('devices')
        .select('id')
        .eq('device_identifier', deviceId)
        .single();

      if (deviceError) {
        logger.error('Error retrieving device for deletion', { error: deviceError, deviceId });
        if (deviceError.code === 'PGRST116') {
          throw new DeviceNotFoundError(deviceId);
        }
        throw new DatabaseError(deviceError.message, {
          code: deviceError.code,
          details: deviceError.details,
          hint: deviceError.hint
        });
      }

      if (!deviceData?.id) {
        logger.error('Device not found for deletion', { deviceId });
        throw new DeviceNotFoundError(deviceId);
      }

      // Then delete entries matching both the entry ID and device ID
      const { data, error } = await supabase
        .from('timeline_entries')
        .delete()
        .eq('id', entryId)
        .eq('device_id', deviceData.id);

      if (error) {
        logger.error('Error deleting timeline entry', { error, deviceId, entryId });
        throw new DatabaseError(error.message, {
          code: error.code,
          details: error.details,
          hint: error.hint
        });
      }
      
      // Check if any rows were affected - if not, the entry wasn't found
      if (!data) {
        logger.error('Entry not found for deletion', { entryId, deviceId });
        throw new EntryNotFoundError(entryId);
      }
      
      const typedData = data as unknown as any[];
      if (Array.isArray(typedData) && typedData.length === 0) {
        logger.error('Entry not found for deletion', { entryId, deviceId });
        throw new EntryNotFoundError(entryId);
      }
      
      logger.info('Timeline entry deleted successfully', { deviceId, entryId });
    } catch (error) {
      // Rethrow our custom errors
      if (error instanceof ValidationError || 
          error instanceof DeviceNotFoundError || 
          error instanceof EntryNotFoundError ||
          error instanceof DatabaseError) {
        throw error;
      }
      
      if (error instanceof PostgrestError) {
        logger.error('Supabase error deleting timeline entry', {
          code: error.code,
          message: error.message,
          hint: error.hint,
        });
        throw new DatabaseError(error.message, {
          code: error.code,
          hint: error.hint
        });
      } else if (error instanceof Error) {
        logger.error('Error deleting timeline entry', { message: error.message });
        throw new NetworkError(`Failed to delete timeline entry: ${error.message}`, error);
      } else {
        logger.error('Unknown error deleting timeline entry', { error });
        throw new NetworkError('An unexpected error occurred when deleting timeline entry');
      }
    }
  },
};
