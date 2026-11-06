import type { City } from '@/core/api';
import type { Deps } from '@/core/deps';
import { createStore, errorMessage, type Screen } from '@/core/store';

export type SearchState = {
  query: string;
  status: 'idle' | 'loading' | 'loaded' | 'error';
  results: City[];
  error?: string;
  favorites: City[];
};

export type SearchAction =
  | { type: 'Appear' }
  | { type: 'ChangeQuery'; query: string }
  | { type: 'Submit' }
  | { type: 'Open'; id: number };

type Msg =
  | { type: 'FavoritesLoaded'; favorites: City[] }
  | { type: 'QueryChanged'; query: string }
  | { type: 'Searching' }
  | { type: 'Found'; results: City[] }
  | { type: 'Failed'; message: string };

export function update(state: SearchState, msg: Msg): SearchState {
  switch (msg.type) {
    case 'FavoritesLoaded':
      return { ...state, favorites: msg.favorites };
    case 'QueryChanged':
      return { ...state, query: msg.query };
    case 'Searching':
      return { ...state, status: 'loading', error: undefined };
    case 'Found':
      return { ...state, status: 'loaded', results: msg.results };
    case 'Failed':
      return { ...state, status: 'error', error: msg.message };
  }
}

/** City search. Shows favorites when the query is empty. */
export function createSearchScreen(deps: Deps): Screen<SearchState, SearchAction> {
  const store = createStore<SearchState, Msg>(
    { query: '', status: 'idle', results: [], favorites: [] },
    update
  );

  return {
    name: 'Search',
    actions: ['Appear', 'ChangeQuery', 'Submit', 'Open'],
    inputs: { ChangeQuery: { query: 'string' }, Open: { id: 'number' } },
    getState: store.getState,
    subscribe: store.subscribe,
    hydrate: store.replace,
    async send(action) {
      switch (action.type) {
        case 'Appear':
          // Reload on every focus to reflect favorites changed in the detail screen
          return store.dispatch({ type: 'FavoritesLoaded', favorites: await deps.favorites.list() });
        case 'ChangeQuery':
          return store.dispatch({ type: 'QueryChanged', query: action.query });
        case 'Submit': {
          const query = store.getState().query.trim();
          if (!query) return;
          store.dispatch({ type: 'Searching' });
          // ponytail: with rapid Submits, a slow response can win last. If that bites, drop stale responses by request ID
          try {
            store.dispatch({ type: 'Found', results: await deps.api.searchCities(query) });
          } catch (e) {
            store.dispatch({ type: 'Failed', message: errorMessage(e) });
          }
          return;
        }
        case 'Open':
          return deps.nav.push(`/cities/${action.id}`);
      }
    },
  };
}
