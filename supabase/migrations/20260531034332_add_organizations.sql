-- 1. Create Organizations Table
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- 2. Create Organization Members Table
create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  role text default 'member' not null,
  created_at timestamptz default now(),
  unique(organization_id, profile_id)
);

-- 3. Add organization_id to existing tables
alter table public.tickets add column organization_id uuid references public.organizations(id) on delete cascade;
alter table public.sprints add column organization_id uuid references public.organizations(id) on delete cascade;

-- 4. Enable RLS
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;

-- 5. RLS Policies for Organizations
create policy "Users can view organizations they belong to"
on public.organizations for select
using (
  exists (
    select 1 from public.organization_members
    where organization_members.organization_id = organizations.id
    and organization_members.profile_id = auth.uid()
  )
);

-- 6. RLS Policies for Organization Members
create policy "Users can view members of their organizations"
on public.organization_members for select
using (
  exists (
    select 1 from public.organization_members as member_check
    where member_check.organization_id = organization_members.organization_id
    and member_check.profile_id = auth.uid()
  )
);

-- 7. Update Ticket RLS (Assuming they already have basic RLS)
-- We need to ensure tickets are filtered by org
create policy "Users can view tickets in their organizations"
on public.tickets for select
using (
  exists (
    select 1 from public.organization_members
    where organization_members.organization_id = tickets.organization_id
    and organization_members.profile_id = auth.uid()
  )
);

create policy "Users can insert tickets in their organizations"
on public.tickets for insert
with check (
  exists (
    select 1 from public.organization_members
    where organization_members.organization_id = organization_id
    and organization_members.profile_id = auth.uid()
  )
);

-- 8. Update Sprint RLS
create policy "Users can view sprints in their organizations"
on public.sprints for select
using (
  exists (
    select 1 from public.organization_members
    where organization_members.organization_id = sprints.organization_id
    and organization_members.profile_id = auth.uid()
  )
);

create policy "Users can insert sprints in their organizations"
on public.sprints for insert
with check (
  exists (
    select 1 from public.organization_members
    where organization_members.organization_id = organization_id
    and organization_members.profile_id = auth.uid()
  )
);
