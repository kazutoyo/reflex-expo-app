// Block all network access. Inject fixtures (src/dev/fakes.ts) for anything needed.
globalThis.fetch = () => Promise.reject(new Error('テスト中のネットワークは禁止'));
