import type { SFSymbol } from 'expo-symbols';

/** WMO weather code → SF Symbol (ones that render in color with multicolor). */
export function weatherSymbol(code: number): SFSymbol {
  if (code === 0) return 'sun.max.fill';
  if (code <= 2) return 'cloud.sun.fill';
  if (code === 3) return 'cloud.fill';
  if (code <= 48) return 'cloud.fog.fill';
  if (code <= 57) return 'cloud.drizzle.fill';
  if (code <= 67) return 'cloud.rain.fill';
  if (code <= 77) return 'cloud.snow.fill';
  if (code <= 82) return 'cloud.sun.rain.fill';
  if (code <= 86) return 'cloud.snow.fill';
  return 'cloud.bolt.rain.fill';
}

/** Fallback for Android / Web. */
export function weatherEmoji(code: number): string {
  if (code === 0) return '☀️';
  if (code <= 2) return '🌤️';
  if (code === 3) return '☁️';
  if (code <= 48) return '🌫️';
  if (code <= 67) return '🌧️';
  if (code <= 77) return '🌨️';
  if (code <= 82) return '🌦️';
  if (code <= 86) return '🌨️';
  return '⛈️';
}

/** Sky colors (top → bottom). Clear-sky colors until the weather is known. */
export function skyGradient(code?: number): string {
  const [top, bottom] =
    code === undefined || code <= 2
      ? ['#1B64B5', '#5A9FDF']
      : code <= 48
        ? ['#5A6B80', '#A3B1C2']
        : code <= 67 || (code >= 80 && code <= 82)
          ? ['#344257', '#71819A']
          : code <= 86
            ? ['#4F6A88', '#93A9C2']
            : ['#272B42', '#575D7D'];
  return `linear-gradient(180deg, ${top}, ${bottom})`;
}
