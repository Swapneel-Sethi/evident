import { createClient } from '@supabase/supabase-js';

// Retrieve Supabase configuration from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Initialize singleton. Use placeholder URL during build so `next build`
// does not crash when env vars are missing. Runtime calls fail with clear message.
const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key"
);

export default supabase;
