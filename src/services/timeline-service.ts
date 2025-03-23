
import { logger } from '../lib/logger';
import { supabase } from '../lib/supabase';
import {
  DatabaseError,
  EntryNotFoundError,
  EntryType,
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
   * @param entryType - Type of timeline entry (aor, p2, ecopr, pr_card)
   * @param entryDate - Date of the entry in ISO format (YYYY-MM-DD)
   * @param notes - Optional notes for the entry
   * @returns Promise resolving to the created/updated entry
   * @throws ValidationError if required fields are missing
   * @throws DatabaseError if a database operation fails
   */
  async addEntry(
    entryType: EntryType,
    entryDate: string,
    notes: string = ''
  ): Promise<TimelineEntry> {
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        logger.error('Attempted to add entry without authentication');
        throw new Error('You must be signed in to add entries');
      }

      // Add the entry
      const { data, error } = await supabase.from('timeline_entries').upsert(
        {
          entry_type: entryType,
          entry_date: entryDate,
          notes,
          updated_at: new Date().toISOString(),
          // user_id will be set automatically by the database trigger
        },
        {
          onConflict: 'user_id,entry_type',
        }
      );

      if (error) {
        logger.error('Error adding timeline entry', { error, entryType });
        throw new DatabaseError(error.message, {
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
      }

      logger.info('Timeline entry added/updated successfully', { entryType });

      return {
        id: (data as unknown as any[])?.[0]?.id || '',
        user_id: session.user.id,
        entry_type: entryType,
        entry_date: entryDate,
        notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as TimelineEntry;
    } catch (error) {
      if (
        error instanceof DatabaseError ||
        error instanceof ValidationError
      ) {
        throw error;
      }

      logger.error('Error submitting entry', { error });
      throw new Error('Failed to submit entry. Please try again.');
    }
  },

  /**
   * Retrieves timeline entries for the authenticated user
   *
   * @returns Promise resolving to an array of timeline entries
   * @throws DatabaseError if a database operation fails
   */
  async getUserTimeline(): Promise<TimelineEntry[]> {
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        logger.warn('Attempted to get timeline without authentication');
        return [];
      }

      // Get timeline entries
      const { data, error } = await supabase
        .from('timeline_entries')
        .select('*')
        .order('entry_date', { ascending: false });

      if (error) {
        logger.error('Error getting timeline entries', { error });
        throw new DatabaseError(error.message, {
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
      }

      return data as TimelineEntry[];
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }

      logger.error('Error getting timeline entries', { error });
      
      // Instead of throwing an error, return an empty array
      return [];
    }
  },

  /**
   * Helper method to get entries for a specific device ID
   * @private
   */
  async getEntriesForDeviceId(deviceId: string): Promise<TimelineEntry[]> {
    const { data, error } = await supabase
      .from('timeline_entries')
      .select('*')
      .eq('device_id', deviceId)
      .order('entry_date', { ascending: false });

    if (error) {
      logger.error('Error retrieving timeline entries', { error, deviceId });
      throw new DatabaseError(error.message, {
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
    }

    logger.info('Timeline entries retrieved successfully', { deviceId, count: data?.length || 0 });
    return data || [];
  },

  /**
   * Updates an existing timeline entry
   *
   * @param entryId - ID of the entry to update
   * @param updates - Partial entry object with fields to update
   * @returns Promise resolving to the updated entry
   * @throws EntryNotFoundError if entry not found
   * @throws DatabaseError if a database operation fails
   */
  async updateEntry(
    entryId: string,
    updates: Partial<TimelineEntry>
  ): Promise<TimelineEntry> {
    if (!entryId) {
      logger.warn('Attempted to update entry with empty entryId');
      throw new ValidationError('entryId');
    }

    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        logger.error('Attempted to update entry without authentication');
        throw new Error('You must be signed in to update entries');
      }

      // Update the entry
      const updatePayload = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('timeline_entries')
        .update(updatePayload)
        .eq('id', entryId);

      if (error) {
        logger.error('Error updating timeline entry', { error, entryId });
        throw new DatabaseError(error.message, {
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
      }

      // Check if any rows were affected
      if (!data) {
        logger.error('Entry not found for update', { entryId });
        throw new EntryNotFoundError(entryId);
      }

      const typedData = data as unknown as any[];
      if (Array.isArray(typedData) && typedData.length === 0) {
        logger.error('Entry not found for update', { entryId });
        throw new EntryNotFoundError(entryId);
      }

      logger.info('Timeline entry updated successfully', { entryId });

      // Get the updated entry
      const { data: updatedEntry, error: fetchError } = await supabase
        .from('timeline_entries')
        .select('*')
        .eq('id', entryId)
        .single();

      if (fetchError) {
        logger.warn('Error fetching updated entry', { error: fetchError });
        return { ...updates, id: entryId } as TimelineEntry;
      }

      return updatedEntry as TimelineEntry;
    } catch (error) {
      if (
        error instanceof DatabaseError ||
        error instanceof EntryNotFoundError ||
        error instanceof ValidationError
      ) {
        throw error;
      }

      logger.error('Error updating entry', { error });
      throw new Error('Failed to update entry. Please try again.');
    }
  },

  /**
   * Deletes a timeline entry
   *
   * @param entryId - ID of the entry to delete
   * @throws EntryNotFoundError if entry not found
   * @throws DatabaseError if a database operation fails
   */
  async deleteEntry(entryId: string): Promise<void> {
    if (!entryId) {
      logger.warn('Attempted to delete entry with empty entryId');
      throw new ValidationError('entryId');
    }

    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        logger.error('Attempted to delete entry without authentication');
        throw new Error('You must be signed in to delete entries');
      }

      // Delete the entry
      const { data, error } = await supabase
        .from('timeline_entries')
        .delete()
        .eq('id', entryId);

      if (error) {
        logger.error('Error deleting timeline entry', { error, entryId });
        throw new DatabaseError(error.message, {
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
      }

      // Check if any rows were affected
      if (!data) {
        logger.error('Entry not found for deletion', { entryId });
        throw new EntryNotFoundError(entryId);
      }

      const typedData = data as unknown as any[];
      if (Array.isArray(typedData) && typedData.length === 0) {
        logger.error('Entry not found for deletion', { entryId });
        throw new EntryNotFoundError(entryId);
      }

      logger.info('Timeline entry deleted successfully', { entryId });
    } catch (error) {
      if (
        error instanceof DatabaseError ||
        error instanceof EntryNotFoundError ||
        error instanceof ValidationError
      ) {
        throw error;
      }

      logger.error('Error deleting entry', { error });
      throw new Error('Failed to delete entry. Please try again.');
    }
  },
};
