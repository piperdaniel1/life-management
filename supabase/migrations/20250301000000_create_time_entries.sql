-- Time tracking tables

create table public.time_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  hours numeric(5,2) not null check (hours > 0),
  description text not null,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, date)
);

-- RLS
alter table public.time_entries enable row level security;

create policy "Users can CRUD own time entries" on public.time_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Indexes
create index idx_time_entries_user_date on public.time_entries(user_id, date);

-- Auto-update trigger (reuse existing function from todos migration)
create trigger set_updated_at
  before update on public.time_entries
  for each row
  execute function public.handle_updated_at();

-- Download tracking table

create table public.time_tracking_downloads (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  billing_month text not null, -- 'YYYY-MM' format
  downloaded_at timestamptz default now(),
  unique(user_id, billing_month)
);

alter table public.time_tracking_downloads enable row level security;

create policy "Users can CRUD own downloads" on public.time_tracking_downloads
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
