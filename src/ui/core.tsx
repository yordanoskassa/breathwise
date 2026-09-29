/** Text, buttons, cards and screen chrome shared by every screen. */
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  StyleSheet,
  Text,
  type TextProps,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { tick } from '@/feedback';
import { C, GRADIENT, R, S } from '@/theme';

type Variant = 'hero' | 'display' | 'title' | 'h2' | 'body' | 'small' | 'label' | 'num';

const VARIANTS: Record<Variant, TextStyle> = {
  hero: { fontSize: 96, fontWeight: '800', letterSpacing: -4, fontVariant: ['tabular-nums'] },
  display: { fontSize: 34, fontWeight: '800', letterSpacing: -0.8, lineHeight: 40 },
  title: { fontSize: 24, fontWeight: '700', letterSpacing: -0.4, lineHeight: 30 },
  h2: { fontSize: 17, fontWeight: '700', letterSpacing: -0.2 },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 23 },
  small: { fontSize: 13, fontWeight: '500', lineHeight: 18 },
  label: { fontSize: 12, fontWeight: '700', letterSpacing: 1.1, textTransform: 'uppercase' },
  num: { fontSize: 22, fontWeight: '800', fontVariant: ['tabular-nums'], letterSpacing: -0.5 },
};

export function T({
  v = 'body',
  color = C.text,
  style,
  ...rest
}: TextProps & { v?: Variant; color?: string }) {
  return <Text {...rest} style={[VARIANTS[v], { color }, style]} />;
}

export function Screen({
  children,
  edges = ['top'],
  style,
}: {
  children: ReactNode;
  edges?: ('top' | 'bottom')[];
  style?: ViewStyle;
}) {
  return (
    <View style={styles.fill}>
      <LinearGradient colors={GRADIENT.aurora} style={StyleSheet.absoluteFill} />
      <SafeAreaView edges={edges} style={[styles.fill, style]}>
        {children}
      </SafeAreaView>
    </View>
  );
}

export function Card({ children, style, glow }: { children: ReactNode; style?: ViewStyle; glow?: string }) {
  return (
    <View
      style={[
        styles.card,
        glow ? { borderColor: glow + '55', shadowColor: glow, shadowOpacity: 0.35, shadowRadius: 18 } : null,
        style,
      ]}>
      {children}
    </View>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Pressable that squishes slightly and ticks — every tap feels physical. */
export function Press({ style, onPressIn, onPressOut, onPress, ...rest }: PressableProps & { style?: ViewStyle | ViewStyle[] }) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(e) => {
        scale.value = withSpring(0.96, { damping: 18, stiffness: 400 });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, { damping: 14, stiffness: 300 });
        onPressOut?.(e);
      }}
      onPress={(e) => {
        tick();
        onPress?.(e);
      }}
      style={[anim, style as ViewStyle]}
    />
  );
}

export function Button({
  label,
  onPress,
  kind = 'primary',
  icon,
  loading,
  disabled,
  style,
  colors,
}: {
  label: string;
  onPress?: () => void;
  kind?: 'primary' | 'secondary' | 'ghost';
  icon?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  colors?: readonly [string, string];
}) {
  const content = (
    <View style={styles.btnRow}>
      {loading ? <ActivityIndicator color={kind === 'primary' ? C.bg : C.text} /> : icon}
      <T v="h2" color={kind === 'primary' ? C.bg : C.text}>
        {label}
      </T>
    </View>
  );
  return (
    <Press
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.btn, kind !== 'primary' && styles.btnSecondary, kind === 'ghost' && styles.btnGhost, { opacity: disabled ? 0.5 : 1 }, style ?? {}]}>
      {kind === 'primary' ? (
        <LinearGradient colors={colors ?? GRADIENT.breath} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.btnFill}>
          {content}
        </LinearGradient>
      ) : (
        <View style={styles.btnFill}>{content}</View>
      )}
    </Press>
  );
}

export function Pill({ label, color = C.teal, dot }: { label: string; color?: string; dot?: boolean }) {
  return (
    <View style={[styles.pill, { backgroundColor: color + '22', borderColor: color + '55' }]}>
      {dot ? <View style={[styles.dot, { backgroundColor: color }]} /> : null}
      <T v="small" color={color} style={{ fontWeight: '700' }}>
        {label}
      </T>
    </View>
  );
}

export function Row({ children, gap = S.md, style }: { children: ReactNode; gap?: number; style?: ViewStyle }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: C.bg },
  card: {
    backgroundColor: C.surface,
    borderRadius: R.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
    padding: S.lg,
    shadowOffset: { width: 0, height: 0 },
  },
  btn: { borderRadius: R.pill, overflow: 'hidden' },
  btnSecondary: { backgroundColor: C.surfaceHi, borderWidth: StyleSheet.hairlineWidth, borderColor: C.borderHi },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 0 },
  btnFill: { paddingVertical: 17, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center' },
  btnRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: R.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignSelf: 'flex-start',
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
});
