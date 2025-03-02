import { supabase } from '../lib/supabase';

type EntryType = 'aor' | 'p2' | 'ecopr' | 'pr_card';

interface TimelineEntry {
  id?: string;
  entry_type: EntryType;
  entry_date: string;
  notes?: string;
}

export const timelineService = {
  /**
   * Adds a new timeline entry or updates an existing one
   */
  async addEntry(
    deviceId: string,
    entryType: EntryType,
    entryDate: string,
    notes: string = ''
  ): Promise<any> {
    try {
      // First get the device record to link to
      const { data: deviceData, error: deviceError } = await supabase
        .from('devices')
        .select('id')
        .eq('device_identifier', deviceId)
        .single();

      if (deviceError) throw deviceError;
      if (!deviceData?.id) {
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

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding timeline entry:', error);
      throw error;
    }
  },

  /**
   * Retrieves the timeline entries for a specific device
   */
  async getUserTimeline(deviceId: string): Promise<TimelineEntry[]> {
    try {
      const { data: deviceData, error: deviceError } = await supabase
        .from('devices')
        .select('id')
        .eq('device_identifier', deviceId)
        .single();

      if (deviceError || !deviceData?.id) {
        return [];
      }

      const { data, error } = await supabase
        .from('timeline_entries')
        .select('*')
        .eq('device_id', deviceData.id)
        .order('entry_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting user timeline:', error);
      return [];
    }
  },

  /**
   * Updates a timeline entry
   */
  async updateEntry(
    deviceId: string,
    entryId: string,
    updates: Partial<TimelineEntry>
  ): Promise<any> {
    try {
      const { data: deviceData, error: deviceError } = await supabase
        .from('devices')
        .select('id')
        .eq('device_identifier', deviceId)
        .single();

      if (deviceError) throw deviceError;

      const { data, error } = await supabase
        .from('timeline_entries')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', entryId)
        .eq('device_id', deviceData.id);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating timeline entry:', error);
      throw error;
    }
  },

  /**
   * Deletes a timeline entry
   */
  async deleteEntry(deviceId: string, entryId: string): Promise<void> {
    try {
      const { data: deviceData, error: deviceError } = await supabase
        .from('devices')
        .select('id')
        .eq('device_identifier', deviceId)
        .single();

      if (deviceError) throw deviceError;

      const { error } = await supabase
        .from('timeline_entries')
        .delete()
        .eq('id', entryId)
        .eq('device_id', deviceData.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting timeline entry:', error);
      throw error;
    }
  },
};
