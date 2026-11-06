import { Pressable, StyleSheet, Text, View } from 'react-native';

export type MessageAction = { label: string; onPress: () => void; prominent?: boolean };

/** For Android / Web (iOS uses the Liquid Glass version in message-card.ios.tsx). icon is iOS only. */
export function MessageCard({
  title,
  message,
  actions,
}: {
  icon: string;
  title: string;
  message?: string;
  actions: MessageAction[];
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
      {actions.map((a) => (
        <Pressable
          key={a.label}
          onPress={a.onPress}
          accessibilityRole="button"
          style={[styles.button, a.prominent && styles.prominent]}>
          <Text style={styles.buttonLabel}>{a.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: 12,
    padding: 24,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  title: { color: 'white', fontSize: 20, fontWeight: '600' },
  message: { color: 'rgba(255,255,255,0.75)', fontSize: 15, textAlign: 'center' },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  prominent: { backgroundColor: '#2F80D1' },
  buttonLabel: { color: 'white', fontSize: 17, fontWeight: '600' },
});
