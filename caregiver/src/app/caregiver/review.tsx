import { Ionicons } from '@expo/vector-icons';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Button, Card, Screen } from '@/components/ui';
import { Palette, Radius } from '@/constants/theme';
import { useStore } from '@/lib/store';

export default function ReviewDoseScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { state } = useStore();
  const dose = state.doses.find((d) => d.id === id);
  const player = useVideoPlayer(dose?.videoUri ?? null, (p) => {
    p.loop = false;
  });

  return (
    <Screen scroll edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <Ionicons name="chevron-back" size={22} color={Palette.ink} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <AppText variant="title">{t('caregiver.reviewDose')}</AppText>
          {dose ? (
            <AppText variant="caption" color={Palette.muted}>
              {dose.date} · {dose.time}
            </AppText>
          ) : null}
        </View>
      </View>

      {dose?.videoUri ? (
        <View style={styles.playerFrame}>
          <VideoView
            player={player}
            nativeControls
            contentFit="contain"
            style={styles.video}
            allowsPictureInPicture={false}
          />
        </View>
      ) : (
        <Card>
          <View style={styles.empty}>
            <Ionicons name="videocam-off" size={28} color={Palette.muted} />
            <AppText variant="heading" center>
              {t('caregiver.clipUnavailable')}
            </AppText>
            <AppText variant="caption" color={Palette.muted} center>
              {t('caregiver.clipUnavailableSub')}
            </AppText>
          </View>
        </Card>
      )}

      {dose?.verdict?.reasoning ? (
        <Card>
          <AppText variant="heading">{t('caregiver.reviewReason')}</AppText>
          <AppText variant="body" color={Palette.muted}>
            {dose.verdict.reasoning}
          </AppText>
        </Card>
      ) : null}

      {dose?.videoUri ? (
        <Button
          title={t('caregiver.replayClip')}
          tone="brand"
          leftIcon={<Ionicons name="refresh" size={18} color="#fff" />}
          onPress={() => player.replay()}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  back: {
    width: 38,
    height: 38,
    borderRadius: Radius.pill,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerFrame: {
    overflow: 'hidden',
    borderRadius: Radius.lg,
    backgroundColor: Palette.ink,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.line,
  },
  video: { width: '100%', aspectRatio: 9 / 16 },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 18 },
});
