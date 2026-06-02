-- Add personal_note column to profiles table
alter table public.profiles add column if not exists personal_note text default '';
