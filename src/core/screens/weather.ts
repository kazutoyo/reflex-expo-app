import type { Forecast } from '@/core/api';
import type { Deps } from '@/core/deps';
import { createStore, errorMessage, type Screen } from '@/core/store';

export type WeatherState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'permissionDenied'; canAskAgain: boolean }
  | { status: 'loaded'; forecast: Forecast; place: string | null }
  | { status: 'error'; message: string };

export type WeatherAction =
  | { type: 'Appear' }
  | { type: 'Retry' }
  | { type: 'OpenSettings' }
  | { type: 'OpenSearch' };

type Msg =
  | { type: 'Loading' }
  | { type: 'Denied'; canAskAgain: boolean }
  | { type: 'Loaded'; forecast: Forecast; place: string | null }
  | { type: 'Failed'; message: string };

export function update(_state: WeatherState, msg: Msg): WeatherState {
  switch (msg.type) {
    case 'Loading':
      return { status: 'loading' };
    case 'Denied':
      return { status: 'permissionDenied', canAskAgain: msg.canAskAgain };
    case 'Loaded':
      return { status: 'loaded', forecast: msg.forecast, place: msg.place };
    case 'Failed':
      return { status: 'error', message: msg.message };
  }
}

/** Weather at the current location. Location permission → current position → weather API. */
export function createWeatherScreen(deps: Deps): Screen<WeatherState, WeatherAction> {
  const store = createStore<WeatherState, Msg>({ status: 'idle' }, update);

  async function load() {
    store.dispatch({ type: 'Loading' });
    try {
      const permission = await deps.location.requestPermission();
      if (!permission.granted) {
        return store.dispatch({ type: 'Denied', canAskAgain: permission.canAskAgain });
      }
      const coords = await deps.location.getCurrentPosition();
      const [forecast, place] = await Promise.all([
        deps.api.forecast(coords.latitude, coords.longitude),
        // Show the weather even if the place name is unavailable
        deps.location.placeName(coords).catch(() => null),
      ]);
      store.dispatch({ type: 'Loaded', forecast, place });
    } catch (e) {
      store.dispatch({ type: 'Failed', message: errorMessage(e) });
    }
  }

  return {
    name: 'Weather',
    actions: ['Appear', 'Retry', 'OpenSettings', 'OpenSearch'],
    getState: store.getState,
    subscribe: store.subscribe,
    hydrate: store.replace,
    async send(action) {
      switch (action.type) {
        case 'Appear': {
          // Once loaded, don't refetch every time the user switches tabs.
          // If permission was denied, the user may have granted it in Settings and come back, so reload
          const { status } = store.getState();
          if (status === 'idle' || status === 'permissionDenied') await load();
          return;
        }
        case 'Retry':
          return load();
        case 'OpenSettings':
          return deps.location.openSettings();
        case 'OpenSearch':
          return deps.nav.navigate('/search');
      }
    },
  };
}
