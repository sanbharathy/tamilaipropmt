import { timingSafeEqual } from 'node:crypto';
import {
  assertOrigin,
  bodyOf,
  chatDb,
  ChatError,
  cookieToken,
  fail,
  hash,
  limit,
  moderatorCookie,
  networkKey,
  respond,
  token,
  validId,
} from '@/lib/chat-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function authenticate(request: Request) {
  const secret = cookieToken(request, moderatorCookie);
  const sql = chatDb();
  const [session] = secret
    ? await sql`select token_hash from tamil_chat.moderators where token_hash=${hash(secret)} and expires_at>now()`
    : [];
  if (!session) throw new ChatError('Moderator sign-in required.', 401);
}

export async function GET(request: Request) {
  try {
    await authenticate(request);
    const sql = chatDb();
    const reports =
      await sql`select id,reported_id,message_id::text,excerpt,reason,status,created_at from tamil_chat.reports order by created_at desc limit 100`;
    return respond({ reports });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    assertOrigin(request);
    const body = await bodyOf(request);
    const sql = chatDb();
    if (body.action === 'login') {
      await limit(`moderator-login:${networkKey(request)}`, 5, 900);
      const configured = process.env.CHAT_MODERATOR_KEY;
      if (
        !configured ||
        typeof body.key !== 'string' ||
        body.key.length > 200 ||
        !timingSafeEqual(
          Buffer.from(hash(body.key)),
          Buffer.from(hash(configured)),
        )
      )
        throw new ChatError('Invalid moderator key.', 401);
      const secret = token();
      await sql`insert into tamil_chat.moderators(token_hash,expires_at) values(${hash(secret)},now()+interval '1 hour')`;
      const response = respond({ ok: true });
      response.cookies.set(moderatorCookie, secret, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/api/chat/moderation',
        maxAge: 3600,
      });
      return response;
    }
    await authenticate(request);
    if (body.action === 'logout') {
      await sql`delete from tamil_chat.moderators where token_hash=${hash(cookieToken(request, moderatorCookie)!)}`;
      const response = respond({ ok: true });
      response.cookies.set(moderatorCookie, '', {
        path: '/api/chat/moderation',
        maxAge: 0,
      });
      return response;
    }
    const reportId = validId(body.reportId);
    const [report] =
      await sql`select * from tamil_chat.reports where id=${reportId}`;
    if (!report) throw new ChatError('Report not found.', 404);
    if (body.action === 'resolve') {
      await sql`update tamil_chat.reports set status='resolved' where id=${reportId}`;
    } else if (body.action === 'suspend') {
      await sql.begin(async (tx) => {
        await tx`update tamil_chat.sessions set suspended=true,available=false where id=${report.reported_id}`;
        await tx`update tamil_chat.rooms set status='ended',invite_hash=null where host_id=${report.reported_id} or guest_id=${report.reported_id}`;
        await tx`update tamil_chat.reports set status='resolved' where id=${reportId}`;
      });
    } else if (body.action === 'remove-message') {
      await sql`delete from tamil_chat.messages where id=${report.message_id}`;
      await sql`update tamil_chat.reports set status='resolved' where id=${reportId}`;
    } else throw new ChatError('Unknown moderation action.');
    return respond({ ok: true });
  } catch (error) {
    return fail(error);
  }
}
