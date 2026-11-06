import { DarkTheme, DefaultTheme, ThemeProvider, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { focused } from '@/core/inspect';
import AppTabs from '@/ui/app-tabs';

// Expose __app only in dev builds (stripped from the production bundle)
if (__DEV__) require('@/dev/devtools');

// Without this, launching with no URL path selects the (search) tab (confirmed on a real iOS device; not reproducible in the harness)
export const unstable_settings = { anchor: '(weather)' };

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const pathname = usePathname();
  useEffect(() => {
    focused.path = pathname;
  }, [pathname]);
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AppTabs />
    </ThemeProvider>
  );
}
