/** Messages shared by the DevTools panel and the app (src/dev/rozenite.ts). */
export const PLUGIN_ID = 'reflex-devtools';

/** Same shape as __app.ls(). error is set when the current screen has no Core. */
export type Snapshot = {
  path: string;
  name?: string;
  state?: unknown;
  actions: readonly string[];
  inputs: Record<string, Record<string, 'string' | 'number'>>;
  error?: string;
};

export type Events = { snapshot: Snapshot };

export type Methods = {
  ls: () => Promise<Snapshot>;
  scenarios: () => Promise<string[]>;
  do: (params: { type: string; payload: Record<string, unknown> }) => Promise<Snapshot>;
  go: (params: { href: string }) => Promise<Snapshot>;
  scenario: (params: { name: string }) => Promise<Snapshot>;
  hydrate: (params: { state: unknown }) => Promise<Snapshot>;
};
