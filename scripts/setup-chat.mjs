import postgres from 'postgres';
import { readFile, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';

const adminConfig = JSON.parse(
  await readFile('/private/tmp/tamilaiprompt-chat-admin.json', 'utf8'),
);
const adminUrl = adminConfig.POSTGRES_URL;
if (!adminUrl) throw new Error('Missing temporary admin connection');
if (!/^postgres(ql)?:\/\//.test(adminUrl))
  throw new Error('Expected a decrypted PostgreSQL connection URL');
const sql = postgres(adminUrl, { ssl: 'require', max: 1, prepare: false });
const password = randomBytes(32).toString('hex');
try {
  const existing =
    await sql`select 1 from pg_roles where rolname='tamilaiprompt_chat'`;
  if (existing.length)
    throw new Error(
      'Chat role already exists. Refusing to rotate its credentials.',
    );
  await sql.begin(async (tx) => {
    await tx.unsafe(
      `create role tamilaiprompt_chat login password '${password}' nosuperuser nocreatedb nocreaterole noinherit nobypassrls`,
    );
    await tx.unsafe(
      await readFile(new URL('../database/chat.sql', import.meta.url), 'utf8'),
    );
    const inherited =
      await tx`select count(*)::int as count from pg_tables where schemaname not in ('tamil_chat','pg_catalog','information_schema') and has_table_privilege('tamilaiprompt_chat',quote_ident(schemaname)||'.'||quote_ident(tablename),'SELECT,INSERT,UPDATE,DELETE')`;
    if (inherited[0].count)
      throw new Error(
        'Host database grants inherited PUBLIC table access; refusing to reuse it.',
      );
  });
  const connection = new URL(adminUrl);
  // Supavisor usernames have the role.project-ref form.
  const oldUser = decodeURIComponent(connection.username);
  const suffix = oldUser.includes('.')
    ? oldUser.slice(oldUser.indexOf('.'))
    : '';
  connection.username = `tamilaiprompt_chat${suffix}`;
  connection.password = password;
  const rateSalt = randomBytes(32).toString('hex');
  const moderatorKey = randomBytes(24).toString('base64url');
  const env = `CHAT_DATABASE_URL=${connection.toString()}\nCHAT_RATE_SALT=${rateSalt}\nCHAT_MODERATOR_KEY=${moderatorKey}\n`;
  await writeFile(new URL('../.env.chat.local', import.meta.url), env, {
    mode: 0o600,
    flag: 'wx',
  });
  console.log(
    'Created isolated chat schema and restricted role. Secrets saved in ignored .env.chat.local; no host tables changed.',
  );
} catch (error) {
  console.error('Chat setup failed:', error.code ?? 'SETUP_ERROR');
  process.exitCode = 1;
} finally {
  await sql.end();
}
