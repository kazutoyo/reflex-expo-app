import fs from 'node:fs';
import path from 'node:path';

import { router, type Href } from 'expo-router';
import { act, renderRouter } from 'expo-router/testing-library';

import { createHttpApi } from '@/core/api';
import type { Deps } from '@/core/deps';
import { describeScreen, sendByName } from '@/core/inspect';
import { nav } from '@/platform/deps';
import type { Screen } from '@/core/store';
import { screens } from '@/core/screens/registry';

import { fakeLocation, fixtureFetch, memoryFavorites } from '@/dev/fakes';

const APP_DIR = path.resolve(__dirname, '../src/app');

/** Replace every screen file in src/app with () => null. _layout (navigators) stay real. */
function nullScreens(): Record<string, () => null> {
  const out: Record<string, () => null> = {};
  for (const entry of fs.readdirSync(APP_DIR, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !/\.tsx?$/.test(entry.name) || entry.name.startsWith('_layout')) continue;
    const rel = path.relative(APP_DIR, path.join(entry.parentPath, entry.name));
    out[rel.replace(/\.tsx?$/, '')] = () => null;
  }
  return out;
}

type NavState = { index?: number; routes: { key: string; state?: NavState }[] };

function focusedRoute(state: NavState) {
  let route = state.routes[state.index ?? 0];
  while (route.state) route = route.state.routes[route.state.index ?? 0];
  return route;
}

function routeKeys(state: NavState, out = new Set<string>()) {
  for (const r of state.routes) {
    out.add(r.key);
    if (r.state) routeKeys(r.state, out);
  }
  return out;
}

/**
 * Harness for calling the Reflex CLI equivalent (ls / do) from tests.
 * - Keeps one Screen per route key. Drops the Screen of a route removed from the Stack (= unmount).
 * - Sends Appear whenever focus moves (same rule as the app's useScreen).
 */
/** Omitting initialUrl matches launching without a URL (opening from the app icon). */
export async function launch({ initialUrl, ...overrides }: { initialUrl?: string } & Partial<Deps> = {}) {
  const deps = {
    api: createHttpApi(fixtureFetch),
    location: fakeLocation(),
    favorites: memoryFavorites(),
    nav,
    ...overrides,
  };
  const result = await renderRouter({ appDir: APP_DIR, overrides: nullScreens() }, { initialUrl });
  const cache = new Map<string, Screen<any, any>>();
  let focusedKey: string | undefined;

  const state = () => result.getRouterState() as unknown as NavState;
  const segments = () => result.getSegments().join('/');

  const current = () => {
    const { key } = focusedRoute(state());
    let screen = cache.get(key);
    if (!screen) {
      const factory = screens[segments()];
      if (!factory) throw new Error(`この画面には Core がない: ${result.getPathname()}`);
      screen = factory(deps, result.getSearchParams());
      cache.set(key, screen);
    }
    return screen;
  };

  async function settle() {
    const mounted = routeKeys(state());
    for (const key of cache.keys()) if (!mounted.has(key)) cache.delete(key);

    const { key } = focusedRoute(state());
    if (key === focusedKey) return;
    focusedKey = key;
    if (!screens[segments()]) return;
    const screen = current();
    if (screen.actions.includes('Appear')) await act(() => screen.send({ type: 'Appear' }));
  }

  await settle();

  return {
    pathname: () => result.getPathname(),
    /** name / state / actions of the current screen. */
    ls() {
      return { path: result.getPathname(), ...describeScreen(current()) };
    },
    /** Navigation from outside the screen's Core, such as tab taps and deep links. */
    async open(href: string) {
      await act(() => router.navigate(href as Href));
      await settle();
    },
    /** The routing queue is processed in useEffect, so wrap in act. Waits for side effects to finish. */
    async do(type: string, payload: object = {}) {
      const s = current();
      await act(() => sendByName(s, type, payload));
      await settle();
    },
  };
}
