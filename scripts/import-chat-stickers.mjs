import {
  readFile,
  readdir,
  mkdir,
  writeFile,
  copyFile,
  stat,
} from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
const source = process.argv[2];
if (!source) throw new Error('Pass the supplied assets directory.');
const metadata = JSON.parse(
    await readFile(path.join(source, 'sticker.json'), 'utf8'),
  ),
  directory = path.join(source, 'stickers'),
  output = 'public/chat-stickers/tamil-packs';
await mkdir(path.join(output, 'full'), { recursive: true });
await mkdir(path.join(output, 'thumbs'), { recursive: true });
const all = await readdir(directory),
  listed = new Set(metadata.all_sticker.flatMap((pack) => pack.sticker_files)),
  groups = [
    ...metadata.all_sticker.map((pack) => ({
      id: pack.identifier,
      name: pack.name,
      files: pack.sticker_files,
    })),
    {
      id: 'more-reactions',
      name: 'More reactions',
      files: all.filter((file) => !listed.has(file)),
    },
  ],
  packs = [],
  used = new Set(),
  skipped = [];
let count = 0,
  thumbBytes = 0,
  fullBytes = 0;
for (const group of groups) {
  if (!/^[a-z0-9_-]+$/i.test(group.id) || typeof group.name !== 'string')
    throw new Error('Invalid sticker pack metadata.');
  const items = [];
  for (const file of group.files) {
    if (path.basename(file) !== file || !file.toLowerCase().endsWith('.webp'))
      throw new Error('Unsafe sticker filename.');
    const sourceFile = path.join(directory, file),
      bytes = await readFile(sourceFile);
    let info;
    try {
      info = await sharp(bytes, { limitInputPixels: 16000000 }).metadata();
      if (!info.width || !info.height || info.format !== 'webp')
        throw new Error();
    } catch {
      skipped.push(file);
      continue;
    }
    const asset = createHash('sha256').update(bytes).digest('hex').slice(0, 24),
      id = 'ts-' + createHash('sha256').update(file).digest('hex').slice(0, 16);
    if (!used.has(asset)) {
      await copyFile(sourceFile, path.join(output, 'full', asset + '.webp'));
      const thumbnail = await sharp(bytes)
        .resize(160, 160, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .webp({ quality: 78, alphaQuality: 100 })
        .toBuffer();
      await writeFile(path.join(output, 'thumbs', asset + '.webp'), thumbnail);
      used.add(asset);
      thumbBytes += thumbnail.length;
      fullBytes += bytes.length;
    }
    items.push({ id, asset });
    count++;
  }
  if (items.length) packs.push({ id: group.id, name: group.name, items });
}
await writeFile('lib/chat-sticker-packs.json', JSON.stringify(packs) + '\n');
console.log(
  JSON.stringify({
    packs: packs.length,
    stickers: count,
    uniqueArtwork: used.size,
    thumbnailKB: Math.round(thumbBytes / 1024),
    originalMB: Math.round((fullBytes / 1048576) * 10) / 10,
    catalogKB: Math.round(
      (await stat('lib/chat-sticker-packs.json')).size / 1024,
    ),
    skipped,
  }),
);
