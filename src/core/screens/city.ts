import type { City, Forecast } from '@/core/api';
import type { Deps } from '@/core/deps';
import { createStore, errorMessage, type Screen } from '@/core/store';

export type CityState =
  | { status: 'idle' | 'loading' }
  | { status: 'loaded'; city: City; forecast: Forecast; favorite: boolean }
  | { status: 'error'; message: string };

export type CityAction =
  | { type: 'Appear' }
  | { type: 'Retry' }
  | { type: 'ToggleFavorite' }
  | { type: 'Back' };

type Msg =
  | { type: 'Loading' }
  | { type: 'Loaded'; city: City; forecast: Forecast; favorite: boolean }
  | { type: 'Failed'; message: string }
  | { type: 'FavoriteChanged'; favorite: boolean };

export function update(state: CityState, msg: Msg): CityState {
  switch (msg.type) {
    case 'Loading':
      return { status: 'loading' };
    case 'Loaded':
      return { status: 'loaded', city: msg.city, forecast: msg.forecast, favorite: msg.favorite };
    case 'Failed':
      return { status: 'error', message: msg.message };
    case 'FavoriteChanged':
      return state.status === 'loaded' ? { ...state, favorite: msg.favorite } : state;
  }
}

/** City detail (weekly forecast and favorite). params come from expo-router's `cities/[id]`. */
export function createCityScreen(deps: Deps, params: { id: string }): Screen<CityState, CityAction> {
  const store = createStore<CityState, Msg>({ status: 'idle' }, update);
  const id = Number(params.id);

  async function load() {
    store.dispatch({ type: 'Loading' });
    try {
      const city = await deps.api.city(id);
      const [forecast, favorites] = await Promise.all([
        deps.api.forecast(city.latitude, city.longitude),
        deps.favorites.list(),
      ]);
      store.dispatch({ type: 'Loaded', city, forecast, favorite: favorites.some((c) => c.id === id) });
    } catch (e) {
      store.dispatch({ type: 'Failed', message: errorMessage(e) });
    }
  }

  return {
    name: 'City',
    actions: ['Appear', 'Retry', 'ToggleFavorite', 'Back'],
    getState: store.getState,
    subscribe: store.subscribe,
    hydrate: store.replace,
    async send(action) {
      const state = store.getState();
      switch (action.type) {
        case 'Appear':
          if (state.status === 'idle') await load();
          return;
        case 'Retry':
          return load();
        case 'ToggleFavorite': {
          if (state.status !== 'loaded') return;
          // Flip before awaiting so a rapid second tap sees the new value
          const favorite = !state.favorite;
          store.dispatch({ type: 'FavoriteChanged', favorite });
          try {
            await (favorite ? deps.favorites.add(state.city) : deps.favorites.remove(id));
          } catch (e) {
            store.dispatch({ type: 'FavoriteChanged', favorite: !favorite });
            throw e;
          }
          return;
        }
        case 'Back':
          return deps.nav.back();
      }
    },
  };
}
