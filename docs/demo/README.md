# Demo video

`planet-i-green-demo.mp4` is the 2 minute walkthrough (1080p, 30 fps, silent, about 19 MB).

The `scenes/` folder holds each scene as its own clip (1600x900, 30 fps, H.264) so the film can be re-cut,
re-ordered or given a voice-over and music in any editor. Every scene starts and ends on a still moment so
cuts and crossfades are clean.

| Order | Clip | Shows | Length |
|---|---|---|---|
| 1 | `s1-intro.mp4` | Title card, landing page, choosing the full platform | 15 s |
| 2 | `s2-diagnose.mp4` | Photo, diagnosis, severity, companion and pollinator tips, care plan, share card | 34 s |
| 3 | `s3-care.mp4` | Weather alerts, reminders that build themselves and chain | 18 s |
| 4 | `s4-growth.mp4` | Severity over time, "Recovering", ongoing tip | 15 s |
| 5 | `s5-community.mp4` | Community map, pin preview, blurred locations | 15 s |
| 6 | `s6-explore.mp4` | Plant guide search and filter, green actions, dark mode | 35 s |
| 7 | `s7-outro.mp4` | Closing card | 7 s |

The final cut trims the last 3 s of scene 6 and 1.5 s of scene 7, uses 0.5 s crossfades between scenes, and
fades to black at the end. Rebuilding it with ffmpeg:

```bash
ffmpeg -t 14.7 -i s1-intro.mp4 -i s2-diagnose.mp4 -i s3-care.mp4 -i s4-growth.mp4 -i s5-community.mp4 \
  -t 32.4 -i s6-explore.mp4 -t 5.6 -i s7-outro.mp4 -filter_complex "<xfade chain, 0.5 s each>" ...
```

## How it was made

The clips are real recordings of the running app, not mock-ups: the production build was driven in a headless
browser against a seeded test backend (a small garden, community reports around one city, real plant photos, a
forecast with a frost night). The phone view sits in a stage page that provides the camera moves (eased zoom and
pan that drifts toward the cursor), the on-screen cursor and click ripples, and the captions. Clicks and typing are
real input events. Frames come from the browser's screencast, which is timestamped, and are rebuilt onto an exact
30 fps timeline with ffmpeg.

The seeded data is for the recording only; nothing in it is real user data.
