create extension if not exists pgcrypto;

create table if not exists employees (
  id uuid primary key default gen_random_uuid(),
  code text unique not null check (code in ('richard','anastasia','jeanclaude','kevin','svetlana')),
  display_name text not null,
  role text not null check (role in ('sales','expense_reporter','manager')),
  telegram_user_id text unique,
  telegram_chat_id text,
  created_at timestamptz not null default now()
);

insert into employees (code, display_name, role) values
  ('richard','Richard Call Me Dick Darling','sales'),
  ('anastasia','Anastasia Ferrari','sales'),
  ('jeanclaude','Jean-Claude Berzins','sales'),
  ('kevin','Kevin von Whatever','expense_reporter'),
  ('svetlana','Svetlana de Monte Carlo','manager')
on conflict (code) do update set display_name=excluded.display_name, role=excluded.role;

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null check (reference ~ '^[SE][0-9]+$'),
  type text not null check (type in ('sale','expense')),
  submitter_id uuid not null references employees(id),
  submitter_name text not null,
  origin text not null check (origin in ('website','telegram')),
  notification_chat_id text,
  submitted_at timestamptz not null default now(),
  customer text,
  project text check (project in ('A','B')),
  description text not null,
  amount_cents integer not null check (amount_cents > 0),
  category text check (category in ('Materials','Travel','Other')),
  proposed_split jsonb,
  final_split jsonb,
  proposed_allocation text check (proposed_allocation in ('A','B','Company overhead')),
  final_allocation text check (final_allocation in ('A','B','Company overhead')),
  status text not null check (status in ('pending_approval','awaiting_allocation','allocated')),
  manager_id uuid references employees(id),
  decided_at timestamptz,
  sync_status text not null default 'not_configured' check (sync_status in ('synced','sync_pending','sync_failed','not_configured')),
  sync_error text,
  notification_status text not null default 'not_required' check (notification_status in ('sent','failed','pending','not_required')),
  notification_error text,
  decision_note text
);

alter table employees enable row level security;
alter table transactions enable row level security;
-- No browser policy is created: all app data flows through protected Vercel functions
-- using SUPABASE_SERVICE_ROLE_KEY. Do not add this key to VITE_/NEXT_PUBLIC_ variables.
