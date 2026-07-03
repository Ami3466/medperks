# MedPerks

MedPerks gamifies taking meds for people with anosognosia - patients who refuse medication because they do not believe they are sick.

The caregiver funds prizes. The patient takes the meds on camera; AI confirms it is the right person, the right meds, and a real swallow - and the patient collects perks. A per-person engine learns which prize, time, and wording work best and rotates prizes so they stay fresh.

Tangible rewards are proven in randomized trials: adherence improved from 71% to 85% (FIAT, BMJ 2013) and from 80% to 94% in an independent replication (Money for Medication, Lancet Psychiatry 2017).

- https://doi.org/10.1136/bmj.f5847
- https://doi.org/10.1016/S2215-0366(17)30045-7

## Quick start

- **Web app:** https://48068d-web91t7.vps.flowengine.cloud/
- **Android:** [APK from the latest release](../../releases/latest)
- **Apple:** run from source with Expo - `cd caregiver && npm install && npm start`, then press `i`, or scan the QR with Expo Go

## Self-host

```bash
cp .env.example .env
docker compose up --build
```

Add credentials in `.env`:

```
GEMINI_API_KEY=...        # vision dose confirmation (Google AI Studio)
GEMINI_MODEL=gemini-2.5-flash
EXPO_PUBLIC_API_URL=...   # where the app reaches your API
```

Web: http://localhost:8080 · API: http://localhost:3000

## Privacy

Local-first: medications, schedule, prizes, and dose history stay on the device. Camera frames are sent only for the dose verdict and are not retained. No ads, no analytics, no data sales. See [PRIVACY.md](caregiver/PRIVACY.md).

## Sponsor

If this helps your family, you can [sponsor the project](https://github.com/sponsors/Ami3466).

## License

MIT - see [LICENSE](LICENSE).
