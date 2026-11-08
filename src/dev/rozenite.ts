import { createRozeniteRpc, useRozeniteDevToolsClient } from '@rozenite/plugin-bridge';
import { useEffect } from 'react';

import { focused } from '@/core/inspect';
import { errorMessage } from '@/core/store';

import { PLUGIN_ID, type Events, type Methods, type Snapshot } from '../../plugins/reflex-devtools/src/protocol';
import { app } from './devtools';

const snapshot = (): Snapshot => {
  try {
    return app.ls();
  } catch (e) {
    return { path: focused.path, actions: [], inputs: {}, error: errorMessage(e) };
  }
};

/** Connects __app to the Reflex panel in React Native DevTools (plugins/reflex-devtools). */
export function useReflexDevTools() {
  const client = useRozeniteDevToolsClient<Events>({ pluginId: PLUGIN_ID });

  useEffect(() => {
    if (!client) return;
    const rpc = createRozeniteRpc<Methods>(client);
    let last = '';
    const push = () => {
      const next = snapshot();
      const json = JSON.stringify(next);
      if (json === last) return;
      last = json;
      client.send('snapshot', next);
    };
    const after = async (run: () => unknown) => {
      await run();
      push();
      return snapshot();
    };

    rpc.handle('ls', async () => snapshot());
    rpc.handle('scenarios', async () => ['default', ...app.scenarios()]);
    rpc.handle('do', ({ type, payload }) => after(() => app.do(type, payload)));
    rpc.handle('go', ({ href }) => after(() => app.go(href)));
    rpc.handle('scenario', ({ name }) => after(() => app.scenario(name)));
    rpc.handle('hydrate', ({ state }) => after(() => app.hydrate(state)));

    // ponytail: polls the focused screen; subscribe to focus changes if 300ms ever matters
    const timer = setInterval(push, 300);
    push();
    return () => {
      clearInterval(timer);
      rpc.close();
    };
  }, [client]);
}
