-- Isolated private chat data. Never modify the host application's public schema.
create schema if not exists tamil_chat;
revoke all on schema tamil_chat from public;

create table if not exists tamil_chat.sessions (
  id uuid primary key,
  token_hash text unique not null,
  name text not null check (char_length(name) between 2 and 24),
  available boolean not null default false,
  topic text not null default 'ai',
  suspended boolean not null default false,
  last_seen timestamptz not null default now(),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '24 hours'
);
create table if not exists tamil_chat.rooms (
  id uuid primary key,
  host_id uuid not null references tamil_chat.sessions(id) on delete cascade,
  guest_id uuid references tamil_chat.sessions(id) on delete cascade,
  invite_hash text unique,
  source text not null check (source in ('link','directory')),
  status text not null default 'pending' check (status in ('pending','active','ended','declined')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '24 hours',
  check (guest_id is null or guest_id <> host_id)
);
create index if not exists chat_rooms_host on tamil_chat.rooms(host_id,created_at desc);
create index if not exists chat_rooms_guest on tamil_chat.rooms(guest_id,created_at desc);
create table if not exists tamil_chat.messages (
  id bigint generated always as identity primary key,
  room_id uuid not null references tamil_chat.rooms(id) on delete cascade,
  sender_id uuid not null references tamil_chat.sessions(id) on delete cascade,
  client_id uuid not null,
  body text not null check (char_length(body) between 1 and 1200),
  created_at timestamptz not null default now(),
  unique(sender_id,client_id)
);
create index if not exists chat_messages_room on tamil_chat.messages(room_id,id desc);
create table if not exists tamil_chat.blocks (
  blocker_id uuid references tamil_chat.sessions(id) on delete cascade,
  blocked_id uuid references tamil_chat.sessions(id) on delete cascade,
  primary key(blocker_id,blocked_id)
);
create table if not exists tamil_chat.reports (
  id uuid primary key,
  reporter_id uuid,
  reported_id uuid,
  message_id bigint,
  excerpt text not null,
  reason text not null check (char_length(reason) between 3 and 300),
  status text not null default 'open' check (status in ('open','resolved')),
  created_at timestamptz not null default now()
);
create table if not exists tamil_chat.limits (
  key text primary key,
  count integer not null,
  expires_at timestamptz not null
);
create table if not exists tamil_chat.moderators (
  token_hash text primary key,
  expires_at timestamptz not null
);
create table if not exists tamil_chat.maintenance (
  id boolean primary key default true check(id),
  last_cleaned timestamptz not null default '2000-01-01'
);
insert into tamil_chat.maintenance(id) values(true) on conflict do nothing;

-- No browser/Supabase Data API access. All checks run in server route handlers.
alter table tamil_chat.sessions enable row level security;
alter table tamil_chat.rooms enable row level security;
alter table tamil_chat.messages enable row level security;
alter table tamil_chat.blocks enable row level security;
alter table tamil_chat.reports enable row level security;
alter table tamil_chat.limits enable row level security;
alter table tamil_chat.moderators enable row level security;
alter table tamil_chat.maintenance enable row level security;
revoke all on all tables in schema tamil_chat from public, anon, authenticated;
revoke all on all sequences in schema tamil_chat from public, anon, authenticated;

grant usage on schema tamil_chat to tamilaiprompt_chat;
grant select,insert,update,delete on all tables in schema tamil_chat to tamilaiprompt_chat;
grant usage,select on all sequences in schema tamil_chat to tamilaiprompt_chat;
-- The restricted server role can access only these tables through explicit policies.
do $$ declare t text; begin
  foreach t in array array['sessions','rooms','messages','blocks','reports','limits','moderators','maintenance'] loop
    if not exists(select 1 from pg_policies where schemaname='tamil_chat' and tablename=t and policyname='chat_server_only') then
      execute format('create policy chat_server_only on tamil_chat.%I to tamilaiprompt_chat using (true) with check (true)', t);
    end if;
  end loop;
end $$;
