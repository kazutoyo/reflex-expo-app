import { createRozeniteRpc, getRozeniteDevToolsClient } from '@rozenite/plugin-bridge';
import { connectFakePair, RozeniteChannelProvider, waitForMessage } from '@rozenite/testing';
import { render } from '@testing-library/react-native';

import { useReflexDevTools } from '@/dev/rozenite';

import { PLUGIN_ID, type Events, type Methods } from '../plugins/reflex-devtools/src/protocol';

jest.mock('@/dev/devtools', () => {
  const app = {
    state: { status: 'loaded', count: 0 } as Record<string, unknown>,
    current: 'default',
    ls: () => ({ path: '/', name: 'Weather', state: app.state, actions: ['Retry'], inputs: {} }),
    async do(type: string) {
      if (type !== 'Retry') throw new Error(`Weather に ${type} はない: Retry`);
      app.state = { ...app.state, count: (app.state.count as number) + 1 };
    },
    go: (href: string) => href,
    scenarios: () => ['rainy'],
    scenario: (name: string) => (app.current = name),
    hydrate: (state: Record<string, unknown>) => (app.state = state),
  };
  return { app };
});
const { app: mockApp } = jest.requireMock('@/dev/devtools');

function Host() {
  useReflexDevTools();
  return null;
}

test('パネルから今の画面を見て、アクションとシナリオと state を送れる', async () => {
  const { device, panel } = connectFakePair();
  const client = await getRozeniteDevToolsClient<Events>(PLUGIN_ID, { channel: panel });
  const first = waitForMessage(client, 'snapshot', { timeoutMs: 1000 });
  render(
    <RozeniteChannelProvider channel={device} role="device">
      <Host />
    </RozeniteChannelProvider>
  );
  expect(await first).toMatchObject({ path: '/', name: 'Weather', state: { count: 0 } });

  const rpc = createRozeniteRpc<Methods>(client);
  expect(await rpc.method('scenarios').invoke()).toEqual(['default', 'rainy']);
  expect((await rpc.method('do').invoke({ type: 'Retry', payload: {} })).state).toEqual({ status: 'loaded', count: 1 });
  await expect(rpc.method('do').invoke({ type: 'Open', payload: {} })).rejects.toThrow('Weather に Open はない');
  await rpc.method('scenario').invoke({ name: 'rainy' });
  expect(mockApp.current).toBe('rainy');
  expect((await rpc.method('hydrate').invoke({ state: { status: 'error' } })).state).toEqual({ status: 'error' });

  rpc.close();
  client.close();
});
