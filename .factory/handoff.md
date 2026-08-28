# Sing Switch v1 handoff

## What was built

- A finished static TypeScript/Vite product for calibrating vocal gestures into
  browser controls.
- Local microphone analysis with autocorrelation pitch detection (70–1000 Hz),
  a configurable noise gate, confidence/level feedback, and no recording or
  upload path.
- Guided two-second low, high, and held-note samples with retryable errors,
  visible results, stored local thresholds, and a no-microphone demo setup.
- Editable mappings for low pitch, high pitch, held note, onset, and silence.
  Sustained notes retain their pitch direction while adding the hold action.
- A versioned live controller JSON state, same-page `sing-switch` custom events,
  synthetic keyboard previews, downloadable mapping JSON, and an optional
  user-directed WebSocket stream.
- The Glass Ferry accessibility test game, playable with voice or the always
  available Arrow Up, Arrow Down, and Space keyboard controls. It reports
  matched-action recognition accuracy over voiced frames.
- Responsive 390 px layouts, explicit permission/error/offline states,
  keyboard focus states, reduced-motion treatment, and standalone `/privacy`
  and `/terms` routes.
- A cache-first-when-offline service worker, install manifest, static-host
  routing/security headers, README, and MIT license.
- An original generated acoustic-landscape hero. The reviewed source, exact
  prompt, generation metadata, and optimized 42 KB WebP are retained; full
  provenance is in `.factory/design.md`.

## Run and verify

```sh
npm ci
npm test
npm run build
npm run preview
```

The factory build command is exactly `npm run build`. Output lands in `dist/`,
with `dist/index.html` at its root.

Verification on 2026-08-28:

- `npm test`: 4 Vitest unit tests and 14 Playwright checks passed across desktop
  Chromium and a 390×844 mobile profile.
- Playwright includes an axe-core scan with zero serious or critical issues,
  semantic/route checks, console-error checking, mapping preview, keyboard game
  control, and horizontal-overflow checks.
- `npm audit`: 0 vulnerabilities.
- `npm run build`: passed with Vite 6.4.3.
- Initial production assets: 32.66 KB JS (11.46 KB gzip), 17.64 KB CSS
  (4.82 KB gzip), 42 KB hero WebP, and 26.07 KB of first-use Latin WOFF2 fonts.
- Lighthouse 12.8.2 mobile profile against the production preview:
  Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1.6 s,
  CLS 0, TBT 60 ms.
- Visual review completed at 1440×1000 desktop and 390×844 mobile. The generated
  art was checked for text artifacts, seams, people, brands, and unintended
  symbols; none were found.

## Known gaps and next steps

- Microphone hardware and room acoustics cannot be fully exercised in headless
  CI. Pitch detection is unit-tested with synthesized tones; final device QA
  should cover several built-in/headset microphones, vocal ranges, and noisy
  rooms.
- Browser-generated keyboard events are intentionally untrusted and cannot
  control arbitrary native applications. Real integrations should consume the
  `sing-switch` custom event or WebSocket stream.
- WebSocket output requires a receiver supplied by the user; the static product
  does not run a relay, which keeps it private and free.
- There is no actual Gamepad API device injection because browsers do not permit
  sites to register trusted virtual gamepads. The exported state is the stable
  controller contract.
