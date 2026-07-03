import AsyncStorage from '@react-native-async-storage/async-storage';

import { publicEnv } from '@/lib/public-env';
import type { DoseRecord, StoreState, Verdict } from '@/lib/store';

const DEVICE_KEY = 'cc.device.id';
const SECRET_KEY = 'cc.sync.secret';

export const API_URL = publicEnv('EXPO_PUBLIC_API_URL')?.replace(/\/$/, '') ?? '';
export const hasApiConfig = Boolean(API_URL);

export async function getDeviceId(): Promise<string> {
  const existing = await AsyncStorage.getItem(DEVICE_KEY);
  if (existing) return existing;
  const id = `dev_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
  await AsyncStorage.setItem(DEVICE_KEY, id);
  return id;
}

async function getSyncSecret(): Promise<string> {
  const existing = await AsyncStorage.getItem(SECRET_KEY);
  if (existing) return existing;
  const bytes = Array.from({ length: 4 }, () => Math.random().toString(36).slice(2)).join('');
  const secret = `sec_${Date.now()}_${bytes}`;
  await AsyncStorage.setItem(SECRET_KEY, secret);
  return secret;
}

async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  if (!API_URL) throw new Error('EXPO_PUBLIC_API_URL is not set.');
  const secret = await getSyncSecret();
  const headers = new Headers(init?.headers);
  headers.set('x-sync-secret', secret);
  return fetch(`${API_URL}${path}`, { ...init, headers });
}

export async function syncState(state: StoreState): Promise<void> {
  if (!API_URL) return;
  const deviceId = await getDeviceId();
  const syncSecret = await getSyncSecret();
  const res = await apiFetch('/state', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ deviceId, syncSecret, state }),
  });
  if (!res.ok) throw new Error(`State sync failed: ${res.status}`);
}

export async function postDose(dose: DoseRecord): Promise<void> {
  if (!API_URL) return;
  const deviceId = await getDeviceId();
  const res = await apiFetch(`/doses/${encodeURIComponent(deviceId)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(dose),
  });
  if (!res.ok) throw new Error(`Dose sync failed: ${res.status}`);
}

export async function uploadDoseVideo(
  doseId: string,
  uri?: string,
): Promise<{ status: DoseRecord['status']; verdict: Verdict; videoUrl?: string } | null> {
  if (!API_URL || !uri) return null;
  const body = new FormData();
  body.append('file', {
    uri,
    name: `${doseId}.mp4`,
    type: 'video/mp4',
  } as unknown as Blob);

  const upload = await apiFetch(`/doses/${encodeURIComponent(doseId)}/video`, {
    method: 'POST',
    body,
  });
  if (!upload.ok) throw new Error(`Video upload failed: ${upload.status}`);
  const uploaded = (await upload.json()) as { videoUrl?: string };

  const verify = await apiFetch(`/doses/${encodeURIComponent(doseId)}/verify`, { method: 'POST' });
  if (!verify.ok) throw new Error(`Video verification failed: ${verify.status}`);
  const verified = (await verify.json()) as { status: DoseRecord['status']; verdict: Verdict };
  return { ...verified, videoUrl: uploaded.videoUrl };
}

export async function createDonationCheckout(input: {
  amount: number;
  plan: 'monthly' | 'oneTime';
  successUrl: string;
  cancelUrl: string;
}): Promise<string> {
  const res = await apiFetch('/stripe/checkout', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Donation checkout failed: ${res.status}`);
  const body = (await res.json()) as { url?: string };
  if (!body.url) throw new Error('Donation checkout did not return a URL.');
  return body.url;
}
