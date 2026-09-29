import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';

import { C } from '@/theme';

type Name = ComponentProps<typeof SymbolView>['name'];

/** SF Symbol on iOS, Material Symbol on Android. */
export function Icon({
  ios,
  android,
  size = 22,
  color = C.text,
}: {
  ios: string;
  android: string;
  size?: number;
  color?: string;
}) {
  return (
    <SymbolView
      name={{ ios, android } as unknown as Name}
      size={size}
      tintColor={color}
      weight="semibold"
    />
  );
}
