# Setting Up Authentication with Supabase

This document explains how to configure Supabase for email/password authentication and apply the necessary migrations.

## Prerequisites

Before proceeding, ensure you have:

1. A Supabase project set up
2. Access to the SQL Editor in the Supabase dashboard

## Steps to Apply Migrations

1. Navigate to the Supabase dashboard for your project
2. Go to the SQL Editor
3. Open the `20240918_auth_setup.sql` file
4. Execute the SQL commands to set up the tables and RLS policies

## Understanding the Migration

The migration script (`20240918_auth_setup.sql`) does the following:

1. Creates or updates the `timeline_entries` table to use authenticated users instead of device IDs
2. Sets up Row Level Security (RLS) policies that only allow users to access their own data
3. Creates triggers to automatically set the user ID and update timestamps

## Email/Password Authentication

Supabase's Auth system handles the storage of users, passwords (hashed securely), and session management. You don't need to create or manage these tables yourself.

The main tables that Supabase uses for authentication are:

- `auth.users` - Stores user data
- `auth.sessions` - Stores active sessions
- `auth.refresh_tokens` - Stores refresh tokens

These are automatically created and managed by Supabase.

## Enabling Email Confirmation

To require email confirmation for new sign-ups:

1. Go to Authentication > Settings in the Supabase dashboard
2. Under "Email Auth", enable "Confirm email"
3. Customize the confirmation email template if desired

## Customizing Email Templates

To customize the email templates for password reset and confirmation:

1. Go to Authentication > Email Templates in the Supabase dashboard
2. Customize the templates for "Confirm signup", "Reset password", etc.

## App Configuration

The app has been configured to:

1. Use email/password authentication with Supabase
2. Handle login state through the AuthState context
3. Automatically redirect to the login screen for unauthenticated users
4. Use secure Row Level Security policies for data access

If you need to add additional features like social logins (Google, Apple, etc.), additional configuration will be required in both Supabase and the app code. 