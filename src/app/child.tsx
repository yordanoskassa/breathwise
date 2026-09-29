/** Add / edit a child. Age is entered directly; we store an approximate birth date. */
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { ageInMonths, formatAge, thresholdFor } from '@/clinical/who';
import { useT } from '@/i18n';
import { CHILD_COLORS, useApp } from '@/store/app';
import { C, R, S } from '@/theme';
import { Button, Press, Row, T } from '@/ui/core';
import { Icon } from '@/ui/icon';

function birthFromMonths(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString().slice(0, 10);
}

export default function ChildSheet() {
  const t = useT();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existing = useApp((s) => s.children.find((c) => c.id === id));
  const upsert = useApp((s) => s.upsertChild);
  const remove = useApp((s) => s.removeChild);
  const [name, setName] = useState(existing?.name ?? '');
  const [months, setMonths] = useState(existing ? ageInMonths(existing.birth) : 18);
  const [color, setColor] = useState(existing?.color ?? CHILD_COLORS[useApp.getState().children.length % CHILD_COLORS.length]);

  const step = months < 24 ? 1 : 12;
  const th = thresholdFor(months);

  return (
    <View style={styles.sheet}>
      <T v="title">{existing ? t('c.edit') : t('c.new')}</T>

      <View style={{ gap: S.sm }}>
        <T v="label" color={C.dim}>
          {t('c.name')}
        </T>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={t('c.namePh')}
          placeholderTextColor={C.faint}
          style={styles.input}
          autoFocus={!existing}
          autoCorrect={false}
          autoCapitalize="words"
          returnKeyType="done"
        />
      </View>

      <View style={{ gap: S.sm }}>
        <T v="label" color={C.dim}>
          {t('c.birth')}
        </T>
        <Row style={styles.stepper}>
          <Press onPress={() => setMonths((m) => Math.max(0, m - step))} style={styles.stepBtn}>
            <Icon ios="minus" android="remove" size={18} />
          </Press>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <T v="num">{formatAge(months, t)}</T>
            <T v="small" color={th.who ? C.teal : C.dim}>
              {(th.who ? t('r.who') : t('r.ref')) + ` · ${th.fastAt}/min`}
            </T>
          </View>
          <Press onPress={() => setMonths((m) => Math.min(240, m + step))} style={styles.stepBtn}>
            <Icon ios="plus" android="add" size={18} />
          </Press>
        </Row>
      </View>

      <Row gap={S.md}>
        {CHILD_COLORS.map((c) => (
          <Press key={c} onPress={() => setColor(c)} style={[styles.swatch, { backgroundColor: c }, color === c && styles.swatchOn]} />
        ))}
      </Row>

      <Button
        label={t('common.save')}
        disabled={name.trim().length === 0}
        onPress={() => {
          upsert({ id: existing?.id, name: name.trim(), birth: birthFromMonths(months), color });
          router.back();
        }}
      />
      {existing ? (
        <Button
          label={t('c.delete')}
          kind="ghost"
          onPress={() => {
            remove(existing.id);
            router.back();
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: C.surfaceSolid, padding: S.xl, gap: S.xl },
  input: {
    backgroundColor: C.surfaceHi,
    borderRadius: R.md,
    paddingHorizontal: S.lg,
    paddingVertical: 14,
    color: C.text,
    fontSize: 17,
  },
  stepper: { backgroundColor: C.surfaceHi, borderRadius: R.md, padding: S.sm },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatch: { width: 32, height: 32, borderRadius: 16 },
  swatchOn: { borderWidth: 3, borderColor: C.white },
});
