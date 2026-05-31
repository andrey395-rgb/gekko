-- Add invite_code to organizations for link invites
alter table public.organizations add column if not exists invite_code text unique default substring(gen_random_uuid()::text, 1, 8);

-- Create Invites Table
create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  inviter_id uuid references public.profiles(id) on delete cascade not null,
  email text not null,
  role text default 'member' not null,
  created_at timestamptz default now(),
  status text default 'pending' not null, -- pending, accepted, declined
  unique(organization_id, email)
);

-- RLS for Invites
alter table public.invites enable row level security;

create policy "Users can view invites for their orgs"
on public.invites for select
using (
  exists (
    select 1 from public.organization_members
    where organization_members.organization_id = invites.organization_id
    and organization_members.profile_id = auth.uid()
  )
);

create policy "Admins/Owners can create invites"
on public.invites for insert
with check (
  exists (
    select 1 from public.organization_members
    where organization_members.organization_id = organization_id
    and organization_members.profile_id = auth.uid()
    and organization_members.role in ('owner', 'admin')
  )
);

-- Function to join organization via invite code
create or replace function public.join_organization_by_invite_code(target_invite_code text)
returns uuid
language plpgsql
security definer
as $$
declare
  target_org_id uuid;
begin
  -- 1. Find the organization
  select id into target_org_id from public.organizations where invite_code = target_invite_code;
  
  if target_org_id is null then
    raise exception 'Invalid invite code';
  end if;

  -- 2. Add user to organization
  insert into public.organization_members (organization_id, profile_id, role)
  values (target_org_id, auth.uid(), 'member')
  on conflict (organization_id, profile_id) do nothing;

  return target_org_id;
end;
$$;
