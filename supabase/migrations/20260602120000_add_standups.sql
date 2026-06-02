-- Create standups table
create table public.standups (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  date date default current_date not null,
  yesterday text,
  today text,
  blockers text,
  created_at timestamptz default now(),
  unique(organization_id, profile_id, date)
);

-- Enable RLS
alter table public.standups enable row level security;

-- RLS Policies
create policy "Users can view standups in their organization"
on public.standups for select
using (
  exists (
    select 1 from public.organization_members
    where organization_members.organization_id = standups.organization_id
    and organization_members.profile_id = auth.uid()
  )
);

create policy "Users can create their own standups"
on public.standups for insert
with check (
  auth.uid() = profile_id and
  exists (
    select 1 from public.organization_members
    where organization_members.organization_id = standups.organization_id
    and organization_members.profile_id = auth.uid()
  )
);

create policy "Users can update their own standups"
on public.standups for update
using (auth.uid() = profile_id)
with check (auth.uid() = profile_id);
