import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://zlyibbmhqmxqtyrbcbrt.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_WAYUhz3h3lYJxteMjZExbg_1mZ1_Cms';
export const SUPABASE_PROJECT_REF = 'zlyibbmhqmxqtyrbcbrt';

// Cliente oficial Supabase JS com suporte a realtime e queries
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
