import { createHttpApi } from '@/core/api';
import type { Deps } from '@/core/deps';

import { createFixtureFetch, fakeLocation, memoryFavorites, TOKYO_CITY } from './fakes';
import searchTokyo from './fixtures/search-tokyo.json';

const fixtureApi = (weatherCode?: number) => createHttpApi(createFixtureFetch({ weatherCode }));

const cities = searchTokyo.results.slice(0, 4).map((r) => ({
  id: r.id,
  name: r.name,
  region: [r.admin1, r.country].filter((s, i, a) => s && a.indexOf(s) === i).join(', '),
  latitude: r.latitude,
  longitude: r.longitude,
}));

/**
 * Dependency combinations for producing screen variations. Shared by the harness (CLI) and the dev build's __app.
 * State is produced through update, so only screens that can really occur are possible.
 */
export const scenarios: Record<string, () => Partial<Deps>> = {
  /** No network, always the same data (for screenshots) */
  fixtures: () => ({ api: fixtureApi(), location: fakeLocation(), favorites: memoryFavorites([TOKYO_CITY]) }),
  rainy: () => ({ api: fixtureApi(63), location: fakeLocation() }),
  snowy: () => ({ api: fixtureApi(73), location: fakeLocation() }),
  stormy: () => ({ api: fixtureApi(95), location: fakeLocation() }),
  /** Multiple favorites */
  'many-favorites': () => ({ api: fixtureApi(), favorites: memoryFavorites(cities) }),
  /** No connectivity */
  offline: () => ({
    api: createHttpApi(() => Promise.reject(new Error('ネットワークに接続できません'))),
  }),
  /** Response never arrives (stays loading) */
  loading: () => ({ api: createHttpApi(() => new Promise(() => {})) }),
  /** Location already denied (as after denying once on iOS) */
  'location-denied': () => ({
    location: fakeLocation({ permission: { granted: false, canAskAgain: false } }),
  }),
};
