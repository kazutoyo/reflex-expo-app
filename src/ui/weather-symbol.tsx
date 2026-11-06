import { SymbolView } from 'expo-symbols';
import { Text } from 'react-native';

import { weatherEmoji, weatherSymbol } from './weather-style';

/** Multicolor SF Symbol. Emoji on Android / Web. */
export function WeatherSymbol({ code, size }: { code: number; size: number }) {
  return (
    <SymbolView
      name={weatherSymbol(code)}
      type="multicolor"
      size={size}
      fallback={<Text style={{ fontSize: size * 0.8 }}>{weatherEmoji(code)}</Text>}
    />
  );
}
