/** Horizontal child picker with each child's latest reading. */
import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ago } from '@/clinical/ago';
import { ageInMonths, formatAge } from '@/clinical/who';
import { useT } from '@/i18n';
import { usePro } from '@/purchases';
import { useApp } from '@/store/app';
import { C, R, S, toneColor } from '@/theme';
import { Press, T } from '@/ui/core';
import { Icon } from '@/ui/icon';

export function ChildrenRow({ selected, onSelect }: { selected: string | null; onSelect: (id: string) => void }) {
  const t = useT();
  const pro = usePro();
  const children = useApp((s) => s.children);
  const measurements = useApp((s) => s.measurements);

  const addChild = () => {
    if (!pro && children.length >= 1) router.push('/paywall');
    else router.push('/child');
  };

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {children.map((c) => {
        const last = measurements.find((m) => m.childId === c.id);
        const on = selected === c.id;
        return (
          <Press
            key={c.id}
            onPress={() => onSelect(c.id)}
            onLongPress={() => router.push({ pathname: '/child', params: { id: c.id } })}
            style={[styles.card, on && { borderColor: c.color, backgroundColor: c.color + '18' }]}>
            <View style={[styles.avatar, { backgroundColor: c.color + '30', borderColor: c.color }]}>
              <T v="h2" color={c.color}>
                {c.name.slice(0, 1).toUpperCase()}
              </T>
            </View>
            <T v="h2" numberOfLines={1}>
              {c.name}
            </T>
            <T v="small" color={C.dim}>
              {formatAge(ageInMonths(c.birth), t)}
            </T>
            {last ? (
              <View style={styles.last}>
                <View style={[styles.dot, { backgroundColor: toneColor(last.tone) }]} />
                <T v="small" color={C.dim} numberOfLines={1}>
                  {t('home.last', { rate: last.rate, ago: ago(last.at, t) })}
                </T>
              </View>
            ) : (
              <T v="small" color={C.faint}>
                {t('home.noReading')}
              </T>
            )}
          </Press>
        );
      })}
      <Press onPress={addChild} style={[styles.card, styles.add]}>
        <View style={[styles.avatar, { borderColor: C.faint, borderStyle: 'dashed' }]}>
          <Icon ios={!pro && children.length >= 1 ? 'lock.fill' : 'plus'} android="add" size={18} color={C.dim} />
        </View>
        <T v="h2" color={C.dim}>
          {t('home.addChild')}
        </T>
      </Press>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: S.md, paddingHorizontal: S.lg },
  card: {
    width: 150,
    padding: S.md,
    gap: 4,
    borderRadius: R.md,
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  add: { justifyContent: 'center' },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  last: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4 },
});
