# Devpost submission text

**Tagline:** Your phone camera counts a child's breaths, the way WHO tells health workers to, with no touching and no video leaving the phone.

## Inspiration
Pneumonia kills more children under five than any other infection: about 740,000 in 2019. The frontline test is simple. Count breaths for a full minute and compare the count with a cut-off for the child's age. People are bad at it, though. In a four-country trial, only 8–20% of health-worker counts on young infants were within ±2 breaths of the reference. Every app I found still asks you to tap once per breath. I wanted the camera already in everyone's pocket to do the counting.

## What it does
- Point the phone at a sleeping or calm child. A heatmap shows where it sees breathing, brackets lock onto the chest, and a live waveform ticks off each breath with a haptic pulse and voice guidance.
- It counts 60 seconds of *valid* signal, pausing automatically when the child moves.
- It applies the WHO IMCI fast-breathing cut-off for the child's age and walks through the IMCI danger signs. Any danger sign escalates the result to "Seek care now".
- Tap mode (the WHO manual method) and a "tap along" double-check.
- Night-first dark UI, 5 languages (English, French, Spanish, Kiswahili, Amharic), and on-device only storage.

## How I built it
Expo SDK 57, React Native 0.86, VisionCamera 5 frame output with worklets, Skia, Reanimated 4 and RevenueCat.
The signal chain runs in real time on the phone:
1. On the camera thread, each YUV frame's luma plane becomes a 12×16 grid of mean brightness, and the frame is released.
2. Illumination is normalised, a motion gate runs, and the grid is resampled to 10 Hz with a per-cell biquad band-pass (8–108 breaths/min).
3. Every second: per-cell FFT spectra, concentration-weighted frequency voting with a harmonic check, and PCA fusion of the agreeing cells into one waveform.
4. A hysteresis peak tracker counts breaths. The session combines the count, the spectral rate and the inter-breath rate into a confidence score.
It is covered by end-to-end tests on synthetic pixel scenes: 14–75/min all within ±2, sub-pixel motion, heavy noise, bumps, and no false lock without breathing.

## RevenueCat
Counting is never paywalled, and health-worker mode is free forever. The **Family** entitlement (monthly or yearly with a free trial) adds unlimited children, trend charts, PDF reports for the doctor, and sick-night recheck reminders, all things a worried parent values at 2 am. Each plan pays for free health-worker access. Implementation: custom paywall from `getOfferings()`, entitlement gating, restore, and Customer Center. Tested with RevenueCat Test Store.

## Challenges
Making a 1–2 pixel chest movement stand out from sensor noise, auto-exposure and hand shake without any ML model. Locking AE/AF/AWB after framing, normalising illumination, and gating on whole-scene motion were the keys.

## What's next
A clinical agreement study against video-panel reference counts, an offline health-worker mode with sync for supervisors, and Android tuning.

## Built with
expo, react-native, typescript, vision-camera, skia, reanimated, revenuecat, zustand
