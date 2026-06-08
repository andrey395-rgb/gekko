-- Add personal_note column to profiles table
alter table public.profiles add column if not exists personal_note text default '';

-- Ensure RLS is enabled
alter table public.profiles enable row level security;

-- Add RLS policy so users can update their own profile (and personal note)
drop policy if exists "Users can update own profile" on public.profiles;

create policy "Users can update own profile"
on public.profiles for update
using ( auth.uid() = id )
with check ( auth.uid() = id );
