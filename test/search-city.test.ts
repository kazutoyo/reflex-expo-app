import { memoryFavorites } from '@/dev/fakes';
import { launch } from './harness';

test('検索すると候補が出る', async () => {
  const app = await launch({ initialUrl: '/search' });
  await app.do('ChangeQuery', { query: 'Tokyo' });
  await app.do('Submit');
  const { state } = app.ls();
  expect(state.status).toBe('loaded');
  expect(state.results[0]).toEqual({
    id: 1850147,
    name: '東京都',
    region: '東京都, 日本',
    latitude: 35.6895,
    longitude: 139.69171,
  });
});

test('0 件でもエラーにならない', async () => {
  const app = await launch({ initialUrl: '/search' });
  await app.do('ChangeQuery', { query: 'zzzzqqq' });
  await app.do('Submit');
  expect(app.ls().state).toMatchObject({ status: 'loaded', results: [] });
});

test('空のクエリでは検索しない', async () => {
  const app = await launch({ initialUrl: '/search' });
  await app.do('ChangeQuery', { query: '  ' });
  await app.do('Submit');
  expect(app.ls().state.status).toBe('idle');
});

test('詳細でお気に入りにして戻ると、検索画面に反映される', async () => {
  const favorites = memoryFavorites();
  const app = await launch({ initialUrl: '/search', favorites });
  expect(app.ls().state.favorites).toEqual([]);

  await app.do('Open', { id: 1850147 });
  expect(app.ls()).toMatchObject({
    path: '/cities/1850147',
    name: 'City',
    state: { status: 'loaded', city: { name: '東京都' }, favorite: false },
  });

  await app.do('ToggleFavorite');
  expect(app.ls().state.favorite).toBe(true);
  expect(favorites.items.map((c) => c.id)).toEqual([1850147]);

  await app.do('Back');
  expect(app.ls()).toMatchObject({ path: '/search', state: { favorites: [{ id: 1850147 }] } });

  // Reopening creates a new Screen (the previous one was dropped on pop). Favorites are reloaded from storage
  await app.do('Open', { id: 1850147 });
  expect(app.ls().state).toMatchObject({ status: 'loaded', favorite: true });
});

test('知らない都市はフィクスチャがないのでエラー（ネットワークには出ない）', async () => {
  const app = await launch({ initialUrl: '/cities/999' });
  expect(app.ls().state).toEqual({ status: 'error', message: expect.stringContaining('No fixture for') });
});
