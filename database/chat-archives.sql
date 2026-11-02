-- Forward-only: old rooms keep their original retention policy.
alter table tamil_chat.sessions add column if not exists archive_notice boolean not null default false;
alter table tamil_chat.rooms add column if not exists archive_enabled boolean not null default false;
alter table tamil_chat.rooms add column if not exists end_reason text;
alter table tamil_chat.messages add column if not exists removed_at timestamptz;

create table if not exists tamil_chat.archives (
  room_id uuid primary key,
  ended_at timestamptz not null,
  expires_at timestamptz not null,
  snapshot jsonb,
  pdf_data bytea,
  pdf_sha256 text,
  ready_at timestamptz,
  check (expires_at = ended_at + interval '30 days'),
  check ((snapshot is not null and pdf_data is null) or (snapshot is null and pdf_data is not null))
);
create index if not exists chat_archive_expiry on tamil_chat.archives(expires_at);
create table if not exists tamil_chat.room_events (
  id bigint generated always as identity primary key,
  room_id uuid not null references tamil_chat.rooms(id) on delete cascade,
  event text not null,
  created_at timestamptz not null default now()
);
create table if not exists tamil_chat.archive_access (
  id bigint generated always as identity primary key,
  room_id uuid not null references tamil_chat.archives(room_id) on delete cascade,
  accessed_at timestamptz not null default now()
);
alter table tamil_chat.archives enable row level security;
alter table tamil_chat.room_events enable row level security;
alter table tamil_chat.archive_access enable row level security;
revoke all on tamil_chat.archives,tamil_chat.room_events,tamil_chat.archive_access from public,anon,authenticated;
grant select,insert,update,delete on tamil_chat.archives,tamil_chat.room_events,tamil_chat.archive_access to tamilaiprompt_chat;
grant usage,select on sequence tamil_chat.room_events_id_seq,tamil_chat.archive_access_id_seq to tamilaiprompt_chat;
create policy archive_server_only on tamil_chat.archives to tamilaiprompt_chat using(true) with check(true);
create policy events_server_only on tamil_chat.room_events to tamilaiprompt_chat using(true) with check(true);
create policy access_server_only on tamil_chat.archive_access to tamilaiprompt_chat using(true) with check(true);

create or replace function tamil_chat.capture_archive(p_room uuid,p_end timestamptz,p_reason text) returns void
language plpgsql security definer set search_path=pg_catalog as $$
begin
  insert into tamil_chat.archives(room_id,ended_at,expires_at,snapshot)
  select r.id,p_end,p_end+interval '30 days',jsonb_build_object(
    'roomId',r.id,'startedAt',r.created_at,'endedAt',p_end,'reason',p_reason,
    'host',jsonb_build_object('id',r.host_id,'name',coalesce(h.name,'Guest')),
    'guest',case when r.guest_id is null then null else jsonb_build_object('id',r.guest_id,'name',coalesce(g.name,'Guest')) end,
    'events',coalesce((select jsonb_agg(jsonb_build_object('event',e.event,'at',e.created_at) order by e.id) from tamil_chat.room_events e where e.room_id=r.id),'[]'::jsonb),
    'messages',coalesce((select jsonb_agg(jsonb_build_object('id',m.id::text,'senderId',m.sender_id,'body',m.body,'at',m.created_at,'removedAt',m.removed_at,'image',case when m.image_data is null then null else encode(m.image_data,'base64') end) order by m.id) from tamil_chat.messages m where m.room_id=r.id),'[]'::jsonb))
  from tamil_chat.rooms r left join tamil_chat.sessions h on h.id=r.host_id left join tamil_chat.sessions g on g.id=r.guest_id
  where r.id=p_room and r.archive_enabled
  on conflict(room_id) do nothing;
end $$;
revoke all on function tamil_chat.capture_archive(uuid,timestamptz,text) from public,anon,authenticated,tamilaiprompt_chat;

create or replace function tamil_chat.archive_room_event() returns trigger
language plpgsql security definer set search_path=pg_catalog as $$
declare finish timestamptz;
begin
  if tg_op='DELETE' then
    if old.archive_enabled then
      perform tamil_chat.capture_archive(old.id,least(now(),old.expires_at),coalesce(old.end_reason,'room_removed'));
    end if;
    return old;
  end if;
  if new.archive_enabled then
    if tg_op='INSERT' then
      insert into tamil_chat.room_events(room_id,event) values(new.id,'invitation_created');
    elsif old.status is distinct from new.status then
      insert into tamil_chat.room_events(room_id,event) values(new.id,new.status);
      if new.status in ('ended','declined') then
        finish:=least(now(),new.expires_at);
        perform tamil_chat.capture_archive(new.id,finish,coalesce(new.end_reason,new.status));
      end if;
    end if;
  end if;
  return new;
end $$;
revoke all on function tamil_chat.archive_room_event() from public;
-- Alphabetical order makes capture run before the existing image-clearing trigger.
create trigger chat_archive_on_end after insert or update of status on tamil_chat.rooms for each row execute function tamil_chat.archive_room_event();
create trigger chat_archive_before_delete before delete on tamil_chat.rooms for each row execute function tamil_chat.archive_room_event();

create or replace function tamil_chat.archive_message_limit() returns trigger
language plpgsql security definer set search_path=pg_catalog as $$
begin
  if exists(select 1 from tamil_chat.rooms where id=new.room_id and archive_enabled) and
    (select count(*) from tamil_chat.messages where room_id=new.room_id)>=1000 then
    raise exception using errcode='P0001',message='Chat message limit reached';
  end if;
  return new;
end $$;
revoke all on function tamil_chat.archive_message_limit() from public;
create trigger chat_archive_message_limit before insert on tamil_chat.messages for each row execute function tamil_chat.archive_message_limit();

create or replace function tamil_chat.archive_retention() returns void
language plpgsql security definer set search_path=pg_catalog as $$
begin
  update tamil_chat.rooms r set status='ended',invite_hash=null,end_reason='expired'
    where r.status in ('pending','active') and (r.expires_at<=now() or exists(select 1 from tamil_chat.sessions s where (s.id=r.host_id or s.id=r.guest_id) and (s.expires_at<=now() or s.suspended)));
  delete from tamil_chat.rooms where expires_at<=now();
  delete from tamil_chat.sessions where expires_at<now()-interval '7 days';
  delete from tamil_chat.reports where created_at<now()-interval '7 days';
  delete from tamil_chat.limits where expires_at<now();
  delete from tamil_chat.moderators where expires_at<now();
  delete from tamil_chat.archives where expires_at<=now();
end $$;
revoke all on function tamil_chat.archive_retention() from public,anon,authenticated;
grant execute on function tamil_chat.archive_retention() to tamilaiprompt_chat;

create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule('tamilaiprompt-chat-retention','* * * * *','select tamil_chat.archive_retention()');
