import fs from 'node:fs/promises';

import { config } from './config.js';
import type { Verdict } from './types.js';

const MAX_INLINE_BYTES = 18 * 1024 * 1024;

function unverified(reasoning: string): Verdict {
  return {
    identity_ok: false,
    pill_present: false,
    swallow_confirmed: false,
    confidence: 0,
    reasoning,
  };
}

export async function verifyDoseVideo(videoPath?: string): Promise<Verdict> {
  if (!config.geminiApiKey) {
    return unverified('Gemini is not configured, so this dose needs caregiver review.');
  }
  if (!videoPath) {
    return unverified('No video was uploaded for this dose.');
  }

  const stat = await fs.stat(videoPath);
  if (stat.size > MAX_INLINE_BYTES) {
    return unverified('Video is too large for inline Gemini verification. Upload frame sampling is required.');
  }

  const bytes = await fs.readFile(videoPath);
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${config.geminiModel}:generateContent?key=${config.geminiApiKey}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text:
                'Return only JSON with keys identity_ok, pill_present, swallow_confirmed, confidence, reasoning. ' +
                'The task is medication adherence verification from this short dose video. Be conservative: if the pill or swallow is unclear, set swallow_confirmed false.',
            },
            {
              inline_data: {
                mime_type: 'video/mp4',
                data: bytes.toString('base64'),
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    return unverified(`Gemini verification failed: ${response.status} ${body.slice(0, 180)}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.find((p) => p.text)?.text;
  if (!text) return unverified('Gemini returned no structured verdict.');

  try {
    const parsed = JSON.parse(text) as Partial<Verdict>;
    return {
      identity_ok: Boolean(parsed.identity_ok),
      pill_present: Boolean(parsed.pill_present),
      swallow_confirmed: Boolean(parsed.swallow_confirmed),
      confidence: typeof parsed.confidence === 'number' ? Math.max(0, Math.min(1, parsed.confidence)) : 0,
      reasoning: parsed.reasoning || 'Gemini returned a verdict.',
    };
  } catch {
    return unverified(`Gemini returned invalid JSON: ${text.slice(0, 180)}`);
  }
}
