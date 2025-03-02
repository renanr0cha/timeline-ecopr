# Supabase Database Migrations

This directory contains SQL migrations for the Supabase database.

## How to Apply Migrations

To apply these migrations to your Supabase project:

1. Navigate to the Supabase dashboard for your project
2. Go to the SQL Editor
3. Open the SQL file you want to run
4. Execute the SQL commands

## RLS Policies for Devices Table

If you're experiencing a "new row violates row-level security policy for table devices" error, you need to apply the `20240904_fix_devices_rls.sql` migration.

This error occurs because Row Level Security (RLS) is enabled on the `devices` table, but appropriate policies haven't been set up to allow device registration.

### The Fix Explained

The SQL migration creates several policies:

1. **Allow anonymous device registration** - Allows first-time users to register their device
2. **Allow authenticated device registration** - Allows logged-in users to register their device
3. **Devices can update their own records** - Allows devices to update their information using context
4. **Devices can select their own record** - Allows devices to retrieve their own information

It also recreates the `set_device_context` function that's used to establish device identity.

## Temporary App Workaround

If you can't apply these migrations immediately, the app includes a workaround in the `device-id.ts` file that:

1. Uses `returning: 'minimal'` to avoid the SELECT after INSERT operation
2. Continues operation even if a device can't be registered in the database

This ensures the app remains functional even with RLS issues, but applying the proper policies is strongly recommended. 