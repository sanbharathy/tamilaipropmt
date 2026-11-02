import { readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const cli = process.env.VERCEL_CLI_PATH;
if (!cli)
  throw new Error(
    'Set VERCEL_CLI_PATH to the installed Vercel CLI entry point.',
  );
const values = Object.fromEntries(
  (await readFile('.env.chat.local', 'utf8'))
    .trim()
    .split('\n')
    .map((line) => {
      const index = line.indexOf('=');
      return [line.slice(0, index), line.slice(index + 1)];
    }),
);
for (const key of [
  'CHAT_DATABASE_URL',
  'CHAT_RATE_SALT',
  'CHAT_MODERATOR_KEY',
]) {
  if (!values[key]) throw new Error(`Missing ${key}`);
  const result = spawnSync(
    process.execPath,
    [
      cli,
      'env',
      'add',
      key,
      'production',
      '--sensitive',
      '--yes',
      '--project',
      'prj_EcxAfJCFCVzsPRyBGuf0K2PSa8SG',
      '--scope',
      'team_Fqi9MPkjet9wID7Kj0NSFocP',
    ],
    { input: values[key], encoding: 'utf8' },
  );
  if (result.status !== 0)
    throw new Error(
      `Could not configure ${key}. No value printed. Check Vercel environment settings before retrying.`,
    );
  console.log(`Configured ${key} as a production secret.`);
}
await writeFile(
  '.env.chat-moderator.local',
  `# Owner-only access: https://www.tamilaiprompt.com/community-chat/moderation\nCHAT_MODERATOR_KEY=${values.CHAT_MODERATOR_KEY}\n`,
  { mode: 0o600, flag: 'wx' },
);
console.log(
  'Moderator key saved separately in ignored .env.chat-moderator.local.',
);
