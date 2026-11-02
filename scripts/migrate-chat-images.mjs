import postgres from 'postgres';
import { readFile, unlink } from 'node:fs/promises';
const file = '/private/tmp/tamilaiprompt-chat-admin.json';
const config = JSON.parse(await readFile(file, 'utf8'));
if (!/^postgres(ql)?:\/\//.test(config.POSTGRES_URL))
  throw new Error('Expected private database connection');
const sql = postgres(config.POSTGRES_URL, {
  ssl: 'require',
  max: 1,
  prepare: false,
});
try {
  await sql.begin(async (tx) => {
    await tx.unsafe(
      await readFile(
        new URL('../database/chat-images.sql', import.meta.url),
        'utf8',
      ),
    );
  });
  console.log(
    'Added bounded private image fields and database-enforced deletion when chats end.',
  );
} catch (error) {
  console.error(
    'Chat-image migration failed:',
    error.code ?? 'MIGRATION_ERROR',
  );
  process.exitCode = 1;
} finally {
  await sql.end();
  await unlink(file);
}
