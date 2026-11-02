-- Private, bounded image payloads; no public storage URLs are created.
alter table tamil_chat.messages add column if not exists image_data bytea;
alter table tamil_chat.messages add column if not exists image_type text;
alter table tamil_chat.messages add constraint chat_image_size check (image_data is null or octet_length(image_data)<=524288);
alter table tamil_chat.messages add constraint chat_image_type check ((image_data is null and image_type is null) or (image_data is not null and image_type='image/webp'));

-- Enforce deletion at the database boundary for every way a chat can end,
-- including block, session logout, expiry and moderator suspension.
create or replace function tamil_chat.clear_ended_images() returns trigger
language plpgsql security definer set search_path=pg_catalog as $$
begin
  if new.status in ('ended','declined') then
    update tamil_chat.messages set image_data=null,image_type=null where room_id=new.id and image_data is not null;
  end if;
  return new;
end $$;
revoke all on function tamil_chat.clear_ended_images() from public;
create trigger chat_clear_images_on_end after update of status on tamil_chat.rooms
for each row when (old.status is distinct from new.status) execute function tamil_chat.clear_ended_images();
