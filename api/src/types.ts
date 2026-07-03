import { z } from 'zod';

export const verdictSchema = z.object({
  identity_ok: z.boolean(),
  pill_present: z.boolean(),
  swallow_confirmed: z.boolean(),
  confidence: z.number().min(0).max(1),
  reasoning: z.string().optional(),
});

export const doseSchema = z.object({
  id: z.string().min(1),
  date: z.string().min(1),
  time: z.string().min(1),
  status: z.enum(['confirmed', 'missed', 'manual', 'flagged']),
  verdict: verdictSchema.optional(),
  videoUri: z.string().optional(),
});

export const appStateSchema = z.object({
  role: z.enum(['caregiver', 'patient']).nullable(),
  patientName: z.string().nullable(),
  medication: z.unknown(),
  schedule: z.unknown(),
  prizes: z.unknown(),
  doses: z.array(doseSchema),
});

export const syncStateSchema = z.object({
  deviceId: z.string().min(8),
  syncSecret: z.string().min(16),
  state: appStateSchema,
});

export type Verdict = z.infer<typeof verdictSchema>;
