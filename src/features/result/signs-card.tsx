/** IMCI danger-sign checklist; any tick escalates the verdict to "seek care". */
import { StyleSheet, View } from 'react-native';

import { DANGER_SIGNS, type DangerSign } from '@/clinical/who';
import { useT } from '@/i18n';
import { C, R, S } from '@/theme';
import { Card, Press, T } from '@/ui/core';
import { Icon } from '@/ui/icon';

export function SignsCard({ signs, onToggle }: { signs: DangerSign[]; onToggle: (s: DangerSign) => void }) {
  const t = useT();
  return (
    <Card style={{ gap: S.sm }}>
      <T v="h2">{t('r.signs.title')}</T>
      <T v="small" color={C.dim}>
        {t('r.signs.sub')}
      </T>
      <View style={{ gap: 6, marginTop: S.xs }}>
        {DANGER_SIGNS.map((s) => {
          const on = signs.includes(s);
          return (
            <Press key={s} onPress={() => onToggle(s)} style={[styles.row, on && styles.rowOn]}>
              <View style={[styles.box, on && styles.boxOn]}>
                {on ? <Icon ios="checkmark" android="check" size={13} color={C.white} /> : null}
              </View>
              <T v="small" color={on ? C.text : C.dim} style={{ flex: 1 }}>
                {t('sign.' + s)}
              </T>
            </Press>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    paddingVertical: 10,
    paddingHorizontal: S.md,
    borderRadius: R.sm,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  rowOn: { backgroundColor: C.coral + '22' },
  box: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: C.faint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: { backgroundColor: C.coral, borderColor: C.coral },
});
