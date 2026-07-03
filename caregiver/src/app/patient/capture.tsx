import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, Button, ProgressRing } from '@/components/ui';
import { Font, Palette, Radius } from '@/constants/theme';
import { uploadDoseVideo } from '@/lib/api';
import { useStore } from '@/lib/store';

const MAX = 60; // seconds — hard cap, hands-off
type Phase = 'idle' | 'recording' | 'processing' | 'confirmed' | 'review';

export default function Capture() {
  const { t } = useTranslation();
  const STEPS = [t('capture.step1'), t('capture.step2'), t('capture.step3')];
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const recordingDoneRef = useRef(false);
  const { recordDose, updateRecordedDose } = useStore();
  const [camPerm, requestCam] = useCameraPermissions();
  const [micPerm, requestMic] = useMicrophonePermissions();
  const [phase, setPhase] = useState<Phase>('idle');
  const [remaining, setRemaining] = useState(MAX);

  const ready = camPerm?.granted && (Platform.OS === 'web' || micPerm?.granted);

  // Countdown while recording; auto-stop at zero.
  useEffect(() => {
    if (phase !== 'recording') return;
    if (remaining <= 0) {
      stop();
      return;
    }
    const id = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, remaining]);

  async function start() {
    recordingDoneRef.current = false;
    setRemaining(MAX);
    setPhase('recording');
    if (Platform.OS !== 'web' && cameraRef.current) {
      try {
        // resolves when stopRecording() is called or maxDuration hits
        const recording = await cameraRef.current.recordAsync({ maxDuration: MAX });
        // The self-hosted API uploads the clip and calls Gemini when configured.
        finishUnverified(recording?.uri);
      } catch {
        finishUnverified();
      }
    }
  }

  function stop() {
    setPhase('processing');
    if (Platform.OS !== 'web') {
      cameraRef.current?.stopRecording();
      return;
    }
    finishUnverified();
  }

  function finishUnverified(videoUri?: string) {
    if (recordingDoneRef.current) return;
    recordingDoneRef.current = true;
    setPhase('processing');
    // TODO(live): replace this fallback with the real Gemini dose-confirmation call.
    // Until then, never award a camera-confirmed dose from an unverified recording.
    setTimeout(async () => {
      const rec = recordDose({
        status: 'flagged',
        videoUri,
        verdict: {
          identity_ok: false,
          pill_present: false,
          swallow_confirmed: false,
          confidence: 0,
          reasoning: t('capture.unverifiedReason'),
        },
      });
      try {
        const verified = await uploadDoseVideo(rec.id, videoUri);
        if (verified) {
          updateRecordedDose(rec.id, { status: verified.status, verdict: verified.verdict, videoUri: verified.videoUrl ?? videoUri });
          setPhase(verified.status === 'confirmed' ? 'confirmed' : 'review');
          return;
        }
      } catch (error) {
        console.warn('[api] video verification failed', error);
      }
      setPhase('review');
    }, 1700);
  }

  // ---- Permission gate ----------------------------------------------------
  if (!ready) {
    return (
      <SafeAreaView style={[styles.fill, styles.center, { backgroundColor: Palette.ink, padding: 28, gap: 16 }]}>
        <Ionicons name="videocam" size={48} color="#fff" />
        <AppText variant="heading" color="#fff" center>
          {t('capture.allowTitle')}
        </AppText>
        <AppText variant="body" center style={{ color: 'rgba(255,255,255,0.7)' }}>
          {t('capture.allowSub')}
        </AppText>
        <Button
          title={t('capture.allowCta')}
          tone="warm"
          onPress={async () => {
            await requestCam();
            if (Platform.OS !== 'web') await requestMic();
          }}
        />
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <AppText color="rgba(255,255,255,0.6)">{t('common.cancel')}</AppText>
        </Pressable>
      </SafeAreaView>
    );
  }

  // ---- Confirmed celebration ---------------------------------------------
  if (phase === 'confirmed') {
    return (
      <SafeAreaView style={[styles.fill, styles.center, { backgroundColor: Palette.purple, padding: 28 }]}>
        <View style={styles.celebrateMark}>
          <Ionicons name="checkmark" size={56} color={Palette.purple} />
        </View>
        <AppText variant="display" color="#fff" center style={{ marginTop: 24 }}>
          {t('patient.confirmed')}
        </AppText>
        <AppText variant="body" center style={{ color: 'rgba(255,255,255,0.85)', marginTop: 4 }}>
          {t('patient.confirmedSub')}
        </AppText>

        <View style={{ alignSelf: 'stretch', marginTop: 36 }}>
          <Button title={t('common.done')} tone="ink" variant="soft" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  // ---- Unverified fallback ------------------------------------------------
  if (phase === 'review') {
    return (
      <SafeAreaView style={[styles.fill, styles.center, { backgroundColor: Palette.ink, padding: 28 }]}>
        <View style={styles.reviewMark}>
          <Ionicons name="eye-outline" size={54} color={Palette.warm} />
        </View>
        <AppText variant="display" color="#fff" center style={{ marginTop: 24 }}>
          {t('capture.needsReviewTitle')}
        </AppText>
        <AppText variant="body" center style={{ color: 'rgba(255,255,255,0.78)', marginTop: 8 }}>
          {t('capture.needsReviewSub')}
        </AppText>

        <View style={{ alignSelf: 'stretch', marginTop: 36 }}>
          <Button title={t('common.done')} tone="warm" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  // ---- Camera + timer -----------------------------------------------------
  const stepIndex = Math.min(STEPS.length - 1, Math.floor(((MAX - remaining) / MAX) * STEPS.length));

  return (
    <View style={styles.fill}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="front" mode="video" />
      <View style={styles.scrim} />

      <SafeAreaView style={styles.fill}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color="#fff" />
          </Pressable>
          {phase === 'recording' && (
            <View style={styles.recPill}>
              <View style={styles.recDot} />
              <AppText style={{ color: '#fff', fontFamily: Font.semibold, fontSize: 13 }}>REC</AppText>
            </View>
          )}
        </View>

        {/* Step hint */}
        <View style={styles.hintWrap}>
          <AppText variant="heading" color="#fff" center>
            {phase === 'processing' ? t('capture.checking') : STEPS[stepIndex]}
          </AppText>
        </View>

        {/* Timer + control */}
        <View style={styles.bottom}>
          <ProgressRing
            size={150}
            stroke={12}
            progress={phase === 'idle' ? 1 : remaining / MAX}
            color="#fff"
            track="rgba(255,255,255,0.25)">
            {phase === 'processing' ? (
              <Ionicons name="hourglass" size={40} color="#fff" />
            ) : (
              <AppText style={{ color: '#fff', fontFamily: Font.bold, fontSize: 44 }}>
                {phase === 'idle' ? MAX : remaining}
              </AppText>
            )}
          </ProgressRing>

          {phase === 'idle' && (
            <Pressable onPress={start} style={({ pressed }) => [styles.recordBtn, pressed && { transform: [{ scale: 0.94 }] }]}>
              <View style={styles.recordInner} />
            </Pressable>
          )}
          {phase === 'recording' && (
            <Pressable onPress={stop} style={({ pressed }) => [styles.stopBtn, pressed && { transform: [{ scale: 0.94 }] }]}>
              <Ionicons name="stop" size={26} color="#fff" />
              <AppText style={{ color: '#fff', fontFamily: Font.semibold }}>{t('capture.doneRecording')}</AppText>
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  scrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.28)' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingTop: 8 },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.pill,
  },
  recDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: Palette.missed },
  hintWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  bottom: { alignItems: 'center', gap: 26, paddingBottom: 28 },
  recordBtn: {
    width: 74,
    height: 74,
    borderRadius: Radius.pill,
    borderWidth: 5,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordInner: { width: 54, height: 54, borderRadius: Radius.pill, backgroundColor: Palette.warm },
  stopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: Palette.missed,
    paddingHorizontal: 24,
    height: 56,
    borderRadius: Radius.pill,
  },
  celebrateMark: {
    width: 110,
    height: 110,
    borderRadius: Radius.pill,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewMark: {
    width: 110,
    height: 110,
    borderRadius: Radius.pill,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
