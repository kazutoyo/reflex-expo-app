#!/usr/bin/env node
// Reflex-style CLI. Inspect screen state and send actions without a simulator.
//
//   pnpm app-cli [--url /search] [--scenario rainy] [--json] <command>...
//     ls                     state and actions of the current screen
//     do <Action> [json]     send an action       e.g. do Open '{"id":1850147}'
//     go <href>              navigate (like a tab tap or deep link)
//
// Each invocation relaunches the app, so chain commands to operate in sequence.
//   pnpm app-cli --url /search do ChangeQuery '{"query":"Tokyo"}' do Submit do Open '{"id":1850147}'
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const opts = { cmds: [] };
let json = false;
while (args.length) {
  const a = args.shift();
  if (a === '--url') opts.url = args.shift();
  else if (a === '--scenario') opts.scenario = args.shift();
  else if (a === '--json') json = true;
  else if (a === 'ls') opts.cmds.push(['ls']);
  else if (a === 'go') opts.cmds.push(['go', args.shift()]);
  else if (a === 'do') {
    const type = args.shift();
    const payload = args[0]?.startsWith('{') ? JSON.parse(args.shift()) : undefined;
    opts.cmds.push(['do', type, payload]);
  } else {
    console.error(`不明な引数: ${a}`);
    process.exit(2);
  }
}
if (!opts.cmds.length) opts.cmds.push(['ls']);

const outFile = path.join(os.tmpdir(), `app-cli-${process.pid}.json`);
const res = spawnSync(
  'npx',
  // Changing config (testMatch etc.) invalidates jest's transform cache, so filter by path instead
  ['jest', '--no-watchman', '--silent', 'test/cli.test.tsx'],
  { env: { ...process.env, APP_CLI: JSON.stringify(opts), APP_CLI_OUT: outFile }, encoding: 'utf8' }
);
if (!fs.existsSync(outFile)) {
  console.error(res.stderr || res.stdout);
  process.exit(1);
}
const results = JSON.parse(fs.readFileSync(outFile, 'utf8'));
fs.unlinkSync(outFile);

if (json) {
  console.log(JSON.stringify(results, null, 2));
} else {
  for (const r of results) {
    console.log(`$ ${r.cmd.filter((c) => c != null).map((c) => (typeof c === 'string' ? c : JSON.stringify(c))).join(' ')}`);
    if (r.ms !== undefined) console.log(`  (${r.ms.toFixed(1)} ms)`);
    if (r.error) console.log(`  error: ${r.error}`);
    if (r.name) {
      console.log(`  ${r.path}  ${r.name}`);
      console.log(`  state:   ${JSON.stringify(r.state)}`);
      console.log(`  actions: ${r.actions.join(', ')}`);
    }
  }
}
process.exit(results.some((r) => r.error && !r.name) ? 1 : 0);
