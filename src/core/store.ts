/** A screen's Core, the equivalent of a Reflex ViewModel. Depends on neither React nor expo-router. */
export type Screen<S, A extends { type: string }> = {
  name: string;
  /** If present, 'Appear' is sent every time the screen gains focus (in the app and in the harness). */
  actions: readonly A['type'][];
  /** Types of actions that take input. sendByName checks them before send (Reflex's input schema) */
  inputs?: Record<string, Record<string, 'string' | 'number'>>;
  getState(): S;
  subscribe(listener: () => void): () => void;
  /** The returned Promise resolves once all side effects (API calls etc.) have finished. */
  send(action: A): Promise<void>;
  /** Dev only: replace the whole state (__app.hydrate). Beware: this allows states update would never produce. */
  hydrate(state: S): void;
};

/** Only update changes state. dispatch never leaves the Screen. */
export function createStore<S, M>(initial: S, update: (state: S, msg: M) => S) {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    getState: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    dispatch(msg: M) {
      state = update(state, msg);
      listeners.forEach((l) => l());
    },
    replace(next: S) {
      state = next;
      listeners.forEach((l) => l());
    },
  };
}

export const errorMessage = (e: unknown) => (e instanceof Error ? e.message : String(e));
