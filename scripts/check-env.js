#!/usr/bin/env node
/**
 * This script checks if all required environment variables are defined in the .env file.
 * Run it using: node scripts/check-env.js
 */

const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

console.log('🔍 Checking environment variables...');

// Load the .env file
const envPath = path.resolve(process.cwd(), '.env');
let envVars;

try {
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found at:', envPath);
    console.log('Please create a .env file based on the .env.template file.');
    process.exit(1);
  }

  envVars = dotenv.parse(fs.readFileSync(envPath));
} catch (error) {
  console.error('❌ Error loading .env file:', error.message);
  process.exit(1);
}

// Define required variables
const requiredVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];

// Check if all required variables are defined
const missingVars = requiredVars.filter((varName) => !envVars[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach((varName) => {
    console.error(`   - ${varName}`);
  });
  console.log('\nPlease add these variables to your .env file.');
  process.exit(1);
} else {
  console.log('✅ All required environment variables are defined!');

  // Additional validation
  if (!envVars.SUPABASE_URL.includes('supabase.co')) {
    console.warn('⚠️ Warning: SUPABASE_URL might not be a valid Supabase URL');
  }

  if (envVars.SUPABASE_ANON_KEY.length < 20) {
    console.warn('⚠️ Warning: SUPABASE_ANON_KEY seems too short for a valid key');
  }

  process.exit(0);
}
