import { useFocusEffect } from 'expo-router';
import { useCallback, useState, useSyncExternalStore } from 'react';

import { focused } from '@/core/inspect';
import type { Screen } from '@/core/store';

/** Create one Screen and subscribe to it. Sends Appear on every focus (the harness follows the same rule). */
export function useScreen<S, A extends { type: string }>(create: () => Screen<S, A>) {
  const [screen] = useState(create);
  const state = useSyncExternalStore(screen.subscribe, screen.getState);
  useFocusEffect(
    useCallback(() => {
      focused.screen = screen;
      if (screen.actions.includes('Appear')) void screen.send({ type: 'Appear' } as A);
      return () => {
        if (focused.screen === screen) focused.screen = null;
      };
    }, [screen])
  );
  return [state, (action: A) => void screen.send(action)] as const;
}
