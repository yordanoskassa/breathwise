/** Voice prompts and haptics, both respecting the user's settings. */
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';

import { LANGUAGES, t, type Vars } from '@/i18n';
import { useApp } from '@/store/app';

export function say(key: string, vars?: Vars): void {
  const { voice, lang } = useApp.getState();
  if (!voice) return;
  const language = LANGUAGES.find((l) => l.code === lang)?.speech ?? 'en-US';
  Speech.stop();
  Speech.speak(t(key, vars), { language, rate: 0.95, pitch: 1.0 });
}

export function stopVoice(): void {
  Speech.stop();
}

export function breathPulse(): void {
  if (!useApp.getState().haptics) return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
}

export function tick(): void {
  void Haptics.selectionAsync();
}

export function success(): void {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

export function warn(): void {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}
