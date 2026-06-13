-- Add preferences column to profiles table
alter table public.profiles add column if not exists preferences jsonb default '{}'::jsonb;
