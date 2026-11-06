import type { Deps } from '@/core/deps';
import type { Screen } from '@/core/store';

import { createCityScreen } from './city';
import { createFavoritesScreen } from './favorites';
import { createSearchScreen } from './search';
import { createWeatherScreen } from './weather';

type Factory = (deps: Deps, params: any) => Screen<any, any>;

/** segments ('/'-separated) → Screen factory. The harness uses this to create the "current screen". */
export const screens: Record<string, Factory> = {
  '(weather)': createWeatherScreen,
  '(search)/search': createSearchScreen,
  '(search)/cities/[id]': createCityScreen,
  '(favorites)/favorites': createFavoritesScreen,
  '(favorites)/favorites/[id]': createCityScreen,
};
