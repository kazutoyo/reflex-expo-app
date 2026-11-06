import type { Api, City } from './api';

export type Coords = { latitude: number; longitude: number };

export type Permission = { granted: boolean; canAskAgain: boolean };

/** expo-location and the link to the Settings app. */
export type Location = {
  requestPermission(): Promise<Permission>;
  getCurrentPosition(): Promise<Coords>;
  /** Reverse geocoding (coordinates → city/ward name). null if unknown. */
  placeName(coords: Coords): Promise<string | null>;
  openSettings(): void;
};

/** Favorites stored on device (expo-sqlite/kv-store). */
export type Favorites = {
  list(): Promise<City[]>;
  save(cities: City[]): Promise<void>;
};

/** Navigation. Production uses expo-router; the harness also renders the real expo-router, so both use the same implementation. */
export type Nav = {
  navigate(href: string): void;
  push(href: string): void;
  back(): void;
};

export type Deps = { api: Api; location: Location; favorites: Favorites; nav: Nav };
