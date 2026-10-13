import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID;
if (!/^[a-f0-9-]{36}$/i.test(databaseId || '') || databaseId === '00000000-0000-4000-8000-000000000000') {
  throw new Error('Set CLOUDFLARE_D1_DATABASE_ID to your Cloudflare D1 database ID.');
}
const prepareOnly = process.argv.includes('--prepare-only');
if (!prepareOnly) for (const key of ['CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_API_TOKEN', 'ADMIN_PASSWORD']) {
  if (!process.env[key]) throw new Error(`Missing ${key}. Configure the GitHub repository secrets.`);
}
const built = JSON.parse(readFileSync('dist/server/wrangler.json', 'utf8'));
mkdirSync('.cloudflare', { recursive: true });
const config = {
  name: 'global-fashion-shop',
  main: '../dist/server/index.js',
  compatibility_date: built.compatibility_date,
  compatibility_flags: built.compatibility_flags,
  no_bundle: true,
  rules: built.rules,
  assets: { directory: '../dist/client' },
  workers_dev: true,
  observability: { enabled: true },
  d1_databases: [{ binding: 'DB', database_name: 'global-fashion-shop', database_id: databaseId, migrations_dir: '../drizzle' }],
};
const configPath = '.cloudflare/wrangler.json';
writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
if (prepareOnly) { console.log('Cloudflare configuration prepared.'); process.exit(0); }
function wrangler(args, input) {
  const result = spawnSync(process.execPath, ['node_modules/wrangler/bin/wrangler.js', ...args, '--config', configPath], {
    stdio: input ? ['pipe', 'inherit', 'inherit'] : 'inherit',
    input,
    env: { ...process.env, CI: 'true', WRANGLER_SEND_METRICS: 'false' },
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
wrangler(['d1', 'migrations', 'apply', 'DB', '--remote']);
wrangler(['deploy']);
wrangler(['secret', 'bulk'], JSON.stringify({ ADMIN_PASSWORD: process.env.ADMIN_PASSWORD }));
