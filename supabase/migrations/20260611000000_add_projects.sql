-- 1. Create Projects Table
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  name text not null,
  description text,
  created_at timestamptz default now() not null
);

-- 2. Add project_id to existing tables
alter table public.tickets add column if not exists project_id uuid references public.projects(id) on delete cascade;
alter table public.sprints add column if not exists project_id uuid references public.projects(id) on delete cascade;

-- 3. Data Migration: Create a "Default Project" for each organization and assign existing data
do $$
declare
    org_record record;
    default_project_id uuid;
begin
    for org_record in select id from public.organizations loop
        -- Check if default project already exists for this org
        select id into default_project_id from public.projects 
        where organization_id = org_record.id and name = 'Default Project' limit 1;

        if default_project_id is null then
            insert into public.projects (organization_id, name, description)
            values (org_record.id, 'Default Project', 'Auto-generated default project')
            returning id into default_project_id;
        end if;

        -- Assign existing tickets to this default project
        update public.tickets 
        set project_id = default_project_id 
        where organization_id = org_record.id and project_id is null;

        -- Assign existing sprints to this default project
        update public.sprints 
        set project_id = default_project_id 
        where organization_id = org_record.id and project_id is null;
    end loop;
end $$;

-- 4. Set project_id to NOT NULL after migration
-- Note: We only do this if we want to force every ticket to have a project
-- alter table public.tickets alter column project_id set not null;
-- alter table public.sprints alter column project_id set not null;

-- 5. RLS Policies for Projects
alter table public.projects enable row level security;

create policy "Users can view projects in their organizations"
  on public.projects for select
  using (
    exists (
      select 1 from public.organization_members
      where organization_members.organization_id = projects.organization_id
      and organization_members.profile_id = auth.uid()
    )
  );

create policy "Admins can manage projects"
  on public.projects for all
  using (
    exists (
      select 1 from public.organization_members
      where organization_members.organization_id = projects.organization_id
      and organization_members.profile_id = auth.uid()
      and organization_members.role in ('admin', 'owner')
    )
  );

-- Update existing policies for tickets and sprints to optionally check project_id if needed, 
-- but organization-based access is still a valid security boundary.
