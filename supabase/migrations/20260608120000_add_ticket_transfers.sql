
-- Create Ticket Transfers Table
create table if not exists public.ticket_transfers (
  id uuid primary key default gen_random_uuid(),
  ticket_id bigint references public.tickets(id) on delete cascade not null,
  from_user_id uuid references public.profiles(id) on delete cascade not null,
  to_user_id uuid references public.profiles(id) on delete cascade not null,
  status text default 'pending' not null, -- pending, accepted, declined, expired
  message text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  expires_at timestamptz default (now() + interval '3 days') not null
);

-- Index to prevent multiple pending transfers for the same ticket
create unique index if not exists ticket_transfers_ticket_id_pending_idx 
on public.ticket_transfers (ticket_id) 
where status = 'pending';

-- RLS
alter table public.ticket_transfers enable row level security;

create policy "Users can view transfers they are part of"
on public.ticket_transfers for select
using (
  auth.uid() = from_user_id or auth.uid() = to_user_id
);

create policy "Assignees can initiate transfers"
on public.ticket_transfers for insert
with check (
  auth.uid() = from_user_id and
  exists (
    select 1 from public.tickets 
    where id = ticket_id 
    and assignee_id = auth.uid()
  )
);

create policy "Participants can update transfer status"
on public.ticket_transfers for update
using (
  auth.uid() = from_user_id or auth.uid() = to_user_id
);

-- RPC for accepting transfer
create or replace function public.accept_ticket_transfer(transfer_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  t_ticket_id bigint;
  t_to_user_id uuid;
  t_status text;
begin
  select ticket_id, to_user_id, status into t_ticket_id, t_to_user_id, t_status
  from public.ticket_transfers
  where id = transfer_id;

  if t_status != 'pending' then
    raise exception 'Transfer is no longer pending';
  end if;

  if auth.uid() != t_to_user_id then
    raise exception 'Unauthorized';
  end if;

  -- 1. Update transfer status
  update public.ticket_transfers
  set status = 'accepted', updated_at = now()
  where id = transfer_id;

  -- 2. Update ticket assignee
  update public.tickets
  set assignee_id = t_to_user_id
  where id = t_ticket_id;
end;
$$;

-- RPC for declining transfer
create or replace function public.decline_ticket_transfer(transfer_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.ticket_transfers
  set status = 'declined', updated_at = now()
  where id = transfer_id
  and (to_user_id = auth.uid() or from_user_id = auth.uid())
  and status = 'pending';
end;
$$;
