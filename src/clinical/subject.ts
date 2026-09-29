import { useLocalSearchParams } from 'expo-router';

import { useApp } from '@/store/app';

import { ageInMonths } from './who';

/** Who is being measured: a saved child (`?child=id`) or an age band (`?age=months`). */
export function useSubject() {
  const params = useLocalSearchParams<{ child?: string; age?: string }>();
  const child = useApp((s) => s.children.find((c) => c.id === params.child) ?? null);
  const ageMonths = child ? ageInMonths(child.birth) : Number(params.age ?? 30);
  return { child, childId: child?.id ?? null, ageMonths };
}
