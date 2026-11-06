import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { skyGradient } from './weather-style';

/**
 * ScrollView with a sky gradient background.
 * Place it as the screen's first child so the navigation bar's large title collapses.
 */
export function SkyScrollView({ code, children }: { code?: number; children: ReactNode }) {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundImage: skyGradient(code) }}
      contentContainerStyle={styles.content}>
      <StatusBar style="light" />
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, alignItems: 'center', gap: 24, padding: 20, paddingBottom: 120 },
});
