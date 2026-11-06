import { Stack } from 'expo-router';

export const unstable_settings = { anchor: 'favorites' };

export default function FavoritesLayout() {
  return <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }} />;
}
