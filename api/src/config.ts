export const config = {
  port: Number(process.env.PORT ?? 3000),
  publicBaseUrl: process.env.PUBLIC_BASE_URL ?? `http://localhost:${process.env.PORT ?? 3000}`,
  webOrigin: process.env.WEB_ORIGIN ?? '*',
  databaseUrl: process.env.DATABASE_URL ?? 'postgres://care:care@localhost:5432/care_companion',
  videoStorageDir: process.env.VIDEO_STORAGE_DIR ?? './storage/videos',
  geminiApiKey: process.env.GEMINI_API_KEY ?? '',
  geminiModel: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-insecure-secret-change-me',
  r2: {
    endpoint: process.env.R2_ENDPOINT ?? '',
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
    bucket: process.env.R2_DOWNLOADS_BUCKET ?? 'medperks',
    apkKey: process.env.R2_APK_KEY ?? 'medperks.apk',
  },
};
