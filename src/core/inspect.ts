import type { Screen } from './store';

/** Equivalent of Reflex's Introspection Kit. Returns the same shape for the harness (CLI) and the dev build's __app. */
export function describeScreen(screen: Screen<any, any>) {
  return { name: screen.name, state: screen.getState(), actions: screen.actions, inputs: screen.inputs ?? {} };
}

/** send by action name and payload. Unknown actions throw. */
export async function sendByName(screen: Screen<any, any>, type: string, payload: object = {}) {
  if (!screen.actions.includes(type)) {
    throw new Error(`${screen.name} に ${type} はない: ${screen.actions.join(', ')}`);
  }
  for (const [key, kind] of Object.entries(screen.inputs?.[type] ?? {})) {
    if (typeof (payload as Record<string, unknown>)[key] !== kind) {
      throw new Error(`${type} の入力が正しくない: ${JSON.stringify(payload)}`);
    }
  }
  await screen.send({ type, ...payload });
}

/** The screen currently focused in the app (registered by useScreen). */
export const focused = {
  screen: null as Screen<any, any> | null,
  path: '/',
};
