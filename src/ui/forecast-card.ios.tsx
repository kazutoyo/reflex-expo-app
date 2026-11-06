import { Host } from '@expo/ui';
import { Divider, HStack, RNHostView, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  font,
  foregroundStyle,
  frame,
  glassEffect,
  monospacedDigit,
  padding,
} from '@expo/ui/swift-ui/modifiers';
import { Fragment } from 'react';

import { describeWeather, type Forecast } from '@/core/api';

import { WeatherSymbol } from './weather-symbol';

const white = foregroundStyle('white');
const dim = foregroundStyle({ type: 'color', color: 'rgba(255,255,255,0.7)' });

function WeatherIcon({ code, size }: { code: number; size: number }) {
  return (
    <RNHostView matchContents>
      <WeatherSymbol code={code} size={size} />
    </RNHostView>
  );
}

const formatDate = (date: string, i: number) =>
  i === 0 ? '今日' : `${Number(date.slice(5, 7))}/${Number(date.slice(8))}`;

/** Current weather (large) and the 7-day forecast (Liquid Glass card). */
export function ForecastCard({ forecast }: { forecast: Forecast }) {
  const today = forecast.daily[0];
  return (
    <Host matchContents={{ vertical: true }} style={{ alignSelf: 'stretch' }}>
      <VStack spacing={24}>
        <VStack spacing={4}>
          <WeatherIcon code={forecast.current.code} size={72} />
          <Text modifiers={[font({ size: 96, weight: 'thin' }), white]}>
            {`${Math.round(forecast.current.temperature)}°`}
          </Text>
          <Text modifiers={[font({ size: 22, weight: 'medium' }), white]}>
            {describeWeather(forecast.current.code)}
          </Text>
          {today && (
            <Text modifiers={[font({ size: 17, weight: 'medium' }), dim, monospacedDigit()]}>
              {`最高 ${Math.round(today.max)}°  最低 ${Math.round(today.min)}°`}
            </Text>
          )}
        </VStack>

        <VStack
          alignment="leading"
          spacing={12}
          modifiers={[
            padding({ all: 18 }),
            frame({ maxWidth: 10000 }),
            glassEffect({ glass: { variant: 'clear' }, shape: 'roundedRectangle', cornerRadius: 28 }),
          ]}>
          <Text modifiers={[font({ size: 13, weight: 'semibold' }), dim]}>7日間の予報</Text>
          {forecast.daily.map((d, i) => (
            <Fragment key={d.date}>
              <Divider />
              <HStack spacing={12}>
                <Text modifiers={[font({ size: 17, weight: 'medium' }), white, frame({ width: 48, alignment: 'leading' })]}>
                  {formatDate(d.date, i)}
                </Text>
                <WeatherIcon code={d.code} size={26} />
                <Text modifiers={[font({ size: 15 }), dim]}>{describeWeather(d.code)}</Text>
                <Spacer />
                <Text modifiers={[font({ size: 17, weight: 'medium' }), dim, monospacedDigit()]}>
                  {`${Math.round(d.min)}°`}
                </Text>
                <Text
                  modifiers={[
                    font({ size: 17, weight: 'semibold' }),
                    white,
                    monospacedDigit(),
                    frame({ width: 40, alignment: 'trailing' }),
                  ]}>
                  {`${Math.round(d.max)}°`}
                </Text>
              </HStack>
            </Fragment>
          ))}
        </VStack>
      </VStack>
    </Host>
  );
}
