import type { City } from '@/core/api';
import type { Favorites, Location, Permission } from '@/core/deps';

import city1850147 from './fixtures/city-1850147.json';
import forecastTokyo from './fixtures/forecast-tokyo.json';
import searchEmpty from './fixtures/search-empty.json';
import searchTokyo from './fixtures/search-tokyo.json';

/**
 * Fakes shared by tests and app development (__app.scenario).
 * Fixtures are saved real responses from Open-Meteo.
 */

const ok = (body: unknown) => Promise.resolve({ ok: true, status: 200, json: async () => body });

// Parse without relying on Hermes's URL / URLSearchParams
function parse(url: string) {
  const [base, query = ''] = url.split('?');
  const params = Object.fromEntries(
    query
      .split('&')
      .filter(Boolean)
      .map((kv) => kv.split('=').map(decodeURIComponent))
  );
  return { path: base.replace(/^https?:\/\/[^/]+/, ''), params };
}

/**
 * Create a fetch that returns fixtures. Unknown URLs throw (never hits the network).
 * Passing weatherCode rewrites the current weather and today's forecast to that weather (for rain, snow, etc.).
 */
export function createFixtureFetch({ weatherCode }: { weatherCode?: number } = {}) {
  return (url: string) => {
    const { path, params } = parse(url);
    if (path === '/v1/forecast') {
      if (weatherCode === undefined) return ok(forecastTokyo);
      const codes = [weatherCode, ...forecastTokyo.daily.weather_code.slice(1)];
      return ok({
        ...forecastTokyo,
        current: { ...forecastTokyo.current, weather_code: weatherCode },
        daily: { ...forecastTokyo.daily, weather_code: codes },
      });
    }
    if (path === '/v1/search') return ok(params.name === 'Tokyo' ? searchTokyo : searchEmpty);
    if (path === '/v1/get') {
      const hit = [city1850147, ...searchTokyo.results].find((c) => String(c.id) === params.id);
      if (hit) return ok(hit);
    }
    return Promise.reject(new Error(`フィクスチャがない: ${url}`));
  };
}

export const fixtureFetch = createFixtureFetch();

export const failingFetch = (status = 500) => () =>
  Promise.resolve({ ok: false, status, json: async () => ({}) });

export const TOKYO = { latitude: 35.6895, longitude: 139.69171 };

type FakeLocation = Location & {
  permission: Permission;
  positionError?: Error;
  place: string | null | Error;
  settingsOpened: number;
};

/** Stand-in for expo-location. Mutate fields to simulate things like "the user changed a setting". */
export function fakeLocation(
  init: { permission?: Permission; positionError?: Error; place?: string | null | Error } = {}
): FakeLocation {
  const fake: FakeLocation = {
    permission: { granted: true, canAskAgain: true },
    place: '新宿区',
    settingsOpened: 0,
    ...init,
    async requestPermission() {
      return fake.permission;
    },
    async getCurrentPosition() {
      if (fake.positionError) throw fake.positionError;
      return TOKYO;
    },
    async placeName() {
      if (fake.place instanceof Error) throw fake.place;
      return fake.place;
    },
    openSettings() {
      fake.settingsOpened++;
    },
  };
  return fake;
}

export const TOKYO_CITY: City = {
  id: 1850147,
  name: '東京都',
  region: '東京都, 日本',
  latitude: 35.6895,
  longitude: 139.69171,
};

/** Stand-in for expo-sqlite/kv-store. */
export function memoryFavorites(initial: City[] = []): Favorites & { items: City[] } {
  const fake = {
    items: initial,
    async list() {
      return fake.items;
    },
    async save(cities: City[]) {
      fake.items = cities;
    },
  };
  return fake;
}
