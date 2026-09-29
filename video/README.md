# Breathwise demo video (Remotion)

94-second motion-graphics demo cut to the beat of the soundtrack (150.01 BPM, first beat 0.369 s — see `src/timeline.ts`). Every scene boundary sits on a musical section change; lock-on, the danger-sign tick and the final logo land on beats.

Not in git (large / third-party): `public/clips/*.mp4` (iOS Simulator screen recordings of the app) and `public/audio/track.mp3` (the royalty-free track).

```bash
npm install
npm run studio   # preview
npm run render   # → out/breathwise-demo.mp4
```

Clips: record with `xcrun simctl io <udid> recordVideo`, then
`ffmpeg -i raw.mp4 -vf "fps=30,scale=828:-2" -c:v libx264 -crf 17 -g 15 -pix_fmt yuv420p -an measure.mp4`
and update the timestamps in `CLIPS` (`src/timeline.ts`). Swap in real-device footage the same way.
