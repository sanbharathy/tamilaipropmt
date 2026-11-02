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
) {
  validId(screen);
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
    await tx`delete from tamil_chat.room_presence where room_id=${roomId} and session_id=${sessionId} and last_seen<now()-interval '1 hour'`;
    await tx`insert into tamil_chat.room_presence(room_id,session_id,screen_id,sequence,present,last_seen)
      select ${roomId},${sessionId},${screen},${sequence},true,now()
      where (select count(*) from tamil_chat.room_presence where room_id=${roomId} and session_id=${sessionId})<64
        or exists(select 1 from tamil_chat.room_presence where room_id=${roomId} and session_id=${sessionId} and screen_id=${screen})
      on conflict(room_id,session_id,screen_id) do update set present=true,last_seen=now(),sequence=excluded.sequence
      where tamil_chat.room_presence.sequence<excluded.sequence`;
  });
}
