import { chatDb, ChatError, validId } from './chat-server';

export function screenSequence(value: unknown) {
  const sequence = typeof value === 'string' ? Number(value) : value;
  if (
    typeof sequence !== 'number' ||
    !Number.isInteger(sequence) ||
    sequence < 1 ||
    sequence > 1000000000
  )
    throw new ChatError('Invalid presence update.');
  return sequence;
}
export async function updatePresence(
  roomId: string,
  sessionId: string,
  screen: string,
  sequence: number,
  present: boolean,
  readId?: string | null,
) {
  validId(screen);
  const readIds = readId ? readId.split(',') : [];
  if (readIds.length > 100 || readIds.some((id) => !/^\d{1,19}$/.test(id)))
    throw new ChatError('Invalid read receipt.');
  const sql = chatDb();
  if (!present) {
    await sql`update tamil_chat.room_presence set present=false,last_seen=now(),sequence=${sequence} where room_id=${roomId} and session_id=${sessionId} and screen_id=${screen} and sequence<${sequence}`;
    return;
  }
  await sql.begin(async (tx) => {
    // Bound per-browser tab records. Stale rows can be replaced on a new visit.
    const [room] =
      await tx`select id from tamil_chat.rooms where id=${roomId} and status='active' and expires_at>now() for update`;
    if (!room) return;
    if (readIds.length) {
      const newlySeen =
        await tx`insert into tamil_chat.limits(key,count,expires_at)
          select 'seen:'||m.room_id::text||':'||m.id::text,1,r.expires_at
          from tamil_chat.messages m join tamil_chat.rooms r on r.id=m.room_id
          where m.room_id=${roomId} and m.sender_id<>${sessionId} and m.removed_at is null and m.id::text in ${tx(readIds)}
          on conflict(key) do nothing returning key`;
      const seen = newlySeen.reduce<{ id: string } | null>(
        (latest, row) =>
          !latest || BigInt(row.key.split(':').at(-1)!) > BigInt(latest.id)
            ? { id: row.key.split(':').at(-1)! }
            : latest,
        null,
      );
      if (seen?.id)
        await tx`update tamil_chat.rooms set
        host_read_at=case when host_id=${sessionId} and host_read_id<${seen.id}::bigint then now() else host_read_at end,
        guest_read_at=case when guest_id=${sessionId} and guest_read_id<${seen.id}::bigint then now() else guest_read_at end,
        host_read_id=case when host_id=${sessionId} then greatest(host_read_id,${seen.id}::bigint) else host_read_id end,
        guest_read_id=case when guest_id=${sessionId} then greatest(guest_read_id,${seen.id}::bigint) else guest_read_id end
        where id=${roomId}`;
    }
    await tx`delete from tamil_chat.room_presence where room_id=${roomId} and session_id=${sessionId} and last_seen<now()-interval '1 hour'`;
    await tx`insert into tamil_chat.room_presence(room_id,session_id,screen_id,sequence,present,last_seen)
      select ${roomId},${sessionId},${screen},${sequence},true,now()
      where (select count(*) from tamil_chat.room_presence where room_id=${roomId} and session_id=${sessionId})<64
        or exists(select 1 from tamil_chat.room_presence where room_id=${roomId} and session_id=${sessionId} and screen_id=${screen})
      on conflict(room_id,session_id,screen_id) do update set present=true,last_seen=now(),sequence=excluded.sequence
      where tamil_chat.room_presence.sequence<excluded.sequence`;
  });
}
