import { createHash, createHmac, randomBytes } from 'node:crypto';
import postgres from 'postgres';
import { NextResponse } from 'next/server';

let pool: ReturnType<typeof postgres> | undefined;
export function chatDb() {
  if (!process.env.CHAT_DATABASE_URL)
    throw new ChatError(
      'Chat is not available yet. Please try again later.',
      503,
    );
  pool ??= postgres(process.env.CHAT_DATABASE_URL, {
    ssl: 'require',
    max: 3,
    prepare: false,
    idle_timeout: 20,
    connect_timeout: 10,
  });
  return pool;
}
export class ChatError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export const sessionCookie = 'tamilai_chat';
export const moderatorCookie = 'tamilai_chat_mod';
export const hash = (text: string) =>
  createHash('sha256').update(text).digest('hex');
export const token = () => randomBytes(32).toString('base64url');
export const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function validId(input: unknown): string {
  if (typeof input !== 'string' || !uuidPattern.test(input))
    throw new ChatError('Invalid conversation.');
  return input;
}
export function cookieToken(request: Request, name = sessionCookie) {
  const value = request.headers
    .get('cookie')
    ?.split(';')
    .map((x) => x.trim())
    .find((x) => x.startsWith(`${name}=`))
    ?.slice(name.length + 1);
  return value && /^[a-zA-Z0-9_-]{43}$/.test(value) ? value : null;
}
export function respond(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
export function fail(error: unknown) {
  if (error instanceof ChatError)
    return respond({ error: error.message }, error.status);
  // Never log connection strings, message content, cookies or raw database errors.
  console.error(
    'Chat request failed',
    error && typeof error === 'object' && 'code' in error
      ? String(error.code).slice(0, 30)
      : 'UNKNOWN',
  );
  return respond(
    { error: 'Chat is temporarily unavailable. Please retry.' },
    503,
  );
}
export function assertOrigin(
  request: Request,
  contentType = 'application/json',
) {
  if (request.headers.get('origin') !== new URL(request.url).origin)
    throw new ChatError('Please use chat from this website.', 403);
  if (!request.headers.get('content-type')?.startsWith(contentType))
    throw new ChatError('Unexpected request format.', 415);
}
export async function bodyOf(request: Request) {
  const raw = await request.text();
  if (raw.length > 6000) throw new ChatError('Message is too large.', 413);
  try {
    const body = JSON.parse(raw);
    if (!body || typeof body !== 'object' || Array.isArray(body))
      throw new Error();
    return body as Record<string, unknown>;
  } catch {
    throw new ChatError('Invalid request.');
  }
}
export function textOf(value: unknown, min: number, max: number) {
  if (typeof value !== 'string')
    throw new ChatError('Please enter valid text.');
  const text = Array.from(value)
    .filter((char) => {
      const code = char.codePointAt(0)!;
      return (
        code !== 127 && (code >= 32 || code === 9 || code === 10 || code === 13)
      );
    })
    .join('')
    .trim();
  if (Array.from(text).length < min || Array.from(text).length > max)
    throw new ChatError(`Please use ${min}–${max} characters.`);
  return text;
}
export async function sessionOf(request: Request, required = true) {
  const secret = cookieToken(request);
  const sql = chatDb();
  const [me] = secret
    ? await sql`select id,name,available,topic,suspended,archive_notice from tamil_chat.sessions where token_hash=${hash(secret)} and expires_at>now()`
    : [];
  if (!me && required)
    throw new ChatError('Your guest session expired. Please join again.', 401);
  if (me?.suspended)
    throw new ChatError(
      'This guest session has been suspended by a moderator.',
      403,
    );
  return me ?? null;
}
export async function limit(key: string, maximum: number, seconds: number) {
  const sql = chatDb();
  const [row] =
    await sql`insert into tamil_chat.limits as l(key,count,expires_at) values(${key},1,now()+${seconds}*interval '1 second')
    on conflict(key) do update set count=case when l.expires_at<now() then 1 else l.count+1 end,
      expires_at=case when l.expires_at<now() then excluded.expires_at else l.expires_at end returning count`;
  if (row.count > maximum)
    throw new ChatError(
      'Please slow down and try again in a little while.',
      429,
    );
}
export function networkKey(request: Request) {
  if (!process.env.CHAT_RATE_SALT)
    throw new ChatError('Chat is not configured yet.', 503);
  const ip = (
    request.headers.get('x-vercel-forwarded-for') ??
    request.headers.get('x-forwarded-for') ??
    request.headers.get('x-real-ip') ??
    'local'
  )
    .split(',')[0]
    .trim();
  return createHmac('sha256', process.env.CHAT_RATE_SALT)
    .update(ip)
    .digest('hex');
}
export async function cleanup() {
  const sql = chatDb();
  await sql`select tamil_chat.archive_retention()`;
  await sql.begin(async (tx) => {
    await tx`update tamil_chat.rooms r set status='ended',invite_hash=null where r.status in ('pending','active') and (r.expires_at<=now() or exists(select 1 from tamil_chat.sessions s where (s.id=r.host_id or s.id=r.guest_id) and (s.expires_at<=now() or s.suspended=true)))`;
    const changed =
      await tx`update tamil_chat.maintenance set last_cleaned=now() where id=true and last_cleaned<now()-interval '1 hour' returning id`;
    if (!changed.length) return;
    await tx`delete from tamil_chat.rooms where expires_at<now()`;
    await tx`delete from tamil_chat.sessions where expires_at<now()-interval '7 days'`;
    await tx`delete from tamil_chat.reports where created_at<now()-interval '7 days'`;
    await tx`delete from tamil_chat.limits where expires_at<now()`;
    await tx`delete from tamil_chat.moderators where expires_at<now()`;
  });
}
