# MedPerks

Medication adherence for people who refuse their meds - not forget them.

The caregiver funds real rewards. Each dose is confirmed on camera (right person, real pill, real swallow) and instantly unlocks a reward. A per-person engine learns which time, reward, and wording work for this patient and rotates rewards so they stay fresh. A miss is never punished; a sustained gap sends the caregiver a gentle alert.

**Live demo:** https://48068d-web91t7.vps.flowengine.cloud/

## Apps

- **Android:** [download the APK](../../releases/latest)
- **iOS / web:** Expo app in [`caregiver/`](caregiver/) - `npm start`, then press `w` for web or scan the QR with Expo Go
- **API:** [`api/`](api/) - self-hosted sync + camera-verification service (Docker)

## Run the full stack

```bash
cp .env.example .env
docker compose up --build
```

Web: http://localhost:8080 · API: http://localhost:3000

## Privacy

Local-first: medications, schedule, rewards, and dose history stay on the device. Camera frames are sent only for the dose verdict and are not retained. No ads, no analytics, no data sales. See [PRIVACY.md](caregiver/PRIVACY.md).

## License

MIT - see [LICENSE](LICENSE).
