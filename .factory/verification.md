# Independent product verification — FAIL

## Scope and verdict

- Candidate: `e35d52117f740f7087c12fdc705b8dffd421272c`
- Branch: `main`
- Deployment: <https://sing-to-controller.sociobot.in>
- Verified: 2026-08-28 UTC
- Work order: `sing-to-controller-verify-1`
- Environment: Node 22.23.2, npm 10.9.8, Playwright/Chromium 1.58.2

**FAIL.** The deployed files match the candidate and the build, privacy,
performance, baseline accessibility, offline, export, and keyboard paths are in
good shape. The core pitch adapter is not release-ready: valid vocal-range
frequencies alias to subharmonics, a representative low/high pair cannot finish
calibration, and the displayed recognition percentage counts the resulting
wrong action as recognized. This fails the researched job-to-be-done and its
90% action-recognition success measure.

No product code was changed during verification.

## Defects

### Major

#### QA-01 — Common vocal pitches alias to subharmonics and can block calibration

The production detector was exercised end to end in Chromium with deterministic
48 kHz, 2,048-sample sine buffers through a microphone/AudioContext test double.
The UI reported these results over 20 observed frames per frequency:

| Input | Reported | Frames within 3% |
| ---: | ---: | ---: |
| 180 Hz | 90 or 180 Hz | 8/20 |
| 220 Hz | 220 Hz | 20/20 |
| 260 Hz | 87 Hz | 0/20 |
| 300 Hz | 300 Hz | 20/20 |
| 360 Hz | 120 Hz | 0/20 |
| 440 Hz | 440 Hz | 20/20 |
| 550 Hz | 79 or 138 Hz | 0/20 |
| 700 Hz | 100 Hz | 0/20 |
| 900 Hz | 300 Hz | 0/20 |

Concrete blocking reproduction:

1. Start listening.
2. Feed 220 Hz and sample low: the UI saves `✓ 220 Hz`.
3. Feed 260 Hz and sample high: the live UI reads `87 Hz`.
4. Sampling is rejected with “That high note is too close to your low note.”
   The count remains `1 / 3 ready`.

Both notes are valid and ordered correctly, yet the user cannot complete the
three-gesture calibration. The autocorrelation implementation chooses later
equally correlated periods instead of the fundamental for many inputs.

#### QA-02 — “Session recognition” reports success for the wrong action

With the default 180/360 Hz calibration, the split is about 255 Hz. A steady
260 Hz input should therefore be `high` / `MOVE_UP`. The deployed engine instead
reported `86.7 Hz`, `Low`, and `MOVE_DOWN`, while the UI showed **96% recognition
(24 of 25 voiced frames)**.

The counter treats any non-empty `activeActions` array as a recognized frame;
it does not compare the intended gesture/action with the emitted one. It can
therefore exceed the brief's 90% target while controls are directionally wrong.

### Moderate

#### QA-03 — Structurally invalid saved settings break the studio

Setting both local-storage values to valid JSON objects (`{}`) and reloading
causes the uncaught page error `t.map is not a function`; zero mapping rows are
rendered. Invalid JSON syntax falls back correctly, but parsed data is not
schema-validated. A stale or damaged local setting should recover to defaults.

#### QA-04 — Several mobile targets are below the required 44×44 CSS px

At 390×844, measured targets included the hero keyboard-path link at 350×25,
the three range inputs at 300×30, footer links at 58×22 and 47×22, and brand
links at 147×32. This violates the attached touch-target baseline even though
the layout has no horizontal overflow.

### Minor

#### QA-05 — One axe landmark best-practice violation

Axe 4.10 reports `landmark-complementary-is-top-level` (moderate impact in axe)
on `aside.tuning-panel`: the complementary landmark is nested inside the
mapping section landmark. There are zero serious or critical axe findings.

## Clean-checkout evidence

Verification ran in a separate detached worktree pinned to the candidate; the
pre-existing untracked `graphify-out/` directory in the supplied checkout was
left untouched.

| Check | Result |
| --- | --- |
| `npm ci` | PASS; 100 packages installed, 0 vulnerabilities |
| `npm test` | PASS; 4/4 Vitest and 14/14 Playwright tests |
| Type check | PASS via `tsc --noEmit` in the production build |
| Lint | Not present in `package.json` |
| `npm run build` | PASS; Vite 6.4.3, `dist/index.html` produced |

Production output budgets:

- JavaScript: 32,655 B raw / 11.46 KB gzip (budget 200 KB)
- CSS: 17,637 B raw / 4.82 KB gzip (budget 50 KB)
- First-use WOFF2 fonts: 26,072 B (budget 120 KB)
- Hero WebP: 41,916 B (budget 300 KB)

## Functional and recovery coverage

Passing independent checks included:

- Demo calibration reaches `3 / 3 ready`; three gesture mappings persist.
- Pointer and keyboard previews update the live controller JSON and release.
- `sing-switch` events carry the versioned state; synthetic keyboard events are
  emitted with `isTrusted === false`.
- A real local WebSocket receiver accepted the connection and received both
  active `MOVE_UP` and release JSON frames.
- Export produced valid `sing-switch-mapping.json` with five mappings.
- Pitch split boundaries 100/700 Hz and hold boundaries 400/2,000 ms work by
  keyboard; reset clears settings and survives reload.
- Invalid `https://` WebSocket input gives actionable guidance; an unreachable
  `ws://` endpoint reports failure and re-enables Connect.
- Sampling before microphone permission focuses the microphone button. Denied
  permission gives recovery guidance, and the demo path remains usable.
- A permitted fake media stream starts and stops cleanly.
- The keyboard-only game route completed all three gates in three attempts;
  pause, reset, and status feedback work.
- `/privacy` and `/terms` render directly as standalone routes.

A second synthetic calibration run completed low/high/hold sampling and showed
100% displayed recognition, but the saved frequencies were aliased (180 Hz was
saved as 90 Hz and 360 Hz as 120 Hz), reinforcing QA-01/QA-02 rather than proving
the success criterion.

## Live deployment identity and browser behavior

The live build is the candidate, established by exact SHA-256 matches against
the clean local `dist/` output:

| Resource | SHA-256 |
| --- | --- |
| `/` | `713586f637921a6398f82fcd117aedf99f140daa82f4e4539731ecf3a32b2f8b` |
| `/assets/index-Bq4puLNX.js` | `2d19a0d831b2ce427742c222bd46dfdd691d030881573d44fd5c4db6f55ba2a0` |
| `/assets/style-BDm-my1d.css` | `27da558347e92c434aaf96b1758e42e57ff02fe2a5e40b34466cbb28facdccb5` |
| `/assets/sound-landscape.webp` | `6bb92e6a7c534682591e928cf3dbc43f0ab212287c7d728ae53c864a36fdc743` |
| `/sw.js` | `4e5918dbf458e74155011e5e8c300b27539cd88b92a8208d9c0b6e6cea7dbecb` |
| `/manifest.webmanifest` | `6842a5e28cf2aa176296d38f048ba4c66085b5690a8cc5e3ffb18906dbd93f92` |

Live desktop and 390×844 sessions had no page errors, console errors, failed
requests, or horizontal overflow. All automatic requests stayed on
`https://sing-to-controller.sociobot.in`. The factory `verify-url.sh` passed
with HTTP 200, title, `lang=en`, one H1, a main landmark, alt text, and no errors.

## Privacy, policy, and caching

- Starting and stopping the microphone produced no additional network request.
- A fresh microphone session left no cookies, local/session storage, or
  IndexedDB data. Calibration/mappings are stored only after the user saves
  them. Source inspection found no recording, analytics, tracking, or upload
  path.
- CSP limits default/script/media/image sources to self, allows only user-chosen
  `ws:`/`wss:` connections, blocks objects and framing, and constrains base URI.
- HSTS, `nosniff`, strict-origin referrer policy, and
  `Permissions-Policy: microphone=(self)` are present.
- HTML/service-worker responses use 30-second revalidation; hashed assets use
  one-year immutable caching. Conditional requests returned 304.
- The manifest is served as `application/octet-stream`, but Chromium parsed it
  with zero manifest or installability errors.

## Accessibility, responsive layout, and motion

- Axe on live desktop and 390px mobile: 0 serious, 0 critical, 1 moderate
  best-practice finding (QA-05).
- Skip link is the first Tab stop, becomes visible at `(8, 8)`, and has a 3 px
  focus outline; it moves navigation to `#main`.
- Representative links, buttons, selects, sliders, previews, and game controls
  were exercised by keyboard; no traps were observed. Focus styles remain
  visible, labels/names are present, contrast checks pass, and there is one H1.
- Reduced-motion emulation changes transitions/animations to 0.01 ms and smooth
  scrolling to `auto`.
- Desktop 1440×1000 and mobile 390×844 screenshots were visually inspected.
  Content is readable and intentional, sections render when scrolled, and no
  clipping or overlap was found. QA-04 remains for target dimensions.

## Performance and PWA

Lighthouse 12.8.2 against the live mobile URL (simulated throttling):

- Performance 99, Accessibility 100, Best Practices 100, SEO 100
- FCP 1.057 s, LCP 1.291 s, Speed Index 1.057 s
- TBT 118 ms, CLS 0.0004, total transfer 87,260 B
- INP is not produced by this navigation-only lab run; interactive browser
  checks showed immediate state updates, but no field-INP claim is made.

The live service worker became active and controlling, `registration.update()`
completed with no waiting worker, cache `sing-switch-v1` was present, and an
offline reload of `/privacy` rendered the correct legal page.

## Acceptance summary

| Contract area | Result |
| --- | --- |
| Core vocal calibration and accurate action recognition | **FAIL** (QA-01, QA-02) |
| Keyboard alternative, export, event, WebSocket, and game paths | PASS |
| Product-specific visual system and original-asset provenance | PASS |
| Clean install, tests, type check, and exact build | PASS |
| Privacy and outbound-request guarantees | PASS |
| Serious/critical axe baseline | PASS |
| Mobile/keyboard/reduced motion | FAIL target-size requirement (QA-04) |
| Performance and bundle budgets | PASS |
| PWA update check and offline reload | PASS |
| Live deployment matches candidate | PASS |
| Overall | **FAIL** |

Real microphone/room testing was not needed to establish the release blocker;
the deterministic signal path already fails in quiet, repeatable conditions.
