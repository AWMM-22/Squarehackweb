
import { createClient } from '@supabase/supabase-js';

// Your Supabase project credentials
const supabaseUrl = 'https://fdoedyixsbdpkvzgvtis.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkb2VkeWl4c2JkcGt2emd2dGlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4MTAxOTksImV4cCI6MjA4MjM4NjE5OX0.7pyQwGab4ojZqY-zjBu-TP5svk6Be72fF1ADxgvfesA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
