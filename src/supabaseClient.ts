import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uurnilkidmwbuowalznk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1cm5pbGtpZG13YnVvd2Fsem5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NDAyODUsImV4cCI6MjA2MjIxNjI4NX0.ZbzoZ2MUEBfjY7iG7gMPTyJ__lJiBjr16uVKpsXxxYw';

console.log('supabaseUrl:', supabaseUrl);
console.log('supabaseAnonKey:', supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);