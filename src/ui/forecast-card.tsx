import { StyleSheet, Text, View } from 'react-native';

import { describeWeather, type Forecast } from '@/core/api';

import { weatherEmoji } from './weather-style';

/** For Android / Web (iOS uses the Liquid Glass version in forecast-card.ios.tsx). */
export function ForecastCard({ forecast }: { forecast: Forecast }) {
  const today = forecast.daily[0];
  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.icon}>{weatherEmoji(forecast.current.code)}</Text>
        <Text style={styles.temp}>{Math.round(forecast.current.temperature)}°</Text>
        <Text style={styles.condition}>{describeWeather(forecast.current.code)}</Text>
        {today && (
          <Text style={styles.dim}>
            最高 {Math.round(today.max)}°  最低 {Math.round(today.min)}°
          </Text>
        )}
      </View>
      <View style={styles.card}>
        <Text style={[styles.dim, styles.caption]}>7日間の予報</Text>
        {forecast.daily.map((d, i) => (
          <View key={d.date} style={styles.row}>
            <Text style={[styles.white, styles.date]}>
              {i === 0 ? '今日' : `${Number(d.date.slice(5, 7))}/${Number(d.date.slice(8))}`}
            </Text>
            <Text style={styles.rowIcon}>{weatherEmoji(d.code)}</Text>
            <Text style={[styles.dim, styles.label]}>{describeWeather(d.code)}</Text>
            <Text style={styles.dim}>{Math.round(d.min)}°</Text>
            <Text style={[styles.white, styles.max]}>{Math.round(d.max)}°</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignSelf: 'stretch', gap: 24 },
  hero: { alignItems: 'center', gap: 4 },
  icon: { fontSize: 64 },
  temp: { fontSize: 96, fontWeight: '200', color: 'white' },
  condition: { fontSize: 22, fontWeight: '500', color: 'white' },
  white: { color: 'white', fontSize: 17, fontWeight: '500' },
  dim: { color: 'rgba(255,255,255,0.7)', fontSize: 17, fontWeight: '500' },
  caption: { fontSize: 13, fontWeight: '600' },
  card: { padding: 18, borderRadius: 28, gap: 14, backgroundColor: 'rgba(255,255,255,0.15)' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  date: { width: 48 },
  rowIcon: { fontSize: 22 },
  label: { flex: 1, fontSize: 15 },
  max: { width: 40, textAlign: 'right' },
});
