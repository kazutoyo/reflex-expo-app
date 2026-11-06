import { Stack } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { ThemedText } from '@/ui/themed-text';
import { WeatherSymbol } from '@/ui/weather-symbol';
import { skyGradient } from '@/ui/weather-style';
import { describeWeather } from '@/core/api';
import { deps } from '@/platform/deps';
import { useScreen } from '@/ui/use-screen';
import { createFavoritesScreen, type FavoriteItem } from '@/core/screens/favorites';

export default function FavoritesScreen() {
  const [state, send] = useScreen(() => createFavoritesScreen(deps));

  return (
    <>
      <Stack.Title large>お気に入り</Stack.Title>
      <FlatList
        contentInsetAdjustmentBehavior="automatic"
        data={state.items}
        keyExtractor={(i) => String(i.city.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          state.status === 'loaded' ? (
            <ThemedText themeColor="textSecondary" style={styles.empty}>
              都市の詳細画面で ☆ を押すと、ここに並びます
            </ThemedText>
          ) : undefined
        }
        renderItem={({ item }) => (
          <FavoriteCard item={item} onPress={() => send({ type: 'Open', id: item.city.id })} />
        )}
      />
    </>
  );
}

function FavoriteCard({ item, onPress }: { item: FavoriteItem; onPress: () => void }) {
  const { city, current } = item;
  const label = current
    ? `${city.name}、${Math.round(current.temperature)}度、${describeWeather(current.code)}`
    : city.name;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.card,
        { backgroundImage: skyGradient(current?.code) },
        pressed && styles.pressed,
      ]}>
      <View style={styles.cardText}>
        <Text style={styles.name}>{city.name}</Text>
        <Text style={styles.region}>{city.region}</Text>
        {current && <Text style={styles.condition}>{describeWeather(current.code)}</Text>}
      </View>
      {!current && !item.failed && <ActivityIndicator color="white" />}
      {item.failed && <Text style={styles.region}>取得できませんでした</Text>}
      {current && (
        <View style={styles.cardRight}>
          <WeatherSymbol code={current.code} size={36} />
          <Text style={styles.temp}>{Math.round(current.temperature)}°</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, gap: 12, paddingBottom: 120 },
  empty: { paddingHorizontal: 4 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 24,
    borderCurve: 'continuous',
    minHeight: 112,
  },
  pressed: { opacity: 0.8 },
  cardText: { flex: 1, gap: 2 },
  name: { color: 'white', fontSize: 22, fontWeight: '700' },
  region: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '500' },
  condition: { color: 'white', fontSize: 15, fontWeight: '500', marginTop: 10 },
  cardRight: { alignItems: 'flex-end', gap: 4 },
  temp: { color: 'white', fontSize: 44, fontWeight: '300', fontVariant: ['tabular-nums'] },
});
