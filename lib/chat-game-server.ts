import { createHmac, timingSafeEqual } from 'node:crypto';
import type { ChatGame } from './chat-games';
import { isGameKind } from './chat-games';
export const GAME_PREFIX = '🎮 TamilAI game v1 ';
function signature(payload: string) {
  const key = process.env.CHAT_RATE_SALT;
  if (!key) throw new Error('Chat games are not configured');
  return createHmac('sha256', key)
    .update('chat-game-v1\n' + payload)
    .digest('hex');
}
export function gameMessage(game: ChatGame) {
  const payload = JSON.stringify(game);
  const body = GAME_PREFIX + signature(payload) + ' ' + payload;
  if (body.length > 1200) throw new Error('Game state exceeds message limit');
  return body;
}
export function readGameMessage(
  body: string,
  roomId: string,
  senderId?: string,
): ChatGame | null {
  if (!body.startsWith(GAME_PREFIX)) return null;
  const encoded = body.slice(GAME_PREFIX.length),
    sig = encoded.slice(0, 64),
    payload = encoded.slice(65);
  if (
    !/^[a-f0-9]{64}$/.test(sig) ||
    encoded[64] !== ' ' ||
    !timingSafeEqual(Buffer.from(sig), Buffer.from(signature(payload)))
  )
    return null;
  try {
    const g = JSON.parse(payload) as ChatGame;
    if (
      g.roomId !== roomId ||
      !isGameKind(g.kind) ||
      !Array.isArray(g.players) ||
      g.players.length !== 2 ||
      g.players[0] === g.players[1] ||
      ![0, 1].includes(g.actor) ||
      (senderId && g.players[g.actor] !== senderId)
    )
      return null;
    return g;
  } catch {
    return null;
  }
}
export function latestGame(
  rows: Record<string, unknown>[],
  roomId: string,
  hostId: string,
  guestId: string,
) {
  for (const row of rows) {
    if (typeof row.body !== 'string' || typeof row.sender_id !== 'string')
      continue;
    const game = readGameMessage(row.body, roomId, row.sender_id);
    if (game && game.players.includes(hostId) && game.players.includes(guestId))
      return game;
  }
  return null;
}
