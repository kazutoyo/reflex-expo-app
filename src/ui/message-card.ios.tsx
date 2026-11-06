import { Host } from '@expo/ui';
import { Button, Image, Text, VStack } from '@expo/ui/swift-ui';
import {
  buttonStyle,
  controlSize,
  font,
  foregroundStyle,
  frame,
  glassEffect,
  multilineTextAlignment,
  padding,
} from '@expo/ui/swift-ui/modifiers';
import type { SFSymbol } from 'expo-symbols';

export type MessageAction = { label: string; onPress: () => void; prominent?: boolean };

/** Liquid Glass card for messages such as missing permission or errors. */
export function MessageCard({
  icon,
  title,
  message,
  actions,
}: {
  icon: SFSymbol;
  title: string;
  message?: string;
  actions: MessageAction[];
}) {
  return (
    <Host matchContents={{ vertical: true }} style={{ alignSelf: 'stretch' }}>
      <VStack
        spacing={14}
        modifiers={[
          padding({ all: 24 }),
          frame({ maxWidth: 10000 }),
          glassEffect({ glass: { variant: 'clear' }, shape: 'roundedRectangle', cornerRadius: 28 }),
        ]}>
        <Image systemName={icon} size={44} color="white" />
        <Text modifiers={[font({ size: 20, weight: 'semibold' }), foregroundStyle('white')]}>{title}</Text>
        {message && (
          <Text
            modifiers={[
              font({ size: 15 }),
              foregroundStyle({ type: 'color', color: 'rgba(255,255,255,0.75)' }),
              multilineTextAlignment('center'),
            ]}>
            {message}
          </Text>
        )}
        <VStack spacing={10} modifiers={[padding({ top: 6 })]}>
          {actions.map((a) => (
            <Button
              key={a.label}
              label={a.label}
              onPress={a.onPress}
              modifiers={[
                buttonStyle(a.prominent ? 'glassProminent' : 'glass'),
                controlSize('large'),
              ]}
            />
          ))}
        </VStack>
      </VStack>
    </Host>
  );
}
