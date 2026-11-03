import PDFDocument from 'pdfkit';
import sharp from 'sharp';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { findChatSticker } from './chat-stickers';
import { readReply, readReaction } from './chat-interactions-server';

export type ArchiveSnapshot = {
  roomId: string;
  startedAt: string;
  endedAt: string;
  reason: string;
  host: { id: string; name: string };
  guest: { id: string; name: string } | null;
  events: { event: string; at: string }[];
  messages: {
    id: string;
    senderId: string;
    body: string;
    at: string;
    removedAt?: string;
    image?: string;
  }[];
};

export async function archivePdf(snapshot: ArchiveSnapshot): Promise<Buffer> {
  const font = path.join(process.cwd(), 'assets/chat-pdf/NotoSansTamil.ttf');
  const doc = new PDFDocument({
    size: 'A4',
    margin: 48,
    font,
    info: { Title: 'Private chat security archive', Author: 'TamilAI Prompt' },
    bufferPages: true,
  });
  const chunks: Buffer[] = [];
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
  // Preserve exact Unicode (including emoji unsupported by the print font).
  // Embedded JSON excludes image bytes; images appear directly on PDF pages.
  const transcript = {
    ...snapshot,
    messages: snapshot.messages.map(({ image, ...message }) => ({
      ...message,
      hasImage: !!image,
    })),
  };
  doc.file(Buffer.from(JSON.stringify(transcript, null, 2), 'utf8'), {
    name: 'transcript-utf8.json',
    description: 'Exact Unicode message text and timestamps',
  });
  const printable = (text: string) =>
    text.replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, (c) =>
      c === '\uFE0F' || c === '\u200D'
        ? ''
        : `[U+${c.codePointAt(0)!.toString(16).toUpperCase()}]`,
    );
  const date = (value: string) =>
    new Date(value).toISOString().replace('T', ' ').replace('Z', ' UTC');
  doc.fontSize(19).fillColor('#155e55').text('TamilAI Prompt - Chat Archive');
  doc
    .moveDown(0.5)
    .fontSize(9)
    .fillColor('#475569')
    .text('CONFIDENTIAL - Security review only. Not end-to-end encrypted.');
  doc.text(`Conversation: ${snapshot.roomId}`);
  doc.text(
    `Started: ${date(snapshot.startedAt)}\nEnded: ${date(snapshot.endedAt)}\nEnd reason: ${snapshot.reason}`,
  );
  doc.text(`Host: ${printable(snapshot.host.name)} (${snapshot.host.id})`);
  doc.text(
    `Guest: ${snapshot.guest ? printable(snapshot.guest.name) + ' (' + snapshot.guest.id + ')' : 'No guest joined'}`,
  );
  doc
    .moveDown()
    .text(
      'Retained for 30 days after the chat ends. Shared photos are reduced to at most 512 pixels at JPEG quality 45. This record is not verified proof of identity or a forensic original.',
    );
  doc.text(
    'Emoji are printed as Unicode codes where needed; exact message text is also embedded in transcript-utf8.json.',
  );
  doc.moveDown().fontSize(12).fillColor('#155e55').text('Chat activity');
  doc.fontSize(9).fillColor('#334155');
  for (const event of snapshot.events)
    doc.text(`${date(event.at)} - ${event.event}`);
  doc
    .moveDown()
    .fontSize(12)
    .fillColor('#155e55')
    .text(`Messages (${snapshot.messages.length})`);
  if (!snapshot.messages.length)
    doc.fontSize(10).fillColor('#334155').text('No messages were sent.');
  for (const message of snapshot.messages) {
    if (doc.y > 710) doc.addPage();
    const name =
      message.senderId === snapshot.host.id
        ? snapshot.host.name
        : (snapshot.guest?.name ?? 'Guest');
    doc
      .moveDown(0.7)
      .fontSize(9)
      .fillColor('#155e55')
      .text(`#${message.id} | ${printable(name)} | ${date(message.at)}`);
    if (message.removedAt)
      doc
        .fillColor('#9a3412')
        .text(`Removed by moderation: ${date(message.removedAt)}`);
    const reply = readReply(message.body, snapshot.roomId, message.senderId);
    const reaction = readReaction(
      message.body,
      snapshot.roomId,
      message.senderId,
    );
    const displayBody =
      reply?.body ??
      (reaction
        ? `${reaction.active ? 'Added' : 'Removed'} ${reaction.emoji} reaction to message #${reaction.target_id}`
        : message.body);
    if (reply)
      doc
        .fontSize(9)
        .fillColor('#475569')
        .text(`Reply to #${reply.reply.id}: ${printable(reply.reply.preview)}`);
    doc
      .fontSize(10)
      .fillColor('#111827')
      .text(printable(displayBody), { lineGap: 4 });
    const sticker = findChatSticker(displayBody);
    let bytes: Buffer | undefined;
    if (message.image) bytes = Buffer.from(message.image, 'base64');
    else if (sticker?.photo)
      bytes = await readFile(path.join(process.cwd(), 'public', sticker.photo));
    if (bytes) {
      const { data, info } = await sharp(bytes, { limitInputPixels: 16000000 })
        .rotate()
        .resize({
          width: 512,
          height: 512,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .flatten({ background: '#ffffff' })
        .jpeg({ quality: 45 })
        .toBuffer({ resolveWithObject: true });
      const width = Math.min(300, info.width),
        height = (info.height * width) / info.width;
      if (doc.y + height + 30 > doc.page.height - 48) doc.addPage();
      const y = doc.y + 8;
      doc.image(data, 48, y, { width });
      doc.y = y + height + 8;
      if (sticker?.credit)
        doc.fontSize(8).text(sticker.credit + ' | Fan-made reaction caption');
    }
  }
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i);
    const oldBottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    doc
      .fontSize(8)
      .fillColor('#64748b')
      .text(
        `CONFIDENTIAL | ${i + 1} / ${range.count}`,
        48,
        doc.page.height - 30,
        { lineBreak: false },
      );
    doc.page.margins.bottom = oldBottom;
  }
  doc.end();
  return done;
}
