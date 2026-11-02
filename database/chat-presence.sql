create table if not exists tamil_chat.room_presence (
  room_id uuid not null references tamil_chat.rooms(id) on delete cascade,
  session_id uuid not null references tamil_chat.sessions(id) on delete cascade,
  screen_id uuid not null,
  sequence integer not null check(sequence between 1 and 1000000000),
  present boolean not null,
  last_seen timestamptz not null default now(),
  primary key(room_id,session_id,screen_id)
);
alter table tamil_chat.room_presence enable row level security;
revoke all on tamil_chat.room_presence from public,anon,authenticated;
grant select,insert,update,delete on tamil_chat.room_presence to tamilaiprompt_chat;
create policy presence_server_only on tamil_chat.room_presence to tamilaiprompt_chat using(true) with check(true);
