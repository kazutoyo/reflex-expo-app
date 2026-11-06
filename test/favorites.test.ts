import { createHttpApi } from '@/core/api';

import { failingFetch, memoryFavorites, TOKYO_CITY } from '@/dev/fakes';
import { launch } from './harness';

test('お気に入りがなければ空', async () => {
  const app = await launch({ initialUrl: '/favorites' });
  expect(app.ls()).toMatchObject({ name: 'Favorites', state: { status: 'loaded', items: [] } });
});

test('お気に入りの都市と今の天気が並ぶ', async () => {
  const app = await launch({ initialUrl: '/favorites', favorites: memoryFavorites([TOKYO_CITY]) });
  expect(app.ls().state.items).toEqual([
    { city: TOKYO_CITY, current: { temperature: 23.5, code: 0 }, failed: false },
  ]);
});

test('天気が取れない都市も一覧には残る', async () => {
  const app = await launch({
    initialUrl: '/favorites',
    favorites: memoryFavorites([TOKYO_CITY]),
    api: createHttpApi(failingFetch(503)),
  });
  expect(app.ls().state.items).toEqual([{ city: TOKYO_CITY, current: null, failed: true }]);
});

test('開いてお気に入りを外し、戻ると一覧から消える', async () => {
  const favorites = memoryFavorites([TOKYO_CITY]);
  const app = await launch({ initialUrl: '/favorites', favorites });

  await app.do('Open', { id: TOKYO_CITY.id });
  expect(app.ls()).toMatchObject({
    path: '/favorites/1850147',
    name: 'City',
    state: { status: 'loaded', favorite: true },
  });

  await app.do('ToggleFavorite');
  await app.do('Back');
  expect(app.ls()).toMatchObject({ path: '/favorites', state: { items: [] } });
  expect(favorites.items).toEqual([]);
});

test('天気タブ → お気に入りタブ（タブのタップ）', async () => {
  const app = await launch({ favorites: memoryFavorites([TOKYO_CITY]) });
  await app.open('/favorites');
  expect(app.ls().state.items).toHaveLength(1);
});
