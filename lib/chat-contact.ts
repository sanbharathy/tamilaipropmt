import { createHmac, timingSafeEqual } from 'node:crypto';
import { chatDb, ChatError, cookieToken, hash } from './chat-server';

export const contactCookie = 'taie_contact';
export const ownerCookie = 'taie_contact_owner';
export const contactMarker = (id: string) => `taie-contact:${id}`;
export function contactOwner() {
  const key = process.env.TAIE_CONTACT_OWNER_KEY;
  if (!key || key.length < 32)
    throw new ChatError(
      'Contact chat is being prepared. Please try again later.',
      503,
    );
  const derive = (label: string) =>
    createHmac('sha256', key).update(label).digest();
  const bytes = derive('taie-owner-id').subarray(0, 16);
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = bytes.toString('hex');
  return {
    id: `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`,
    key,
  };
}
export function isOwnerKey(candidate: unknown, expected: string) {
  return (
    typeof candidate === 'string' &&
    candidate.length <= 200 &&
    timingSafeEqual(
      Buffer.from(hash(candidate), 'hex'),
      Buffer.from(hash(expected), 'hex'),
    )
  );
}
export async function contactIdentity(request: Request) {
  const owner = contactOwner(),
    sql = chatDb();
  const ownerToken = cookieToken(request, ownerCookie);
  const [ownerSession] = ownerToken
    ? await sql`select 1 from tamil_chat.limits l join tamil_chat.sessions s on s.id=${owner.id} and s.token_hash=${hash(ownerToken)} and not s.suspended where l.key=${`taie-owner:${owner.id}:${hash(ownerToken)}`} and l.expires_at>now()`
    : [];
  if (ownerSession)
    return {
      role: 'owner' as const,
      id: owner.id,
      name: 'App owner',
      secret: ownerToken!,
    };
  const secret = cookieToken(request, contactCookie);
  const [visitor] = secret
    ? await sql`select s.id,s.name,s.suspended from tamil_chat.sessions s
      join tamil_chat.limits l on l.key=${'taie-contact:'}||s.id::text and l.expires_at>now()
      where s.token_hash=${hash(secret)} and s.expires_at>now()`
    : [];
  if (visitor?.suspended)
    throw new ChatError('This contact link is unavailable.', 403);
  return visitor
    ? {
        role: 'visitor' as const,
        id: visitor.id as string,
        name: visitor.name as string,
        secret: secret!,
      }
    : null;
}
