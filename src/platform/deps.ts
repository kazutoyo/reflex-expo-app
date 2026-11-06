import { router, type Href } from 'expo-router';
import * as ExpoLocation from 'expo-location';
import Storage from 'expo-sqlite/kv-store';
import { Linking } from 'react-native';

import { createHttpApi } from '@/core/api';
import type { City } from '@/core/api';
import type { Deps, Nav } from '@/core/deps';

const FAVORITES_KEY = 'favorites';

const readFavorites = async (): Promise<City[]> =>
  JSON.parse((await Storage.getItem(FAVORITES_KEY)) ?? '[]');

// Serialize read-modify-write so overlapping add/remove don't overwrite each other
let favoritesQueue: Promise<unknown> = Promise.resolve();
function updateFavorites(change: (cities: City[]) => City[]) {
  const next = favoritesQueue.then(async () =>
    Storage.setItem(FAVORITES_KEY, JSON.stringify(change(await readFavorites())))
  );
  favoritesQueue = next.catch(() => {});
  return next;
}

export const nav: Nav = {
  navigate: (href) => router.navigate(href as Href),
  push: (href) => router.push(href as Href),
  back: () => router.back(),
};

/** Production app deps (Expo implementations). In tests the harness passes Deps from dev/fakes. */
export const deps: Deps = {
  api: createHttpApi((url) => fetch(url)),
  location: {
    async requestPermission() {
      const { granted, canAskAgain } = await ExpoLocation.requestForegroundPermissionsAsync();
      return { granted, canAskAgain };
    },
    async getCurrentPosition() {
      const { coords } = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.Balanced,
      });
      return { latitude: coords.latitude, longitude: coords.longitude };
    },
    async placeName(coords) {
      const [address] = await ExpoLocation.reverseGeocodeAsync(coords);
      return address?.city ?? address?.district ?? address?.region ?? null;
    },
    openSettings: () => void Linking.openSettings(),
  },
  favorites: {
    list: readFavorites,
    add: (city) => updateFavorites((cities) => [...cities.filter((c) => c.id !== city.id), city]),
    remove: (id) => updateFavorites((cities) => cities.filter((c) => c.id !== id)),
  },
  nav,
};
