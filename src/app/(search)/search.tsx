import { Stack } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/ui/themed-text';
import type { City } from '@/core/api';
import { deps } from '@/platform/deps';
import { useScreen } from '@/ui/use-screen';
import { useTheme } from '@/ui/theme';
import { createSearchScreen } from '@/core/screens/search';

export default function SearchScreen() {
  const [state, send] = useScreen(() => createSearchScreen(deps));
  const searched = state.status !== 'idle' && state.query.trim() !== '';
  const cities = searched ? state.results : [];

  return (
    <>
      <Stack.Title large>検索</Stack.Title>
      <Stack.SearchBar
        placeholder="都市名（例：Tokyo）"
        autoCapitalize="none"
        onChangeText={(e) => send({ type: 'ChangeQuery', query: e.nativeEvent.text })}
        onSearchButtonPress={() => send({ type: 'Submit' })}
        onCancelButtonPress={() => send({ type: 'ChangeQuery', query: '' })}
      />
      <FlatList
        contentInsetAdjustmentBehavior="automatic"
        keyboardDismissMode="on-drag"
        data={cities}
        keyExtractor={(c) => String(c.id)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          searched ? (
            <View style={styles.header}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                検索結果
              </ThemedText>
              {state.status === 'loading' && <ActivityIndicator />}
            </View>
          ) : undefined
        }
        ListEmptyComponent={
          <ThemedText themeColor="textSecondary" style={styles.empty}>
            {state.status === 'error'
              ? `検索できませんでした：${state.error}`
              : searched
                ? '見つかりませんでした'
                : '都市名で検索して、天気を見られます'}
          </ThemedText>
        }
        renderItem={({ item }) => (
          <CityRow
            city={item}
            favorite={state.favorites.some((f) => f.id === item.id)}
            onPress={() => send({ type: 'Open', id: item.id })}
          />
        )}
      />
    </>
  );
}

function CityRow({ city, favorite, onPress }: { city: City; favorite: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${city.name}、${city.region}${favorite ? '、お気に入り' : ''}`}
      style={({ pressed }) => [styles.row, { backgroundColor: theme.backgroundElement }, pressed && styles.pressed]}>
      <SymbolView
        name={favorite ? 'star.fill' : 'mappin.circle.fill'}
        tintColor={favorite ? '#FFB800' : '#2F80D1'}
        size={28}
      />
      <View style={styles.rowText}>
        <ThemedText>{city.name}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {city.region}
        </ThemedText>
      </View>
      <SymbolView name="chevron.right" tintColor={theme.textSecondary} size={14} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, gap: 10, paddingBottom: 120 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 },
  empty: { paddingHorizontal: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 22,
    borderCurve: 'continuous',
  },
  rowText: { flex: 1 },
  pressed: { opacity: 0.6 },
});
