-- Add sprint_id to tickets table
alter table public.tickets 
add column if not exists sprint_id bigint references public.sprints(id) on delete set null;

-- Add index for performance
create index if not exists tickets_sprint_id_idx on public.tickets(sprint_id);
