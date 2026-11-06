import { createHttpApi } from '@/core/api';

import { failingFetch, fakeLocation, fixtureFetch } from '@/dev/fakes';
import { launch } from './harness';

test('許可されていれば、起動するだけで現在地の天気が出る', async () => {
  const app = await launch();
  const { path, name, state } = app.ls();
  expect({ path, name }).toEqual({ path: '/', name: 'Weather' });
  expect(state).toMatchObject({
    status: 'loaded',
    place: '新宿区',
    forecast: { current: { temperature: 23.5, code: 0 } },
  });
  if (state.status === 'loaded') expect(state.forecast.daily).toHaveLength(7);
});

test('拒否されたら、もう一度許可を求められる', async () => {
  const location = fakeLocation({ permission: { granted: false, canAskAgain: true } });
  const app = await launch({ location });
  expect(app.ls().state).toEqual({ status: 'permissionDenied', canAskAgain: true });

  location.permission = { granted: true, canAskAgain: true }; // User granted permission
  await app.do('Retry');
  expect(app.ls().state.status).toBe('loaded');
});

test('二度と聞けないときは設定アプリを開く', async () => {
  const location = fakeLocation({ permission: { granted: false, canAskAgain: false } });
  const app = await launch({ location });
  expect(app.ls().state).toEqual({ status: 'permissionDenied', canAskAgain: false });
  await app.do('OpenSettings');
  expect(location.settingsOpened).toBe(1);
});

test('拒否されたら都市検索へ逃がす', async () => {
  const app = await launch({ location: fakeLocation({ permission: { granted: false, canAskAgain: false } }) });
  await app.do('OpenSearch');
  expect(app.ls()).toMatchObject({ path: '/search', name: 'Search' });
});

test('位置が取れないときはエラー', async () => {
  const app = await launch({ location: fakeLocation({ positionError: new Error('位置を取得できない') }) });
  expect(app.ls().state).toEqual({ status: 'error', message: '位置を取得できない' });
});

test('API が 500 ならエラー、直れば再試行で読める', async () => {
  let fetch: Parameters<typeof createHttpApi>[0] = failingFetch(500);
  const app = await launch({ api: createHttpApi((url) => fetch(url)) });
  expect(app.ls().state).toEqual({ status: 'error', message: 'HTTP 500' });

  fetch = fixtureFetch;
  await app.do('Retry');
  expect(app.ls().state.status).toBe('loaded');
});

test('設定で許可してから天気タブに戻ると、読み直す', async () => {
  const location = fakeLocation({ permission: { granted: false, canAskAgain: false } });
  const app = await launch({ location });
  await app.do('OpenSettings');
  await app.do('OpenSearch');

  location.permission = { granted: true, canAskAgain: false }; // Granted in the Settings app
  await app.open('/');
  expect(app.ls()).toMatchObject({ name: 'Weather', state: { status: 'loaded' } });
});

test('読み込めたあとはタブを行き来しても取り直さない', async () => {
  let calls = 0;
  const app = await launch({ api: createHttpApi((url) => (calls++, fixtureFetch(url))) });
  await app.do('OpenSearch');
  await app.open('/');
  expect(calls).toBe(1);
});

test('地名が取れなくても天気は出す', async () => {
  const app = await launch({ location: fakeLocation({ place: new Error('逆ジオコーディング失敗') }) });
  expect(app.ls().state).toMatchObject({ status: 'loaded', place: null });
});
