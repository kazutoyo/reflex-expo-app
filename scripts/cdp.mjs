// Call the dev build's __app over CDP (Metro's debugger). Evaluates expressions in order over one connection and prints results and timings.
//   node scripts/cdp.mjs [--port 8082] [--device "iPhone 17 Pro"] "__app.ls()" "__app.do('Retry')" ...
const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(name);
  return i < 0 ? def : args.splice(i, 2)[1];
};
const port = opt('--port', '8082');
const device = opt('--device', 'iPhone 17 Pro');

const targets = await (await fetch(`http://localhost:${port}/json/list`)).json();
const target = targets.find((t) => t.title.includes(device));
if (!target) throw new Error(`${device} のターゲットがない: ${targets.map((t) => t.title).join(', ')}`);

// Metro immediately closes connections whose Origin isn't http://127.0.0.1:<port> (localhost got dropped with 1006)
const ws = new WebSocket(target.webSocketDebuggerUrl, { headers: { Origin: `http://127.0.0.1:${port}` } });
await new Promise((ok, ng) => ((ws.onopen = ok), (ws.onerror = ng)));
let id = 0;
const pending = new Map();
ws.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  pending.get(msg.id)?.(msg);
};
const evaluate = (expression) =>
  new Promise((resolve) => {
    pending.set(++id, resolve);
    ws.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression, returnByValue: true } }));
  });

// Hermes doesn't support awaitPromise. For a Promise, have it store the result on globalThis and fetch it
const run = async (expr) => {
  const wrapped = `(() => { const v = (${expr}); if (!(v && typeof v.then === 'function')) return { done: true, v };
    globalThis.__cdp = { done: false }; v.then((v) => (globalThis.__cdp = { done: true, v }), (e) => (globalThis.__cdp = { done: true, e: String(e) }));
    return globalThis.__cdp; })()`;
  let { result } = await evaluate(wrapped);
  while (result.result?.value && !result.result.value.done) {
    await new Promise((r) => setTimeout(r, 5));
    ({ result } = await evaluate('globalThis.__cdp'));
  }
  return result.exceptionDetails?.exception?.description ?? (result.result.value.e ?? JSON.stringify(result.result.value.v));
};

for (const expr of args) {
  const t0 = performance.now();
  const value = await run(expr);
  const ms = (performance.now() - t0).toFixed(0);
  console.log(`$ ${expr}  (${ms}ms)\n  ${value}`);
}
ws.close();
process.exit(0);
