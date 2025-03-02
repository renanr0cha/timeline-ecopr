-- Enable Row Level Security on the devices table (if not already enabled)
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert their device (this is necessary for first-time registration)
CREATE POLICY "Allow anonymous device registration" 
ON public.devices
FOR INSERT 
TO anon
WITH CHECK (true);

-- Allow authenticated users to insert/update their device
CREATE POLICY "Allow authenticated device registration" 
ON public.devices
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Allow devices to update their own records
CREATE POLICY "Devices can update their own records" 
ON public.devices
FOR UPDATE
USING (auth.uid() IS NOT NULL OR current_setting('app.device_id', true)::text = device_identifier)
WITH CHECK (auth.uid() IS NOT NULL OR current_setting('app.device_id', true)::text = device_identifier);

-- Allow devices to select their own record
CREATE POLICY "Devices can select their own record" 
ON public.devices
FOR SELECT
USING (auth.uid() IS NOT NULL OR current_setting('app.device_id', true)::text = device_identifier);

-- Create or replace the function to set the device context
CREATE OR REPLACE FUNCTION public.set_device_context(device_id text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  PERFORM set_config('app.device_id', device_id, false);
END;
$function$;
