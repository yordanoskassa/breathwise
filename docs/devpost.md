# Devpost submission: Breathwise

**Category:** Next Gen Award (student)

**Tagline (elevator pitch):**
Point your phone at a sleeping child and it counts their breaths the WHO way. No touching, no wearable, no video leaves the phone.

**Links**
- Video: _YouTube link_
- Code: https://github.com/yordanoskassa/breathwise (MIT)

---

## Inspiration

Pneumonia kills more children under five than any other infection, about 740,000 in 2019. The first test a health worker uses is simple: count the child's breaths for one full minute and compare the count with a cut-off for their age. People are bad at it. In a four-country trial, only 8 to 20% of health-worker counts on infants under two months were within two breaths of the true rate. Every app I found still asks you to tap the screen once per breath. I wanted the camera that is already in everyone's pocket to do the counting.

## What it does

- You point the phone at a sleeping or calm child. Breathwise finds the breathing on its own and highlights the chest in green tiles. It then locks on and counts every breath live, with a dot on the trace and a small vibration.
- It counts 60 seconds of clean signal. If the child moves, the clock pauses instead of counting noise.
- It applies the WHO IMCI fast-breathing cut-off for the child's age (60, 50 or 40 breaths per minute) and walks through the IMCI danger signs. Any danger sign turns the result into "Seek care now".
- There is a tap-count mode (the manual WHO method) and a "tap along" check that compares your count with the camera's.
- It has spoken guidance and five languages (English, French, Spanish, Kiswahili, Amharic). The UI is dark for night use, and data stays on the phone.

## How I built it

Expo SDK 57 and React Native 0.86, VisionCamera 5 frame output with worklets, Skia, Reanimated 4, and RevenueCat.

The breathing detector is classic signal processing that runs on the phone in real time. There is no ML model and no server.

1. On the camera thread, each frame's brightness plane is reduced to a 12×16 grid of averages, and the frame is released. Only 192 numbers reach JavaScript.
2. Slow exposure drift is divided out, whole-scene movement is detected, and each cell is band-pass filtered to 8–108 breaths per minute.
3. Every second, each cell's spectrum is computed. Cells vote for a rate, weighted by how rhythmic they are, with a check against counting a harmonic. The cells that agree are merged into one breathing trace with principal component analysis.
4. A peak tracker counts breaths. The session checks the count against the spectral rate and the breath-to-breath rate and reports a confidence.

Thirteen end-to-end tests render synthetic scenes pixel by pixel and run them through the exact app pipeline. Rates from 14 to 75 per minute land within two breaths. The tests also cover sub-pixel chest motion, heavy sensor noise and bumps mid-count, and the detector never locks onto a scene with no breathing.

## RevenueCat

Counting is never behind a paywall, and health-worker mode is free forever. The **Family** entitlement (monthly or yearly with a 7-day trial) adds unlimited children, trend charts, a PDF report for the doctor and sick-night recheck reminders. Those are the things a worried parent values at 2 a.m. Every Family plan keeps the app free for community health workers.

Implementation: a custom paywall built from Offerings, entitlement-gated features, restore, and Customer Center for self-service management. It is tested with RevenueCat Test Store.

## Challenges

The hard part was finding a chest that moves one or two pixels under sensor noise, auto-exposure and hand shake. What made it work:
- Locking exposure, focus and white balance once the shot is framed.
- Normalizing brightness with a slow average rather than frame by frame. The frame-by-frame version leaked the breathing rhythm into every cell.
- Widening the rhythm window relative to the rate, so irregular infant breathing keeps its lock.
- Making the detector refuse to lock when nothing is breathing.

## Accomplishments

- A working contactless breath counter in pure TypeScript signal processing, fast enough to run on the camera thread.
- An honest result screen: WHO cut-offs, danger signs, a confidence level and the raw 60-second trace.
- A business model where the people who can pay fund the people who can't.

## What I learned

Clinical workflows beat features. Following the WHO counting protocol exactly (60 seconds, pause on movement, age cut-offs, danger signs) made the product clearer and easier to trust than any extra feature did.

## What's next

- A clinical agreement study against video-panel reference counts.
- An offline health-worker mode with supervisor sync.
- Android tuning.
- Partnering with community health programs.

**Note on the demo video:** the measurement footage was recorded in the iOS Simulator with a simulated baby, because the Simulator has no camera. On a phone, Breathwise uses the live camera. The video says so on screen.

**Music:** "A Kind of Hope" by Scott Buckley, licensed CC BY 4.0 (scottbuckley.com.au).

## Built with

expo, react-native, typescript, react-native-vision-camera, skia, reanimated, revenuecat, zustand, remotion
