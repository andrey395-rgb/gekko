-- 1. Fix organization_members RLS
drop policy if exists "Users can insert their own membership" on public.organization_members;
drop policy if exists "Owners/Admins can add members" on public.organization_members;
drop policy if exists "Owners/Admins can update members" on public.organization_members;

create policy "Users can insert their own membership"
on public.organization_members for insert
with check (auth.uid() = profile_id);

create policy "Owners/Admins can add members"
on public.organization_members for insert
with check (
  exists (
    select 1 from public.organization_members as member_check
    where member_check.organization_id = organization_members.organization_id
    and member_check.profile_id = auth.uid()
  )
);

-- 2. Fix Organizations RLS (Allow viewing if invited)
drop policy if exists "Users can view organizations they belong to" on public.organizations;

create policy "Users can view organizations they belong to or are invited to"
on public.organizations for select
using (
  exists (
    select 1 from public.organization_members
    where organization_members.organization_id = organizations.id
    and organization_members.profile_id = auth.uid()
  )
  or
  exists (
    select 1 from public.invites
    where invites.organization_id = organizations.id
    and invites.email = (select email from auth.users where id = auth.uid())
    and invites.status = 'pending'
  )
);

-- 3. Fix Invites RLS
drop policy if exists "Members can create invites" on public.invites;
drop policy if exists "Members can view invites for their orgs" on public.invites;
drop policy if exists "Users can view invites sent to them" on public.invites;
drop policy if exists "Users can update their own invite status" on public.invites;

create policy "Members can create invites"
on public.invites for insert
with check (
  exists (
    select 1 from public.organization_members
    where organization_members.organization_id = organization_id
    and organization_members.profile_id = auth.uid()
  )
);

create policy "Members can view invites for their orgs"
on public.invites for select
using (
  exists (
    select 1 from public.organization_members
    where organization_members.organization_id = invites.organization_id
    and organization_members.profile_id = auth.uid()
  )
);

create policy "Users can view invites sent to them"
on public.invites for select
using (
  lower(email) = lower((select email from auth.users where id = auth.uid()))
);

create policy "Users can update their own invite status"
on public.invites for update
using (
  lower(email) = lower((select email from auth.users where id = auth.uid()))
)
with check (
  lower(email) = lower((select email from auth.users where id = auth.uid()))
);
