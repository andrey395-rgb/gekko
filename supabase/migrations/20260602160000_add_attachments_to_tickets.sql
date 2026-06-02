-- Add attachment_urls column to tickets table
alter table public.tickets add column if not exists attachment_urls text[] default '{}';

-- Instructions for Storage Bucket (Run this in Supabase SQL Editor if needed, or create via Dashboard)
-- 1. Create a bucket named 'attachments'
-- 2. Enable public access or set up RLS for the bucket

-- RLS for Storage (Optional but recommended)
-- Allow authenticated users to upload to the attachments bucket
-- insert into storage.buckets (id, name, public) values ('attachments', 'attachments', true) on conflict (id) do nothing;
