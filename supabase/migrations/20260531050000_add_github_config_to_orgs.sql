-- Add GitHub configuration columns to organizations table
alter table public.organizations 
add column github_owner text,
add column github_repo text;
