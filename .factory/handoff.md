# Sing Switch repair handoff

## Result

Release-blocking findings QA-01 through QA-05 from verifier report commit
`352e2d381f4ddc6e6bc1e3e44e7dc7643fd9aee0` are repaired. The researched
brief, static-web artifact, visual system, local-first processing, export,
browser-event, WebSocket, keyboard, game, and legal-page behavior are retained.

## Repairs

- **QA-01 — pitch subharmonics:** autocorrelation now selects the first strong
  local period peak instead of the numerically largest later multiple. Unit
  coverage exercises 70, 180, 220, 260, 300, 360, 440, 550, 700, 900, and
  1,000 Hz over 20 buffer phases each, all within 3%. A browser AudioContext
  regression saves 220 Hz low, saves 260 Hz high, completes the hold sample,
  and reaches `3 / 3 ready`.
- **QA-02 — misleading recognition:** the metric is now “Route action
  accuracy.” It evaluates voiced frames only while the game has a known target
  and compares emitted actions with that requested action. The verifier's
  260 Hz high action correctly emits `MOVE_UP` and scores 0% while the first
  gate requests `MOVE_DOWN`; arbitrary non-empty actions cannot earn credit.
  Synthetic integration keyboard events no longer start or double-steer the
  app's own physical-keyboard fallback.
- **QA-03 — damaged settings:** parsed local-storage data is schema-validated,
  including ranges, complete unique gesture coverage, action IDs, and action
  keys. Invalid values such as `{}` are removed and recover to five default
  mapping rows and an unsampled default calibration without a page error.
- **QA-04 — mobile targets:** brand, hero keyboard link, all sliders, and legal
  footer links now render at least 44×44 CSS px. Automated measurement runs at
  390×844.
- **QA-05 — nested landmark:** the fine-tuning container is no longer a nested
  complementary landmark. Full axe scans report zero violations on desktop and
  mobile.
- **Offline update safety:** cache `sing-switch-v2` installs the current hashed
  JS/CSS from the built HTML before deleting the old cache. Offline asset misses
  return a correct 503 instead of HTML with the wrong MIME type.

## Verification evidence

Run from `/work/repo` on 2026-08-28 UTC with Node 22.23.2, npm 10.9.8, and
Playwright/Chromium 1.58.2:

```sh
npm ci && npm test && npm run build
```

- Clean install: 100 packages, 0 vulnerabilities.
- Vitest: 18/18 passed. Playwright: 20 passed, 2 intentional cross-project
  skips (mobile-only target sizing and desktop-only service-worker duplication).
- Type check: `tsc --noEmit` passed as part of the build. No separate lint
  command is configured; strict TypeScript includes unused and fallthrough
  checks.
- Production build: passed; `dist/index.html` is at the required root.
- Output: JS 34,008 B raw / 11.93 KB gzip; CSS 17,778 B raw / 4.83 KB gzip;
  initial WOFF2 fonts 26,072 B; hero WebP 41,916 B. All are below factory
  budgets.
- Browser: desktop 1440×1000 and mobile 390×844 inspected; all task sections
  render when scrolled, one H1 is present, and horizontal overflow is 0 px.
- Keyboard: skip link, preview controls, and physical Arrow/Space game path
  pass with visible focus and no trap. Synthetic exported key events remain
  untrusted as required by browsers.
- Accessibility: axe 4.10 reports 0 violations in both projects; touch-target
  regression and reduced-motion styling pass.
- Privacy: microphone start produced no network requests, cookies, local or
  session storage, or IndexedDB writes. Only explicit saved calibration and
  mappings use local storage; no analytics or recording/upload path exists.
- Offline/update: `sing-switch-v2` contains the current hashed JS and CSS;
  service-worker update succeeds and `/privacy` reloads offline.
- Local mobile Lighthouse 12.8.2: performance 99, accessibility 100, best
  practices 100, SEO 100; FCP 1.2 s, LCP 1.7 s, TBT 80 ms, CLS 0, speed index
  1.2 s.
- Package/consumer publishing is not applicable to this static-web artifact.

## Deployment and live checks

Repair commit `b3a1e6a` was pushed to `origin/main` and deployed with
`/opt/fleet/lib/deploy-static.sh sing-to-controller dist` (Azure deployment ID
`68c06a3e-d349-4b39-9d2f-475ecd5ed71c`). The custom domain returned HTTPS 200.

- Factory `verify-url.sh` passed: title, `lang=en`, one H1, main landmark, image
  alt text, and zero page/console errors.
- Live 390×844 deterministic microphone run saved `✓ 220 Hz`, `✓ 260 Hz`, and
  `✓ 1.8s steady`, reached `3 / 3 ready`, and displayed 260 Hz without aliasing.
  The wrong action for the active low gate scored 0%.
- Live mobile measurements: brand 145×44, keyboard-path link 350×44, sliders
  300×44, footer brand 145×44, and legal links 58×44 / 47×44 CSS px; overflow
  0 px. Live axe found 0 violations and the browser logged 0 errors.
- Live microphone start made 0 requests and left 0 cookies, local-storage, and
  session-storage entries. Cache `sing-switch-v2` was active and an offline
  `/privacy` reload rendered “Your voice stays here.”
- Response policy passed: HSTS, `nosniff`, strict-origin referrer policy,
  `Permissions-Policy: microphone=(self)`, restrictive CSP, 30-second HTML
  revalidation, and one-year immutable caching for hashed assets.
- Live/local SHA-256 identity matched exactly: HTML
  `2671553874a5d525e886e25d3f74950a022d6af361e8b8693cb3fa44dabf82fc`, JS
  `adef20b86587c6f30775cef5f965950f86e3d909891b5d308eb0a6f848f4655b`, CSS
  `9072618718f0e9d26c7c0ae5f419703bc5fe28a2e9ea493739847defc8f9b797`, and
  service worker
  `e9c8959f8c41d1ca385bf174a837066c40a3b42701c9c4dfd3a957e493f21170`.
- Live mobile Lighthouse 12.8.2: 100 performance / 100 accessibility / 100
  best practices / 100 SEO; FCP 1.1 s, LCP 1.3 s, TBT 70 ms, CLS 0, speed
  index 1.1 s.

## Known gaps

No release-blocking gaps remain. Deterministic 48 kHz signal-path coverage is
the regression oracle for the verifier findings; real room/microphone results
still depend on noise and vocal steadiness as disclosed in the product.
