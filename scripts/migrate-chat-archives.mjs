import postgres from 'postgres';
import { readFile, unlink } from 'node:fs/promises';
const file = '/private/tmp/tamilaiprompt-chat-admin.json';
const config = JSON.parse(await readFile(file, 'utf8'));
const sql = postgres(config.POSTGRES_URL, {
  ssl: 'require',
  max: 1,
  prepare: false,
});
try {
  await sql.begin(async (tx) => {
    await tx.unsafe(
      await readFile(
        new URL('../database/chat-archives.sql', import.meta.url),
        'utf8',
      ),
    );
  });
  console.log(
    'Installed forward-only private archive tables, triggers and minute-by-minute expiry/purge job.',
  );
} catch (error) {
  console.error('Archive migration failed:', error.code ?? 'MIGRATION_ERROR');
  process.exitCode = 1;
} finally {
  await sql.end();
  await unlink(file);
}
