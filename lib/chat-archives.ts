import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
} from 'node:crypto';
import { after } from 'next/server';
import { chatDb } from './chat-server';
import { archivePdf, type ArchiveSnapshot } from './chat-archive-pdf';

function archiveKey() {
  const salt = process.env.CHAT_RATE_SALT;
  if (!salt) throw new Error('Archive encryption is not configured');
  return createHmac('sha256', salt)
    .update('tamilaiprompt-chat-archive-v1')
    .digest();
}
export function encryptArchive(pdf: Buffer, roomId: string) {
  const iv = randomBytes(12),
    cipher = createCipheriv('aes-256-gcm', archiveKey(), iv);
  cipher.setAAD(Buffer.from(roomId));
  return Buffer.concat([
    iv,
    cipher.update(pdf),
    cipher.final(),
    cipher.getAuthTag(),
  ]);
}
export function decryptArchive(data: Buffer, roomId: string) {
  const decipher = createDecipheriv(
    'aes-256-gcm',
    archiveKey(),
    data.subarray(0, 12),
  );
  decipher.setAAD(Buffer.from(roomId));
  decipher.setAuthTag(data.subarray(-16));
  return Buffer.concat([
    decipher.update(data.subarray(12, -16)),
    decipher.final(),
  ]);
}
export async function processArchives(maximum = 2, onlyRoom?: string) {
  const sql = chatDb();
  let processed = 0;
  for (let i = 0; i < maximum; i++) {
    const didWork = await sql.begin(async (tx) => {
      const [row] =
        await tx`select room_id,snapshot from tamil_chat.archives where snapshot is not null and expires_at>now() and (${onlyRoom ?? null}::uuid is null or room_id=${onlyRoom ?? null}::uuid) order by ended_at for update skip locked limit 1`;
      if (!row) return false;
      const pdf = await archivePdf(row.snapshot as ArchiveSnapshot);
      const encrypted = encryptArchive(pdf, row.room_id);
      await tx`update tamil_chat.archives set pdf_data=${encrypted},pdf_sha256=${createHash('sha256').update(pdf).digest('hex')},snapshot=null,ready_at=now() where room_id=${row.room_id} and expires_at>now()`;
      return true;
    });
    if (!didWork) break;
    processed++;
  }
  return processed;
}
export function scheduleArchives() {
  after(async () => {
    try {
      await processArchives();
    } catch {
      console.error('Chat archive generation will retry');
    }
  });
}
