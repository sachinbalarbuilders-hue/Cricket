import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pcipxnniexnhiafkzkjz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjaXB4bm5pZXhuaGlhZmt6a2p6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NTc0NjEsImV4cCI6MjA5NDMzMzQ2MX0.hS_sKohDTHWv9mbXVZdZWavNmVioQcgk4c2XbYecQCE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
