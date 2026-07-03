import fs from 'node:fs/promises';
import path from 'node:path';

import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import bcrypt from 'bcryptjs';
import Fastify from 'fastify';
import rawBody from 'fastify-raw-body';
import jwt from 'jsonwebtoken';
import Stripe from 'stripe';
import { z } from 'zod';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { config } from './config.js';
import { query } from './db.js';
import { verifyDoseVideo } from './gemini.js';
import { doseSchema, syncStateSchema } from './types.js';

const server = Fastify({ logger: true });
const stripe = config.stripeSecretKey ? new Stripe(config.stripeSecretKey) : null;
const r2 = config.r2.endpoint
  ? new S3Client({
      region: 'auto',
      endpoint: config.r2.endpoint,
      credentials: { accessKeyId: config.r2.accessKeyId, secretAccessKey: config.r2.secretAccessKey },
    })
  : null;

await fs.mkdir(config.videoStorageDir, { recursive: true });

function syncSecret(request: { headers: Record<string, string | string[] | undefined> }): string | undefined {
  const value = request.headers['x-sync-secret'];
  return Array.isArray(value) ? value[0] : value;
}

async function assertDeviceAccess(deviceId: string, secret: string | undefined): Promise<boolean> {
  if (!secret) return false;
  const result = await query<{ ok: boolean }>(
    'select sync_secret = $2 as ok from app_states where device_id = $1',
    [deviceId, secret],
  );
  return Boolean(result.rows[0]?.ok);
}

async function assertDoseAccess(doseId: string, secret: string | undefined): Promise<boolean> {
  if (!secret) return false;
  const result = await query<{ ok: boolean }>(
    `
      select app_states.sync_secret = $2 as ok
      from doses
      join app_states on app_states.device_id = doses.device_id
      where doses.id = $1
    `,
    [doseId, secret],
  );
  return Boolean(result.rows[0]?.ok);
}

await server.register(cors, {
  origin: config.webOrigin === '*' ? true : config.webOrigin.split(',').map((v) => v.trim()),
});
await server.register(rawBody, {
  field: 'rawBody',
  global: false,
  encoding: false,
  runFirst: true,
  routes: ['/stripe/webhook'],
});
await server.register(multipart, { limits: { fileSize: 80 * 1024 * 1024 } });
await server.register(fastifyStatic, {
  root: path.resolve(config.videoStorageDir),
  prefix: '/videos/',
  decorateReply: false,
});

server.get('/health', async () => ({ ok: true }));

server.get('/config', async () => ({
  geminiConfigured: Boolean(config.geminiApiKey),
  stripeConfigured: Boolean(config.stripeSecretKey),
  androidDownloadConfigured: Boolean(r2),
}));

// Android APK download: presign a short-lived R2 URL and redirect. Keeps the
// bucket private, no public-access toggle, and R2 egress is free.
server.get('/download/android', async (request, reply) => {
  if (!r2) return reply.code(503).send({ error: 'downloads_not_configured' });
  const url = await getSignedUrl(
    r2,
    new GetObjectCommand({
      Bucket: config.r2.bucket,
      Key: config.r2.apkKey,
      ResponseContentType: 'application/vnd.android.package-archive',
      ResponseContentDisposition: 'attachment; filename="medperks.apk"',
    }),
    { expiresIn: 300 },
  );
  return reply.redirect(url);
});

// ── Auth: standard email/password sign up + sign in ──────────────────────────
function issueToken(user: { id: string; email: string }): string {
  return jwt.sign({ sub: user.id, email: user.email }, config.jwtSecret, { expiresIn: '30d' });
}

server.post('/auth/signup', async (request, reply) => {
  const body = z
    .object({
      name: z.string().trim().min(1).max(120).optional(),
      email: z.string().email(),
      password: z.string().min(8).max(200),
    })
    .parse(request.body);
  const email = body.email.toLowerCase().trim();

  const existing = await query('select id from users where email = $1', [email]);
  if (existing.rowCount) return reply.code(409).send({ error: 'email_taken' });

  const passwordHash = await bcrypt.hash(body.password, 10);
  const result = await query<{ id: string }>(
    'insert into users (email, name, password_hash) values ($1, $2, $3) returning id',
    [email, body.name ?? null, passwordHash],
  );
  const user = { id: result.rows[0].id, email };
  return reply.code(201).send({ token: issueToken(user), user: { ...user, name: body.name ?? null } });
});

server.post('/auth/login', async (request, reply) => {
  const body = z
    .object({
      email: z.string().email(),
      password: z.string().min(1),
    })
    .parse(request.body);
  const email = body.email.toLowerCase().trim();

  const result = await query<{ id: string; name: string | null; password_hash: string }>(
    'select id, name, password_hash from users where email = $1',
    [email],
  );
  if (!result.rowCount) return reply.code(401).send({ error: 'invalid_credentials' });

  const row = result.rows[0];
  const ok = await bcrypt.compare(body.password, row.password_hash);
  if (!ok) return reply.code(401).send({ error: 'invalid_credentials' });

  const user = { id: row.id, email };
  return { token: issueToken(user), user: { ...user, name: row.name } };
});

server.get('/auth/me', async (request, reply) => {
  const header = request.headers['authorization'];
  const token = typeof header === 'string' && header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return reply.code(401).send({ error: 'missing_token' });
  try {
    const payload = jwt.verify(token, config.jwtSecret) as { sub: string; email: string };
    const result = await query<{ id: string; email: string; name: string | null }>(
      'select id, email, name from users where id = $1',
      [payload.sub],
    );
    if (!result.rowCount) return reply.code(401).send({ error: 'invalid_token' });
    return { user: result.rows[0] };
  } catch {
    return reply.code(401).send({ error: 'invalid_token' });
  }
});

server.get('/state/:deviceId', async (request, reply) => {
  const params = z.object({ deviceId: z.string().min(8) }).parse(request.params);
  if (!(await assertDeviceAccess(params.deviceId, syncSecret(request)))) {
    return reply.code(401).send({ error: 'unauthorized' });
  }
  const result = await query<{ payload: unknown }>('select payload from app_states where device_id = $1', [params.deviceId]);
  if (!result.rowCount) return reply.code(404).send({ error: 'state_not_found' });
  return result.rows[0].payload;
});

server.put('/state', async (request) => {
  const body = syncStateSchema.parse(request.body);
  const saved = await query(
    `
      insert into app_states (device_id, sync_secret, role, payload, updated_at)
      values ($1, $2, $3, $4, now())
      on conflict (device_id)
      do update set role = excluded.role, payload = excluded.payload, updated_at = now()
      where app_states.sync_secret = excluded.sync_secret
      returning device_id
    `,
    [body.deviceId, body.syncSecret, body.state.role, JSON.stringify(body.state)],
  );
  if (!saved.rowCount) {
    throw Object.assign(new Error('unauthorized'), { statusCode: 401 });
  }

  for (const dose of body.state.doses) {
    await query(
      `
        insert into doses (id, device_id, date, time, status, verdict, video_path, updated_at)
        values ($1, $2, $3, $4, $5, $6, null, now())
        on conflict (id)
        do update set date = excluded.date, time = excluded.time, status = excluded.status,
          verdict = excluded.verdict, updated_at = now()
      `,
      [dose.id, body.deviceId, dose.date, dose.time, dose.status, JSON.stringify(dose.verdict ?? null)],
    );
  }

  return { ok: true };
});

server.post('/doses/:deviceId', async (request) => {
  const params = z.object({ deviceId: z.string().min(8) }).parse(request.params);
  if (!(await assertDeviceAccess(params.deviceId, syncSecret(request)))) {
    throw Object.assign(new Error('unauthorized'), { statusCode: 401 });
  }
  const dose = doseSchema.parse(request.body);
  await query(
    `
      insert into doses (id, device_id, date, time, status, verdict, updated_at)
      values ($1, $2, $3, $4, $5, $6, now())
      on conflict (id)
      do update set date = excluded.date, time = excluded.time, status = excluded.status,
        verdict = excluded.verdict, updated_at = now()
    `,
    [dose.id, params.deviceId, dose.date, dose.time, dose.status, JSON.stringify(dose.verdict ?? null)],
  );
  return { ok: true };
});

server.post('/doses/:doseId/video', async (request, reply) => {
  const params = z.object({ doseId: z.string().min(1) }).parse(request.params);
  if (!(await assertDoseAccess(params.doseId, syncSecret(request)))) {
    return reply.code(401).send({ error: 'unauthorized' });
  }
  const file = await request.file();
  if (!file) return reply.code(400).send({ error: 'missing_file' });

  const ext = file.mimetype === 'video/quicktime' ? 'mov' : 'mp4';
  const filename = `${params.doseId}.${ext}`;
  const target = path.resolve(config.videoStorageDir, filename);
  await fs.writeFile(target, await file.toBuffer());

  await query('update doses set video_path = $1, updated_at = now() where id = $2', [target, params.doseId]);
  return { ok: true, videoUrl: `${config.publicBaseUrl}/videos/${filename}` };
});

server.post('/doses/:doseId/verify', async (request, reply) => {
  const params = z.object({ doseId: z.string().min(1) }).parse(request.params);
  if (!(await assertDoseAccess(params.doseId, syncSecret(request)))) {
    return reply.code(401).send({ error: 'unauthorized' });
  }
  const result = await query<{ video_path: string | null }>('select video_path from doses where id = $1', [params.doseId]);
  if (!result.rowCount) return reply.code(404).send({ error: 'dose_not_found' });

  const verdict = await verifyDoseVideo(result.rows[0].video_path ?? undefined);
  const status = verdict.identity_ok && verdict.pill_present && verdict.swallow_confirmed && verdict.confidence >= 0.8 ? 'confirmed' : 'flagged';
  await query('update doses set status = $1, verdict = $2, updated_at = now() where id = $3', [
    status,
    JSON.stringify(verdict),
    params.doseId,
  ]);
  return { status, verdict };
});

server.post('/stripe/checkout', async (request, reply) => {
  if (!stripe) return reply.code(501).send({ error: 'stripe_not_configured' });
  const body = z
    .object({
      amount: z.number().int().min(1).max(1000),
      plan: z.enum(['monthly', 'oneTime']),
      successUrl: z.string().url(),
      cancelUrl: z.string().url(),
    })
    .parse(request.body);

  const session = await stripe.checkout.sessions.create({
    mode: body.plan === 'monthly' ? 'subscription' : 'payment',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: body.amount * 100,
          product_data: {
            name: 'Care Companion support',
            description: 'Helps cover AI verification, video storage, and hosting costs.',
          },
          ...(body.plan === 'monthly' ? { recurring: { interval: 'month' as const } } : {}),
        },
        quantity: 1,
      },
    ],
    success_url: body.successUrl,
    cancel_url: body.cancelUrl,
    metadata: {
      source: 'caregiver_app',
      plan: body.plan,
      amount_usd: String(body.amount),
    },
  });
  return { url: session.url };
});

server.post('/stripe/webhook', async (request, reply) => {
  if (!stripe || !config.stripeWebhookSecret) return reply.code(501).send({ error: 'stripe_not_configured' });
  const signature = request.headers['stripe-signature'];
  if (typeof signature !== 'string') return reply.code(400).send({ error: 'missing_signature' });

  const raw = request.rawBody;
  if (!raw) return reply.code(400).send({ error: 'missing_raw_body' });
  const event = stripe.webhooks.constructEvent(raw, signature, config.stripeWebhookSecret);
  await query(
    `
      insert into stripe_events (id, type, payload)
      values ($1, $2, $3)
      on conflict (id) do nothing
    `,
    [event.id, event.type, JSON.stringify(event)],
  );
  return { received: true };
});

server.listen({ port: config.port, host: '0.0.0.0' });
