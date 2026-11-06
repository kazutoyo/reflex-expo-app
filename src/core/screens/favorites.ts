import type { City, Forecast } from '@/core/api';
import type { Deps } from '@/core/deps';
import { createStore, type Screen } from '@/core/store';

/** current is null while loading or when the fetch failed (failed). */
export type FavoriteItem = { city: City; current: Forecast['current'] | null; failed: boolean };

export type FavoritesState = { status: 'idle' | 'loaded'; items: FavoriteItem[] };

export type FavoritesAction = { type: 'Appear' } | { type: 'Open'; id: number };

type Msg =
  | { type: 'ListLoaded'; cities: City[] }
  | { type: 'CurrentLoaded'; id: number; current: Forecast['current'] | null };

export function update(state: FavoritesState, msg: Msg): FavoritesState {
  switch (msg.type) {
    case 'ListLoaded': {
      // Keep weather that was already fetched
      const known = new Map(state.items.map((i) => [i.city.id, i]));
      return {
        status: 'loaded',
        items: msg.cities.map((city) => known.get(city.id) ?? { city, current: null, failed: false }),
      };
    }
    case 'CurrentLoaded':
      return {
        ...state,
        items: state.items.map((i) =>
          i.city.id === msg.id ? { ...i, current: msg.current, failed: msg.current === null } : i
        ),
      };
  }
}

/** Favorite cities and the current weather for each. */
export function createFavoritesScreen(deps: Deps): Screen<FavoritesState, FavoritesAction> {
  const store = createStore<FavoritesState, Msg>({ status: 'idle', items: [] }, update);

  return {
    name: 'Favorites',
    actions: ['Appear', 'Open'],
    inputs: { Open: { id: 'number' } },
    getState: store.getState,
    subscribe: store.subscribe,
    hydrate: store.replace,
    async send(action) {
      switch (action.type) {
        case 'Appear': {
          // Favorites may change in the detail screen before coming back, so reload on every focus
          store.dispatch({ type: 'ListLoaded', cities: await deps.favorites.list() });
          const missing = store.getState().items.filter((i) => i.current === null && !i.failed);
          await Promise.all(
            missing.map(async ({ city }) => {
              const current = await deps.api
                .forecast(city.latitude, city.longitude)
                .then((f) => f.current)
                .catch(() => null);
              store.dispatch({ type: 'CurrentLoaded', id: city.id, current });
            })
          );
          return;
        }
        case 'Open':
          return deps.nav.push(`/favorites/${action.id}`);
      }
    },
  };
}
