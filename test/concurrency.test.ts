import { createHttpApi, type City } from '@/core/api';
import type { Deps } from '@/core/deps';
import { createCityScreen } from '@/core/screens/city';
import { createSearchScreen } from '@/core/screens/search';

import { fakeLocation, fixtureFetch, memoryFavorites, TOKYO_CITY } from '@/dev/fakes';

/** Overlapping actions, which the harness's do (awaits each one) can't express. */
const deps = (overrides: Partial<Deps> = {}): Deps => ({
  api: createHttpApi(fixtureFetch),
  location: fakeLocation(),
  favorites: memoryFavorites(),
  nav: { navigate() {}, push() {}, back() {} },
  ...overrides,
});

test('お気に入りを連打すると、元に戻る', async () => {
  const favorites = memoryFavorites();
  const screen = createCityScreen(deps({ favorites }), { id: String(TOKYO_CITY.id) });
  await screen.send({ type: 'Appear' });

  await Promise.all([screen.send({ type: 'ToggleFavorite' }), screen.send({ type: 'ToggleFavorite' })]);
  expect(screen.getState()).toMatchObject({ favorite: false });
  expect(favorites.items).toEqual([]);
});

test('先に投げた遅い検索の結果は、後の検索を上書きしない', async () => {
  const pending: Record<string, (cities: City[]) => void> = {};
  const api = {
    ...createHttpApi(fixtureFetch),
    searchCities: (query: string) => new Promise<City[]>((resolve) => (pending[query] = resolve)),
  };
  const screen = createSearchScreen(deps({ api }));

  await screen.send({ type: 'ChangeQuery', query: 'Osaka' });
  const slow = screen.send({ type: 'Submit' });
  await screen.send({ type: 'ChangeQuery', query: 'Tokyo' });
  const fast = screen.send({ type: 'Submit' });

  pending.Tokyo([TOKYO_CITY]);
  await fast;
  pending.Osaka([]);
  await slow;
  expect(screen.getState()).toMatchObject({ status: 'loaded', results: [TOKYO_CITY] });
});
