import { Stack } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';

import { ForecastCard } from '@/ui/forecast-card';
import { MessageCard } from '@/ui/message-card';
import { SkyScrollView } from '@/ui/sky-scroll-view';
import { deps } from '@/platform/deps';
import { useScreen } from '@/ui/use-screen';
import { createWeatherScreen } from '@/core/screens/weather';

export default function WeatherScreen() {
  const [state, send] = useScreen(() => createWeatherScreen(deps));

  return (
    <SkyScrollView code={state.status === 'loaded' ? state.forecast.current.code : undefined}>
      <Stack.Title large style={{ color: 'white' }} largeStyle={{ color: 'white' }}>
        {(state.status === 'loaded' && state.place) || '現在地'}
      </Stack.Title>
      <Stack.Header transparent />

      {(state.status === 'idle' || state.status === 'loading') && (
        <ActivityIndicator color="white" size="large" style={{ marginTop: 120 }} />
      )}
      {state.status === 'loaded' && (
        <>
          {state.place && <Text style={styles.here}>現在地</Text>}
          <ForecastCard forecast={state.forecast} />
        </>
      )}
      {state.status === 'permissionDenied' && (
        <MessageCard
          icon="location.slash.fill"
          title="位置情報が許可されていません"
          message="現在地の天気を表示するには、位置情報の利用を許可してください。"
          actions={[
            state.canAskAgain
              ? { label: 'もう一度許可する', onPress: () => send({ type: 'Retry' }), prominent: true }
              : { label: '設定を開く', onPress: () => send({ type: 'OpenSettings' }), prominent: true },
            { label: '都市を検索する', onPress: () => send({ type: 'OpenSearch' }) },
          ]}
        />
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
  here: { color: 'rgba(255,255,255,0.75)', fontSize: 15, fontWeight: '500', marginBottom: -12 },
});
