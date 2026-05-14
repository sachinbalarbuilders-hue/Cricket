import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pcipxnniexnhiafkzkjz.supabase.co';
const supabaseAnonKey = 'sb_publishable_5Mf3pFjw1D_mgkwErQprJA_YLD2lHO4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
