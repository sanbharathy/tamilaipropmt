import {
  chatDb,
  ChatError,
  cookieToken,
  hash,
  moderatorCookie,
} from './chat-server';
export async function requireModerator(request: Request) {
  const secret = cookieToken(request, moderatorCookie);
  const [session] = secret
    ? await chatDb()`select 1 from tamil_chat.moderators where token_hash=${hash(secret)} and expires_at>now()`
    : [];
  if (!session) throw new ChatError('Moderator sign-in required.', 401);
}
