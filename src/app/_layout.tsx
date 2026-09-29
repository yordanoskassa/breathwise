import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { initPurchases } from '@/purchases';
import { useApp } from '@/store/app';
import { C } from '@/theme';

SplashScreen.preventAutoHideAsync();

const theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: C.bg, card: C.bg, primary: C.teal, text: C.text, border: C.border },
};

export default function RootLayout() {
  const hydrated = useApp((s) => s.hydrated);

  useEffect(() => {
    void initPurchases();
  }, []);

  useEffect(() => {
    if (hydrated) void SplashScreen.hideAsync();
  }, [hydrated]);

  if (!hydrated) return null;

  return (
    <ThemeProvider value={theme}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        <Stack.Screen name="measure" options={{ animation: 'slide_from_bottom', gestureEnabled: false }} />
        <Stack.Screen name="tap" options={{ animation: 'slide_from_bottom', gestureEnabled: false }} />
        <Stack.Screen name="result" options={{ animation: 'fade' }} />
        <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
        <Stack.Screen name="child" options={{ presentation: 'formSheet', sheetAllowedDetents: [0.62, 0.9], sheetGrabberVisible: true, sheetCornerRadius: 28 }} />
        <Stack.Screen name="how" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
