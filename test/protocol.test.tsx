import net from 'node:net';

import { cleanup } from '@testing-library/react-native';

import { createHttpApi } from '@/core/api';
import { createFixtureFetch, fakeLocation, memoryFavorites } from '@/dev/fakes';

import { launch } from './harness';

/**
 * Adapter for running the native app's (reflex-native-app) behavior tests against this RN app.
 * Speaks the same NDJSON (launch / ls / do / env) as the native CLI over TCP. Skipped when REFLEX_PORT is unset.
 *   REFLEX_PORT=8770 npx jest --no-watchman test/protocol.test.tsx
 */
type Req = { cmd: string; [key: string]: any };

let realFetchAttempts = 0;
const blocked = globalThis.fetch;
globalThis.fetch = ((...args: Parameters<typeof fetch>) => (realFetchAttempts++, blocked(...args))) as typeof fetch;

function createSession() {
  let app: Awaited<ReturnType<typeof launch>> | undefined;
  let location = fakeLocation();
  let favorites = memoryFavorites();
  let http: 'fixtures' | 'offline' | { status: number } = 'fixtures';
  let weatherCode: number | undefined;
  let requests = 0;

  const fetch = (url: string) => {
    requests++;
    if (http === 'offline') return Promise.reject(new Error('ネットワークに接続できません'));
    if (typeof http === 'object') return Promise.resolve({ ok: false, status: http.status, json: async () => ({}) });
    return createFixtureFetch({ weatherCode })(url);
  };

  /** Shared by launch and env: change the device environment */
  function apply(req: Req) {
    const loc = req.location ?? {};
    if ('granted' in loc) location.permission = { ...location.permission, granted: loc.granted };
    if ('canAskAgain' in loc) location.permission = { ...location.permission, canAskAgain: loc.canAskAgain };
    if (loc.positionError) location.positionError = new Error(loc.positionError);
    if ('place' in loc) location.place = loc.place;
    if (loc.placeError) location.place = new Error(loc.placeError);
    if (req.http) http = req.http;
    if (req.weatherCode !== undefined) weatherCode = req.weatherCode;
  }

  /** Actions the tabs and stack provide in the native app. In RN, map them to expo-router navigation */
  function actions() {
    const { actions } = app!.ls();
    return [...actions.filter((a: string) => a !== 'Back'), ...(actions.includes('Back') ? ['Back'] : []), 'SelectTab'];
  }

  async function handle(req: Req) {
    switch (req.cmd) {
      case 'launch': {
        await cleanup();
        location = fakeLocation();
        http = 'fixtures';
        weatherCode = undefined;
        const setup = createHttpApi(createFixtureFetch()); // Build favorite cities from fixtures
        favorites = memoryFavorites(await Promise.all((req.favorites ?? []).map((id: number) => setup.city(id))));
        apply(req);
        requests = 0;
        app = await launch({ initialUrl: req.route, api: createHttpApi(fetch), location, favorites });
        break;
      }
      case 'ls':
        break;
      case 'do': {
        const { name } = app!.ls();
        if (req.action === 'SelectTab') {
          await app!.open({ weather: '/', search: '/search', favorites: '/favorites' }[req.input.tab as string]!);
        } else if (!actions().includes(req.action)) {
          throw new Error(`${name} に ${req.action} はない: ${actions().join(', ')}`);
        } else {
          await app!.do(req.action, req.input);
        }
        break;
      }
      case 'env':
        apply(req);
        break;
      default:
        throw new Error(`知らないコマンド: ${req.cmd}`);
    }
    const { path, name, state } = app!.ls();
    return {
      ok: true,
      path,
      name,
      state,
      actions: actions(),
      env: {
        settingsOpened: location.settingsOpened,
        favorites: favorites.items.map((c) => c.id),
        httpRequests: requests,
        networkViolations: realFetchAttempts,
      },
    };
  }
  return handle;
}

(process.env.REFLEX_PORT ? test : test.skip)(
  'protocol server',
  () =>
    new Promise<void>((resolve) => {
      const server = net.createServer((socket) => {
        const handle = createSession();
        let buffer = '';
        let queue = Promise.resolve();
        socket.on('data', (chunk) => {
          buffer += chunk.toString('utf8');
          let i;
          while ((i = buffer.indexOf('\n')) >= 0) {
            const line = buffer.slice(0, i);
            buffer = buffer.slice(i + 1);
            queue = queue.then(async () => {
              const out = await handle(JSON.parse(line)).catch((e: Error) => ({ ok: false, error: e.message }));
              socket.write(JSON.stringify(out) + '\n');
            });
          }
        });
        socket.on('close', () => server.close(() => resolve()));
      });
      server.listen(Number(process.env.REFLEX_PORT), '127.0.0.1');
    }),
  60 * 60 * 1000
);
