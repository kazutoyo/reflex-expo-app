import { createRozeniteRpc, useRozeniteDevToolsClient } from '@rozenite/plugin-bridge';
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';

import { PLUGIN_ID, type Events, type Methods, type Snapshot } from './protocol';

const TABS = ['/', '/search', '/favorites'];

export default function ReflexPanel() {
  const client = useRozeniteDevToolsClient<Events>({ pluginId: PLUGIN_ID });
  const rpc = useMemo(() => (client ? createRozeniteRpc<Methods>(client) : null), [client]);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [scenarios, setScenarios] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [href, setHref] = useState('/cities/1850147');
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (!client || !rpc) return;
    const sub = client.onMessage('snapshot', setSnapshot);
    rpc.method('ls').invoke().then(setSnapshot, () => {});
    rpc.method('scenarios').invoke().then(setScenarios, () => {});
    return () => {
      sub.remove();
      rpc.close();
    };
  }, [client, rpc]);

  useEffect(() => setDraft(JSON.stringify(snapshot?.state ?? null, null, 2)), [snapshot?.name, snapshot?.path]);

  const run = async (call: () => Promise<Snapshot>) => {
    setError('');
    try {
      setSnapshot(await call());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  if (!rpc) return <div style={s.page}>Connecting to the app…</div>;

  const send = (type: string) => {
    const fields = snapshot?.inputs[type];
    let payload: Record<string, unknown> = {};
    if (fields) {
      try {
        payload = JSON.parse(inputs[type] || '{}');
      } catch {
        return setError(`The input for ${type} is not JSON`);
      }
    }
    run(() => rpc.method('do').invoke({ type, payload }));
  };

  return (
    <div style={s.page}>
      <Section title="Current screen">
        <div style={s.row}>
          <code style={s.badge}>{snapshot?.path ?? '-'}</code>
          <strong>{snapshot?.name ?? snapshot?.error ?? ''}</strong>
        </div>
        <pre style={s.pre}>{JSON.stringify(snapshot?.state ?? null, null, 2)}</pre>
      </Section>

      <Section title="Actions (do)">
        {snapshot?.actions.map((type) => (
          <div key={type} style={s.row}>
            <button style={s.button} onClick={() => send(type)}>
              {type}
            </button>
            {snapshot.inputs[type] && (
              <input
                style={s.input}
                placeholder={JSON.stringify(
                  Object.fromEntries(Object.entries(snapshot.inputs[type]).map(([k, t]) => [k, t === 'number' ? 0 : '']))
                )}
                value={inputs[type] ?? ''}
                onChange={(e) => setInputs({ ...inputs, [type]: e.target.value })}
              />
            )}
          </div>
        ))}
      </Section>

      <Section title="Scenarios (swap dependencies)">
        <div style={s.wrap}>
          {scenarios.map((name) => (
            <button key={name} style={s.button} onClick={() => run(() => rpc.method('scenario').invoke({ name }))}>
              {name}
            </button>
          ))}
        </div>
        <p style={s.note}>Reload with Retry or a similar action to see the new dependencies on screen.</p>
      </Section>

      <Section title="Navigate (go)">
        <div style={s.wrap}>
          {TABS.map((t) => (
            <button key={t} style={s.button} onClick={() => run(() => rpc.method('go').invoke({ href: t }))}>
              {t}
            </button>
          ))}
          <input style={s.input} value={href} onChange={(e) => setHref(e.target.value)} />
          <button style={s.button} onClick={() => run(() => rpc.method('go').invoke({ href }))}>
            Open
          </button>
        </div>
      </Section>

      <Section title="Set the state directly (hydrate)">
        <textarea style={{ ...s.pre, ...s.textarea }} value={draft} onChange={(e) => setDraft(e.target.value)} />
        <button
          style={s.button}
          onClick={() => {
            let state: unknown;
            try {
              state = JSON.parse(draft);
            } catch {
              return setError('The state is not JSON');
            }
            run(() => rpc.method('hydrate').invoke({ state }));
          }}>
          Apply
        </button>
        <p style={s.note}>This skips update, so it can set a state the app would never produce.</p>
      </Section>

      {error && <div style={s.error}>{error}</div>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={s.section}>
      <h3 style={s.title}>{title}</h3>
      {children}
    </section>
  );
}

const s: Record<string, CSSProperties> = {
  page: { padding: 12, fontFamily: 'system-ui, sans-serif', fontSize: 13, color: 'CanvasText', background: 'Canvas' },
  section: { borderBottom: '1px solid rgba(128,128,128,.25)', padding: '10px 0' },
  title: { margin: '0 0 8px', fontSize: 12, fontWeight: 600, opacity: 0.7 },
  row: { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 },
  wrap: { display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' },
  badge: { padding: '2px 6px', borderRadius: 4, background: 'rgba(128,128,128,.15)' },
  pre: {
    margin: '8px 0 0',
    padding: 8,
    maxHeight: 260,
    overflow: 'auto',
    borderRadius: 4,
    background: 'rgba(128,128,128,.1)',
    fontFamily: 'ui-monospace, monospace',
    fontSize: 12,
    whiteSpace: 'pre-wrap',
  },
  textarea: { width: '100%', boxSizing: 'border-box', minHeight: 140, border: 'none', color: 'inherit', display: 'block', marginBottom: 6 },
  button: { padding: '4px 10px', borderRadius: 4, border: '1px solid rgba(128,128,128,.4)', background: 'transparent', color: 'inherit', cursor: 'pointer', fontFamily: 'ui-monospace, monospace' },
  input: { flex: 1, minWidth: 160, padding: '4px 6px', borderRadius: 4, border: '1px solid rgba(128,128,128,.4)', background: 'transparent', color: 'inherit', fontFamily: 'ui-monospace, monospace' },
  note: { margin: '6px 0 0', fontSize: 11, opacity: 0.6 },
  error: { marginTop: 10, padding: 8, borderRadius: 4, background: 'rgba(220,38,38,.15)', color: '#dc2626' },
};
