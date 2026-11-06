import { NativeTabs } from 'expo-router/native-tabs';

export default function AppTabs() {
  return (
    <NativeTabs minimizeBehavior="onScrollDown">
      <NativeTabs.Trigger name="(weather)">
        <NativeTabs.Trigger.Label>天気</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'cloud.sun', selected: 'cloud.sun.fill' }} md="partly_cloudy_day" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(favorites)">
        <NativeTabs.Trigger.Label>お気に入り</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'star', selected: 'star.fill' }} md="star" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(search)" role="search">
        <NativeTabs.Trigger.Label>検索</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
