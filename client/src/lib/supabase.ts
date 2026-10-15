import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zvvzysbtvojmhskyeiaf.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_R55fxV0yzvK-bDn1wtmMEQ_gMmD8BfX';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
