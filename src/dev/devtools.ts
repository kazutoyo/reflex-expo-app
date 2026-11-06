import { router, type Href } from 'expo-router';

import { describeScreen, focused, sendByName } from '@/core/inspect';
import { deps } from '@/platform/deps';

import { scenarios } from './scenarios';

const original = { ...deps };

const current = () => {
  if (!focused.screen) throw new Error(`この画面には Core がない: ${focused.path}`);
  return focused.screen;
};

/**
 * Control surface exposed only in dev builds. Call it from Metro's debugger (CDP).
 *   __app.ls()                       state and actions of the current screen
 *   __app.do('Open', { id: 1 })      send an action (bypasses buttons)
 *   __app.go('/favorites')           navigate (like a tab tap or deep link)
 *   __app.scenario('rainy')          swap deps for a scenario ('default' restores them)
 *   __app.hydrate({...})             set the current screen's state directly
 */
const app = {
  ls: () => ({ path: focused.path, ...describeScreen(current()) }),
  async do(type: string, payload: object = {}) {
    await sendByName(current(), type, payload);
    return app.ls();
  },
  go(href: string) {
    router.navigate(href as Href);
    return href;
  },
  scenarios: () => Object.keys(scenarios),
  scenario(name: string) {
    if (name !== 'default' && !scenarios[name]) {
      throw new Error(`シナリオ ${name} はない: default, ${Object.keys(scenarios).join(', ')}`);
    }
    // deps is the same object the screens share, so swapping its contents takes effect from the next call
    Object.assign(deps, original, name === 'default' ? {} : scenarios[name]());
    return name;
  },
  hydrate(state: unknown) {
    current().hydrate(state);
    return app.ls();
  },
};

(globalThis as any).__app = app;
