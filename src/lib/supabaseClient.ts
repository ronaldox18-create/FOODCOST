import { createClient } from '@supabase/supabase-js';

// Credenciais diretas para garantir conexão imediata
const supabaseUrl = 'https://ifmmqlccvwniiwhxbsau.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmbW1xbGNjdnduaWl3aHhic2F1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxOTMwMTQsImV4cCI6MjA3OTc2OTAxNH0.LQ877b6-z9UgZ2l1XJxnalXs_mnf9HFm_dX7WHktJGo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);