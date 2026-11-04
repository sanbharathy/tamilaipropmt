import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import {
  chatStickers,
  suppliedChatStickers,
  tamilStickerPacks,
  stickerBody,
  findChatSticker,
  chatStickerPreview,
} from '../lib/chat-stickers.ts';
import { replyQuote } from '../lib/chat-interactions-server.ts';
import { archivePdf } from '../lib/chat-archive-pdf.ts';
const ids = new Set();
for (const sticker of [...chatStickers, ...suppliedChatStickers]) {
  assert.ok(!ids.has(sticker.id));
  ids.add(sticker.id);
  assert.equal(findChatSticker(stickerBody(sticker)), sticker);
  if (sticker.artwork) {
    assert.match(
      sticker.photo,
      /^\/chat-stickers\/tamil-packs\/full\/[a-f0-9]{24}\.webp$/,
    );
    assert.ok((await readFile('public' + sticker.photo)).length);
    assert.ok((await readFile('public' + sticker.thumbnail)).length);
  }
}
for (const value of [
  '🧩 Tamil sticker ../../.env',
  '🧩 Tamil sticker ts-unknown',
  'https://example.test/sticker.webp',
])
  assert.equal(findChatSticker(value), undefined);
const first = suppliedChatStickers[0],
  second = tamilStickerPacks[1].stickers[0],
  room = randomUUID(),
  host = randomUUID(),
  guest = randomUUID(),
  now = new Date().toISOString();
assert.equal(chatStickerPreview(stickerBody(first)), first.en);
assert.equal(
  replyQuote(
    { id: '1', sender_id: host, body: stickerBody(first), has_image: false },
    room,
  ).preview,
  first.en,
);
const pdf = await archivePdf({
  roomId: room,
  startedAt: now,
  endedAt: now,
  reason: 'test',
  host: { id: host, name: 'Test host' },
  guest: { id: guest, name: 'Test guest' },
  events: [],
  messages: [
    { id: '1', senderId: host, body: stickerBody(first), at: now },
    { id: '2', senderId: guest, body: stickerBody(second), at: now },
  ],
});
assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
assert.ok(
  (pdf.toString('latin1').match(/\/Subtype \/Image/g) ?? []).length >= 2,
);
console.log(
  `PASS: ${suppliedChatStickers.length} supplied stickers in ${tamilStickerPacks.length} packs, all artwork/preview files, legacy messages, safe unknown-ID rejection, readable reply labels and sticker images in security PDFs.`,
);
