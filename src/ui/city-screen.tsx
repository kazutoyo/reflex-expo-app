import { Stack, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';

import { ForecastCard } from '@/ui/forecast-card';
import { MessageCard } from '@/ui/message-card';
import { SkyScrollView } from '@/ui/sky-scroll-view';
import { deps } from '@/platform/deps';
import { useScreen } from '@/ui/use-screen';
import { createCityScreen } from '@/core/screens/city';

/** City detail. Used by both the Search tab (/cities/[id]) and the Favorites tab (/favorites/[id]). */
export default function CityScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const [state, send] = useScreen(() => createCityScreen(deps, params));

  return (
    <SkyScrollView code={state.status === 'loaded' ? state.forecast.current.code : undefined}>
      <Stack.Title large style={{ color: 'white' }} largeStyle={{ color: 'white' }}>
        {state.status === 'loaded' ? state.city.name : ''}
      </Stack.Title>
      <Stack.Header transparent style={{ color: 'white' }} />
      {state.status === 'loaded' && (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button
            icon={state.favorite ? 'star.fill' : 'star'}
            tintColor={state.favorite ? '#FFCC00' : undefined}
            accessibilityLabel={state.favorite ? 'お気に入りから外す' : 'お気に入りに追加'}
            onPress={() => send({ type: 'ToggleFavorite' })}
          />
        </Stack.Toolbar>
      )}

      {(state.status === 'idle' || state.status === 'loading') && (
        <ActivityIndicator color="white" size="large" style={{ marginTop: 120 }} />
      )}
      {state.status === 'loaded' && (
        <>
          <Text style={styles.region}>{state.city.region}</Text>
          <ForecastCard forecast={state.forecast} />
        </>
      )}
      {state.status === 'error' && (
        <MessageCard
          icon="exclamationmark.icloud.fill"
          title="天気を取得できませんでした"
          message={state.message}
          actions={[{ label: '再試行', onPress: () => send({ type: 'Retry' }), prominent: true }]}
        />
      )}
    </SkyScrollView>
  );
}

const styles = StyleSheet.create({
  region: { color: 'rgba(255,255,255,0.75)', fontSize: 15, fontWeight: '500', marginBottom: -12 },
});
