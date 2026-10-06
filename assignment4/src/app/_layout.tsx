import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { StudentProvider } from '@/context/StudentContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const scheme = useColorScheme();

  // Hide splash on mount
  SplashScreen.hideAsync();

  return (
    <StudentProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="student/list" />
        <Stack.Screen
          name="student/detail"
          options={{ presentation: 'transparentModal', animation: 'fade' }}
        />
        <Stack.Screen
          name="student/form"
          options={{ presentation: 'card', animation: 'slide_from_bottom' }}
        />
      </Stack>
    </StudentProvider>
  );
}
