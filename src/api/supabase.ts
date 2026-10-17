import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 
  import.meta.env.VITE_SUPABASE_URL || 'https://hqgburjxfuyvyeotmqae.supabase.co';

export const SUPABASE_ANON_KEY = 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxZ2J1cmp4ZnV5dnllb3RtcWFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNTk0MjIsImV4cCI6MjA5NzYzNTQyMn0.cfZ6WnD4OhfnDLu1ymRxM_X280GgZiq6XjLYiEkixUY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
