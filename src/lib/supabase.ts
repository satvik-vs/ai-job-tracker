import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// Get Supabase configuration from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate credentials
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration:', {
    url: supabaseUrl ? 'SET' : 'MISSING',
    key: supabaseAnonKey ? 'SET' : 'MISSING'
  });
  throw new Error('Missing Supabase configuration. Please check your environment variables.');
}

// Validate URL format
if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
  console.error('Invalid Supabase URL format:', supabaseUrl);
  throw new Error('Invalid Supabase URL format');
}

// Validate key format
if (!supabaseAnonKey.startsWith('eyJ')) {
  console.error('Invalid Supabase anon key format');
  throw new Error('Invalid Supabase anon key format');
}

console.log('✅ Supabase configuration loaded:', {
  url: supabaseUrl,
  keyLength: supabaseAnonKey.length
});

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    },
    global: {
      headers: {
        'X-Client-Info': 'jobtracker-ai@1.0.0',
      },
    },
    db: {
      schema: 'public',
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

// Auth helpers
export const auth = supabase.auth;

// Storage helpers
export const storage = supabase.storage;

// Database helpers
export const db = supabase;

// Helper function to get current user ID
export const getCurrentUserId = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id;
};

// Test connection
export const testConnection = async () => {
  try {
    console.log('🔍 Testing Supabase connection...');
    
    // Simple health check
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error: any) {
    console.error('❌ Supabase connection error:', error.message);
    return false;
  }
};