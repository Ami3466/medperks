import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { Font, Palette, Radius } from '@/constants/theme';
import { AppText } from './text';

function parse(v: string): Date {
  const [h, m] = v.split(':').map((n) => parseInt(n, 10));
  const d = new Date();
  d.setHours(Number.isFinite(h) ? h : 8, Number.isFinite(m) ? m : 0, 0, 0);
  return d;
}

function fmt(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Native: opens the OS time picker. (Web variant is time-field.web.tsx.) */
export function TimeField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false);
  return (
    <>
      <Pressable onPress={() => setShow(true)} style={styles.row}>
        <Ionicons name="time-outline" size={18} color={Palette.brand} />
        <AppText style={styles.text}>{value}</AppText>
        <Ionicons name="chevron-down" size={16} color={Palette.muted} />
      </Pressable>
      {show && (
        <DateTimePicker
          value={parse(value)}
          mode="time"
          is24Hour
          onChange={(_e, d) => {
            setShow(false);
            if (d) onChange(fmt(d));
          }}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F7F8FA', borderRadius: Radius.sm, paddingHorizontal: 12, height: 48 },
  text: { flex: 1, fontFamily: Font.medium, fontSize: 16, color: Palette.ink },
});
