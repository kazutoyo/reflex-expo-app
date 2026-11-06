import fs from 'node:fs';

import { scenarios } from '@/dev/scenarios';

import { launch } from './harness';

// jest-expo fakes timers, so use the real clock
const { performance } = jest.requireActual<typeof import('node:perf_hooks')>('node:perf_hooks');

/** Called from scripts/app-cli.mjs. Skipped when APP_CLI is unset (normal test runs). */
type Cmd = ['ls'] | ['do', string, object?] | ['go', string];
const { url, scenario, cmds } = JSON.parse(process.env.APP_CLI ?? '{}') as {
  url?: string;
  scenario?: string;
  cmds: Cmd[];
};

(process.env.APP_CLI ? test : test.skip)('app-cli', async () => {
  if (scenario && !scenarios[scenario]) {
    throw new Error(`シナリオ ${scenario} はない: ${Object.keys(scenarios).join(', ')}`);
  }
  const t0 = performance.now();
  const app = await launch({ initialUrl: url, ...(scenario ? scenarios[scenario]() : {}) });
  const out: unknown[] = [{ cmd: ['launch'], ms: performance.now() - t0 }];
  const ls = () => {
    try {
      return app.ls();
    } catch (e) {
      return { path: app.pathname(), error: (e as Error).message };
    }
  };
  for (const cmd of cmds) {
    try {
      const t = performance.now();
      if (cmd[0] === 'do') await app.do(cmd[1], cmd[2]);
      if (cmd[0] === 'go') await app.open(cmd[1]);
      out.push({ cmd, ms: performance.now() - t, ...ls() });
    } catch (e) {
      out.push({ cmd, error: (e as Error).message });
      break;
    }
  }
  fs.writeFileSync(process.env.APP_CLI_OUT!, JSON.stringify(out));
});
