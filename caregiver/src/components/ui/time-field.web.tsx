import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TextInput, View } from 'react-native';

import { Font, Palette, Radius } from '@/constants/theme';

/** Web: plain HH:MM text input (the native picker isn't available on web). */
export function TimeField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <View style={styles.row}>
      <Ionicons name="time-outline" size={18} color={Palette.brand} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="08:00"
        placeholderTextColor={Palette.muted}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F7F8FA', borderRadius: Radius.sm, paddingHorizontal: 12, height: 48 },
  input: { flex: 1, fontFamily: Font.medium, fontSize: 16, color: Palette.ink },
});
