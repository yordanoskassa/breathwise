/**
 * All data stays on the device (AsyncStorage). No accounts, no cloud: a
 * child's health readings are nobody else's business.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { DangerSign } from '@/clinical/who';
import type { Tone } from '@/theme';

export type Role = 'parent' | 'chw';
export type LangCode = 'en' | 'fr' | 'es' | 'sw' | 'am';

export type Child = {
  id: string;
  name: string;
  birth: string; // ISO date
  color: string;
  createdAt: number;
};

export type Measurement = {
  id: string;
  childId: string | null;
  /** Age at measurement, months (kept even without a profile). */
  ageMonths: number;
  at: number;
  rate: number;
  method: 'camera' | 'tap';
  tone: Tone;
  confidence: number | null;
  confidenceLabel: 'high' | 'medium' | 'low' | null;
  corrected: boolean;
  countedBreaths: number;
  countedSeconds: number;
  /** Fused waveform, downsampled for storage/charting. */
  wave: number[];
  waveRate: number;
  breathTimes: number[];
  verifyTaps: number | null;
  signs: DangerSign[];
  saved: boolean;
};

type AppState = {
  hydrated: boolean;
  onboarded: boolean;
  role: Role;
  lang: LangCode;
  voice: boolean;
  haptics: boolean;
  children: Child[];
  measurements: Measurement[];
  /** Last reading, kept in memory for the result screen even if unsaved. */
  draft: Measurement | null;

  finishOnboarding: (role: Role, lang: LangCode) => void;
  setPrefs: (p: Partial<Pick<AppState, 'role' | 'lang' | 'voice' | 'haptics'>>) => void;
  upsertChild: (c: Omit<Child, 'id' | 'createdAt'> & { id?: string }) => string;
  removeChild: (id: string) => void;
  setDraft: (m: Measurement | null) => void;
  updateDraft: (patch: Partial<Measurement>) => void;
  saveDraft: () => void;
  removeMeasurement: (id: string) => void;
};

export const CHILD_COLORS = ['#3CF0C8', '#4DA8FF', '#8C7DFF', '#FF8FB1', '#FFB547', '#7EE081'];

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      onboarded: false,
      role: 'parent',
      lang: 'en',
      voice: true,
      haptics: true,
      children: [],
      measurements: [],
      draft: null,

      finishOnboarding: (role, lang) => set({ onboarded: true, role, lang }),
      setPrefs: (p) => set(p),
      upsertChild: (c) => {
        const id = c.id ?? uid();
        const existing = get().children.find((x) => x.id === id);
        const child: Child = {
          id,
          name: c.name,
          birth: c.birth,
          color: c.color,
          createdAt: existing?.createdAt ?? Date.now(),
        };
        set({
          children: existing
            ? get().children.map((x) => (x.id === id ? child : x))
            : [...get().children, child],
        });
        return id;
      },
      removeChild: (id) =>
        set({
          children: get().children.filter((c) => c.id !== id),
          measurements: get().measurements.filter((m) => m.childId !== id),
        }),
      setDraft: (m) => set({ draft: m }),
      updateDraft: (patch) => {
        const d = get().draft;
        if (!d) return;
        const next = { ...d, ...patch };
        set({
          draft: next,
          measurements: d.saved
            ? get().measurements.map((m) => (m.id === d.id ? { ...next } : m))
            : get().measurements,
        });
      },
      saveDraft: () => {
        const d = get().draft;
        if (!d || d.saved) return;
        const saved = { ...d, saved: true };
        set({ draft: saved, measurements: [saved, ...get().measurements] });
      },
      removeMeasurement: (id) => set({ measurements: get().measurements.filter((m) => m.id !== id) }),
    }),
    {
      name: 'breathwise-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ hydrated, draft, ...rest }) => rest,
      onRehydrateStorage: () => () => useApp.setState({ hydrated: true }),
    },
  ),
);
