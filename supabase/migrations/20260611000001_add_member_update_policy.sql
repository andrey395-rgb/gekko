-- 1. Create UPDATE Policy for organization_members
-- This allows owners and admins to change the role of other members in their organization.

create policy "Owners/Admins can update members"
on public.organization_members for update
using (
  exists (
    select 1 from public.organization_members as my_membership
    where my_membership.organization_id = organization_members.organization_id
    and my_membership.profile_id = auth.uid()
    and my_membership.role in ('owner', 'admin')
  )
)
with check (
  exists (
    select 1 from public.organization_members as my_membership
    where my_membership.organization_id = organization_members.organization_id
    and my_membership.profile_id = auth.uid()
    and my_membership.role in ('owner', 'admin')
  )
);

-- 2. Allow Owners/Admins to delete members (Remove from Workspace)
create policy "Owners/Admins can remove members"
on public.organization_members for delete
using (
  exists (
    select 1 from public.organization_members as my_membership
    where my_membership.organization_id = organization_members.organization_id
    and my_membership.profile_id = auth.uid()
    and my_membership.role in ('owner', 'admin')
  )
);
