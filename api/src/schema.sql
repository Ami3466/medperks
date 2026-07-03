create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists app_states (
  device_id text primary key,
  sync_secret text,
  role text,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists doses (
  id text primary key,
  device_id text not null references app_states(device_id) on delete cascade,
  date text not null,
  time text not null,
  status text not null,
  verdict jsonb,
  video_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists doses_device_time on doses(device_id, date desc, time desc);

create table if not exists stripe_events (
  id text primary key,
  type text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);
