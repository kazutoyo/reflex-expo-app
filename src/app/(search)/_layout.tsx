import { Stack } from 'expo-router';

export const unstable_settings = { anchor: 'search' };

export default function SearchLayout() {
  return <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }} />;
}
