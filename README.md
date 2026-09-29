# Breathwise

**Point your phone at a sleeping child and it counts their breaths. No touching, no wearable, and no video ever leaves the phone.**

Breathwise turns any phone camera into a contactless respiratory-rate counter that follows the WHO method for spotting childhood pneumonia: count breaths for a full minute, then compare the count with the cut-off for the child's age.

> Submission for RevenueCat Shipaton 2026 (Next Gen Award). Demo video: _link_

---

## Why

- Pneumonia is the leading infectious killer of children under five. It caused about 740,000 of their deaths in 2019 ([WHO](https://www.who.int/news-room/fact-sheets/detail/pneumonia)).
- Community health workers diagnose it mainly by **counting breaths for 60 seconds**. Fast breathing means ≥ 60/min under 2 months, ≥ 50/min at 2–11 months, and ≥ 40/min at 1–4 years (WHO IMCI).
- Hand counts are often wrong. In a four-country trial, only **8–20%** of health-worker counts on infants under 2 months were within ±2 breaths of the reference ([Baker et al., 2019](https://pmc.ncbi.nlm.nih.gov/articles/PMC6677646/)).
- Existing apps (RRate, mPneumonia, Cardalis, Breaths Per Minute) still ask you to **tap once per breath**. Automated counters are separate hardware, such as the Philips ChARM belt.

Breathwise does the counting with the camera the family or health worker already carries.

## What it does

| | |
|---|---|
| **Camera count** | Live preview with a glowing heatmap of *where* it sees breathing. Brackets lock onto the chest, a waveform scrolls, and every detected breath ticks the counter with a haptic pulse. |
| **WHO-style 60 s** | The clock only runs on valid signal. It **pauses by itself** when the child wriggles, then re-syncs. |
| **Verdict** | Normal, fast breathing, or seek care now, using the WHO IMCI cut-off for the child's age, with a gauge and the full 60 s signal. |
| **Danger signs** | IMCI checklist (chest indrawing, not able to drink, convulsions, and others). Ticking any sign escalates the verdict. |
| **Double-check** | Tap along during a camera count to compare the camera's count with a human count. |
| **Tap mode** | The WHO manual count, for when the camera can't see well. |
| **Voice + haptics** | Spoken guidance ("Breathing found. Counting for one minute.") and a pulse on each breath, for hands-free use at night. |
| **5 languages** | English, Français, Español, Kiswahili, አማርኛ. |
| **Night-first design** | A dark UI that won't wake a sleeping child. |
| **Family plan** | Unlimited children, trends, PDF report for the doctor, and sick-night recheck reminders. |

## How it works

```
camera (YUV, 30 fps)
  └─ worklet on the camera thread: Y plane → 12×16 grid of mean brightness      src/dsp/grid.ts
       (the frame is disposed immediately; only 192 numbers cross to JS)
  └─ illumination normalisation (divide out frame mean: exposure/flicker)       src/dsp/engine.ts
  └─ motion gate: median |Δcell| vs adaptive baseline → pause + filter reset
  └─ resample to 10 Hz, per-cell biquad band-pass 0.13–1.8 Hz (8–108 /min)      src/dsp/filters.ts
  └─ every 1 s, over a 16 s window:                                             src/dsp/fusion.ts
       · Hann-windowed, zero-padded FFT per cell                                src/dsp/spectrum.ts
       · cells vote for a frequency, weighted by spectral concentration²
       · half-frequency harmonic check
       · agreeing cells → PCA (power iteration) → one fused waveform
       · lock-on when the fused signal is periodic *and* the votes agree
  └─ hysteresis peak tracker with a refractory period tied to the period         src/dsp/peaks.ts
  └─ WHO session: 60 s of valid time, count + spectral + inter-breath rates     src/dsp/session.ts
       → confidence from their agreement, signal quality and motion
```

Design choices:

- **No ML model, no cloud.** Classic signal processing runs in real time on any phone, is explainable, and needs no training data of children.
- **Grid of means, not optical flow.** A chest moving 1–2 px changes the brightness of every cell that holds an edge or fabric fold. Averaging ~170 pixels per cell pushes sensor noise far below that change.
- **PCA fusion.** An edge moving up brightens one cell and darkens its neighbour. PCA aligns their signs and weights them automatically.
- **Locked camera.** Once framed, exposure, focus and white balance are locked, so auto-adjustments can't masquerade as breathing.
- **Honest failure.** A still scene with no breathing never locks (see tests). Low agreement shows as low confidence, and tap mode is one tap away.

## Validation

`npm test` renders synthetic "sleeping child under a patterned blanket" scenes pixel by pixel. It runs each frame through the *exact* app pipeline (grid → engine → session), with sensor noise, timestamp jitter and irregular breathing:

| Scenario | Result |
|---|---|
| 14, 20, 28, 36, 44, 52, 62, 75 breaths/min | all within ±2, high confidence |
| 0.6 px chest motion (sub-pixel) | within ±2 |
| heavy sensor noise (σ = 5 levels) | within ±2 |
| two whole-scene bumps mid-count | motion detected, clock paused, within ±3 |
| no breathing at all | never locks |
| time to lock-on | ≤ 10 s |

Real-world validation against a reference count (clinician video panel) is the next step. See *Limitations*.

## Monetization (RevenueCat)

The mission shapes the model. **Counting is never paywalled.**

- **Free, forever:** camera and tap counts, the WHO verdict, danger signs, and one child profile. **Health-worker mode is free for unlimited quick checks.**
- **Breathwise Family** (`family` entitlement, monthly or yearly with a free trial): unlimited children, full history and trend charts, PDF reports, and sick-night recheck reminders. These features are worth paying for on a sick night at home.
- Each Family plan pays for free access for community health workers. The in-app copy says so.
- Implementation: `react-native-purchases` with a custom night-mode paywall built from `getOfferings()`, entitlement-gated features, restore, and **Customer Center** (`react-native-purchases-ui`) for self-serve management. See [`src/purchases/index.ts`](src/purchases/index.ts).

### RevenueCat setup

1. Create a project and a **Test Store** (Apps & providers → Test configuration).
2. Products: `family_monthly` and `family_annual` (add a 7-day free trial).
3. Entitlement `family` → attach both products.
4. Offering `default` with the `$rc_monthly` and `$rc_annual` packages.
5. `cp .env.example .env` and set `EXPO_PUBLIC_RC_TEST_KEY`.

## Run it

```bash
npm install
cp .env.example .env            # add your RevenueCat Test Store key
npx expo run:ios --device       # the camera needs a real iPhone (dev build)
npm test                        # engine accuracy tests (Node ≥ 22)
```

The iOS Simulator has no camera. The measure screen offers a **simulated patient** there, which renders the synthetic scene through the same pipeline.

## Stack

Expo SDK 57 · React Native 0.86 · VisionCamera 5 (Nitro frame output + worklets) · Skia · Reanimated 4 · Expo Router (native tabs) · Zustand (local-only persistence) · RevenueCat · expo-speech / haptics / print / notifications.

## Privacy

No accounts and no analytics. Video is never recorded, stored or uploaded. Each frame becomes 192 numbers on the camera thread and is released. Readings are stored only on the device.

## Limitations

- Not a medical device. It counts breaths and applies WHO thresholds; it does not diagnose.
- Needs the child calm and the chest in view. Plain dark clothing in dim light gives less signal; the torch toggle and confidence score help.
- Validated on synthetic scenes so far. A clinical agreement study against video-panel reference counts is planned.

## License

MIT © 2026 Yordanos Kassa
