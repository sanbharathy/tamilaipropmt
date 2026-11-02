alter table tamil_chat.rooms add column if not exists host_read_id bigint not null default 0;
alter table tamil_chat.rooms add column if not exists guest_read_id bigint not null default 0;
alter table tamil_chat.rooms add column if not exists host_read_at timestamptz;
alter table tamil_chat.rooms add column if not exists guest_read_at timestamptz;
