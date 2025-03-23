-- Migration script to remove device_id logic and update tables to use auth.uid() instead

-- First backup existing data (optional but recommended)
CREATE TABLE IF NOT EXISTS backup_timeline_entries AS SELECT * FROM timeline_entries;
CREATE TABLE IF NOT EXISTS backup_devices AS SELECT * FROM devices;

-- Drop timeline_entries constraints first to avoid dependency issues
ALTER TABLE timeline_entries DROP CONSTRAINT IF EXISTS timeline_entries_device_id_fkey;
ALTER TABLE timeline_entries DROP CONSTRAINT IF EXISTS timeline_entries_device_id_entry_type_key;

-- Alter timeline_entries table to use auth.uid() instead of device_id
ALTER TABLE timeline_entries DROP COLUMN IF EXISTS device_id;
ALTER TABLE timeline_entries ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Drop device context function since we won't need it anymore
DROP FUNCTION IF EXISTS public.set_device_context(device_id text);

-- Update RLS policies for timeline_entries
DROP POLICY IF EXISTS "Users can view their own entries" ON timeline_entries;
DROP POLICY IF EXISTS "Users can insert their own entries" ON timeline_entries;
DROP POLICY IF EXISTS "Users can update their own entries" ON timeline_entries;
DROP POLICY IF EXISTS "Users can delete their own entries" ON timeline_entries;

-- Create new RLS policies for timeline_entries using auth.uid()
CREATE POLICY "Users can view their own entries" 
ON timeline_entries FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own entries" 
ON timeline_entries FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own entries" 
ON timeline_entries FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own entries" 
ON timeline_entries FOR DELETE 
USING (auth.uid() = user_id);

-- Drop devices table as it's no longer needed
DROP TABLE IF EXISTS devices;

-- Remove device-related RLS policies
DROP POLICY IF EXISTS "Allow anonymous device registration" ON devices;
DROP POLICY IF EXISTS "Allow authenticated device registration" ON devices;
DROP POLICY IF EXISTS "Devices can update their own records" ON devices;
DROP POLICY IF EXISTS "Devices can select their own record" ON devices;

-- Create a trigger function to automatically set user_id when a row is inserted
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger to timeline_entries table
DROP TRIGGER IF EXISTS set_user_id_trigger ON timeline_entries;
CREATE TRIGGER set_user_id_trigger
BEFORE INSERT ON timeline_entries
FOR EACH ROW
EXECUTE FUNCTION set_user_id();

-- Remove unique constraint on entry_type since we want to allow same entry_type for different users
DROP INDEX IF EXISTS timeline_entries_device_id_entry_type_idx;

-- Add a new unique constraint on user_id and entry_type
ALTER TABLE timeline_entries ADD CONSTRAINT timeline_entries_user_id_entry_type_key UNIQUE (user_id, entry_type);

-- Enable Row Level Security on timeline_entries
ALTER TABLE timeline_entries ENABLE ROW LEVEL SECURITY; 