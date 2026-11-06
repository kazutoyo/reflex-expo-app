import { useColorScheme } from 'react-native';

const Colors = {
  light: { text: '#000000', textSecondary: '#60646C', backgroundElement: '#F0F0F3' },
  dark: { text: '#ffffff', textSecondary: '#B0B4BA', backgroundElement: '#212225' },
} as const;

export type ThemeColor = keyof typeof Colors.light;

/** Light / dark colors. Used on screens with the system background, such as Search and Favorites. */
export function useTheme() {
  return Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
}
