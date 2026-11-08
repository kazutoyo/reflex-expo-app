export default {
  panels: [{ name: 'Reflex', source: './src/reflex-panel.tsx' }],
  integrations: ['react-native'],
  dev: {
    presets: [
      {
        name: 'City screen',
        type: 'snapshot',
        payload: {
          path: '/cities/1850147',
          name: 'City',
          state: { status: 'loaded', city: { id: 1850147, name: '東京都' }, favorite: false },
          actions: ['Appear', 'Retry', 'ToggleFavorite'],
          inputs: {},
        },
      },
      {
        name: 'Search screen',
        type: 'snapshot',
        payload: {
          path: '/search',
          name: 'Search',
          state: { status: 'idle', query: '' },
          actions: ['Appear', 'ChangeQuery', 'Submit', 'Open'],
          inputs: { ChangeQuery: { query: 'string' }, Open: { id: 'number' } },
        },
      },
    ],
  },
};
