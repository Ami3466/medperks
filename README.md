# MedPerks

MedPerks gamifies taking meds for people with anosognosia - patients who refuse medication because they do not believe they are sick.

The caregiver funds prizes. The patient takes the meds on camera; AI confirms it is the right person, the right meds, and a real swallow - and the patient collects perks. A per-person engine learns which prize, time, and wording work best and rotates prizes so they stay fresh.

Tangible rewards are proven in randomized trials: adherence improved from 71% to 85% (FIAT, BMJ 2013) and from 80% to 94% in an independent replication (Money for Medication, Lancet Psychiatry 2017).

- https://doi.org/10.1136/bmj.f5847
- https://doi.org/10.1016/S2215-0366(17)30045-7

## Self-host

This repo is the self-hosted version: web app, API, and Postgres, all on your own server.

```bash
git clone https://github.com/Ami3466/medperks && cd medperks
cp .env.example .env    # add your credentials (below)
docker compose up --build
```

- **Web app:** http://localhost:8080
- **API:** http://localhost:3000

Credentials in `.env`:

```
GEMINI_API_KEY=...        # vision dose confirmation (Google AI Studio)
GEMINI_MODEL=gemini-2.5-flash
EXPO_PUBLIC_API_URL=...   # public URL of your API
```

The web app picks up `EXPO_PUBLIC_API_URL` at container start - no rebuild needed to point it at your server.

## Get the apps

- **Web:** your self-hosted URL above, or the hosted demo: https://48068d-web91t7.vps.flowengine.cloud/
- **Android:** [prebuilt APK](../../releases/latest) (connects to the demo server). For your own server, build against it:

  ```bash
  cd caregiver && npm install
  EXPO_PUBLIC_API_URL=https://api.your-domain.com npx expo run:android
  ```

- **iPhone:** build from source the same way:

  ```bash
  cd caregiver && npm install
  EXPO_PUBLIC_API_URL=https://api.your-domain.com npx expo run:ios
  ```

  Or scan the QR from `npm start` with Expo Go.

## Privacy

Local-first: medications, schedule, prizes, and dose history stay on the device. Camera frames are sent only for the dose verdict and are not retained. No ads, no analytics, no data sales. See [PRIVACY.md](caregiver/PRIVACY.md).

## Sponsor

If this helps your family, you can [sponsor the project](https://github.com/sponsors/Ami3466).

## License

MIT - see [LICENSE](LICENSE).
