import assert from 'node:assert/strict';
import sharp from 'sharp';
import { normalizeCameraMotion, cameraGif } from '../lib/chat-camera-server.ts';
import { imageResponse } from '../lib/chat-images.ts';
import { isSingleEmoji } from '../lib/chat-emoji.ts';
for (const emoji of ['😂', '❤️', '😘', '👍🏽', '👨‍👩‍👧‍👦', '🇮🇳', '1️⃣', '🧑🏾‍💻'])
  assert.equal(isSingleEmoji(emoji), true, emoji);
for (const text of ['Hello', '😂😂', 'Hi ❤️', '1', '#', '🇮', '', '👍 yes'])
  assert.equal(isSingleEmoji(text), false, text);
const width = 128,
  height = 96,
  frames = 20,
  raw = Buffer.alloc(width * height * frames * 3);
for (let frame = 0; frame < frames; frame++)
  for (let pixel = 0; pixel < width * height; pixel++) {
    const offset = (frame * width * height + pixel) * 3;
    raw[offset] = (frame * 12) % 256;
    raw[offset + 1] = ((pixel % width) + frame * 8) % 256;
    raw[offset + 2] = 128;
  }
const sprite = await sharp(raw, {
  raw: { width, height: height * frames, channels: 3 },
})
  .png()
  .toBuffer();
const webp = await normalizeCameraMotion(sprite),
  gif = await cameraGif(webp, true),
  meta = await sharp(gif, { animated: true }).metadata();
assert.equal(gif.subarray(0, 3).toString(), 'GIF');
assert.equal(meta.pages, 20);
assert.equal(
  meta.delay.reduce((sum, n) => sum + n, 0),
  5000,
);
assert.equal(meta.loop, 0);
assert.ok(webp.length <= 524288);
assert.ok(gif.length <= 1048576);
assert.ok(!meta.exif);
const response = await imageResponse(webp, true);
assert.equal(response.headers.get('Content-Type'), 'image/gif');
assert.ok(response.headers.get('Cache-Control').includes('no-store'));
const still = await sharp({
  create: {
    width,
    height: height * frames,
    channels: 3,
    background: '#5b8374',
  },
})
  .png()
  .toBuffer();
const stationary = await cameraGif(await normalizeCameraMotion(still), true);
assert.equal(stationary.subarray(0, 3).toString(), 'GIF');
await assert.rejects(
  normalizeCameraMotion(
    await sharp({
      create: { width: 600, height: 600, channels: 3, background: '#fff' },
    })
      .png()
      .toBuffer(),
  ),
);
console.log(
  `PASS: single emoji families/skin tones/flags, animated and stationary GIF delivery, 5-second looping duration, bounded dimensions/size, metadata stripping, private headers and malformed capture rejection. Test GIF: ${gif.length} bytes.`,
);
