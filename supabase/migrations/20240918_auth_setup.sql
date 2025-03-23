-- Migration to configure authentication with Supabase
-- This migration creates necessary RLS policies and ensures the timeline_entries table
-- uses authenticated users instead of device IDs

-- First, ensure we have a timeline_entries table that uses user_id from auth
CREATE TABLE IF NOT EXISTS timeline_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  entry_type TEXT NOT NULL,
  entry_date TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT timeline_entries_user_id_entry_type_key UNIQUE (user_id, entry_type)
);

-- Comments for timeline_entries table and columns
COMMENT ON TABLE timeline_entries IS 'User timeline entries for PR journey milestones';
COMMENT ON COLUMN timeline_entries.id IS 'Unique identifier for the entry';
COMMENT ON COLUMN timeline_entries.user_id IS 'User ID from auth.users';
COMMENT ON COLUMN timeline_entries.entry_type IS 'Type of milestone entry';
COMMENT ON COLUMN timeline_entries.entry_date IS 'Date when the milestone occurred';
COMMENT ON COLUMN timeline_entries.notes IS 'Optional notes for the entry';

-- Enable Row Level Security
ALTER TABLE timeline_entries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for timeline_entries
DROP POLICY IF EXISTS "Users can view their own entries" ON timeline_entries;
CREATE POLICY "Users can view their own entries" 
ON timeline_entries FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own entries" ON timeline_entries;
CREATE POLICY "Users can insert their own entries" 
ON timeline_entries FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own entries" ON timeline_entries;
CREATE POLICY "Users can update their own entries" 
ON timeline_entries FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own entries" ON timeline_entries;
CREATE POLICY "Users can delete their own entries" 
ON timeline_entries FOR DELETE 
USING (auth.uid() = user_id);

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

-- Create or replace function to update the 'updated_at' field
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for updating the 'updated_at' column
DROP TRIGGER IF EXISTS update_timeline_entries_modified ON timeline_entries;
CREATE TRIGGER update_timeline_entries_modified
BEFORE UPDATE ON timeline_entries
FOR EACH ROW
EXECUTE FUNCTION update_modified_column(); 