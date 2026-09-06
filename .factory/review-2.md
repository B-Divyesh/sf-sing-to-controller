# Review 2: map vocal gestures to browser game controls

## Verdict

**PASS — 0 findings and 0 untested claims.**

Sing Switch maps low, high, and held vocal gestures to browser game controls
for game makers, music teachers, and accessible-play designers. This review
found the real job works end to end without changing product code.

- Live URL: <https://sing-to-controller.sociobot.in>
- Implementation reviewed: `c826ef8ba92893ac34f420ac7dc77e9fd66ce2ae`
- Documentation baseline reviewed: `028a0e603afa891a3bbaf3fb7e6efcce6652d48e`
- Supplied checkout: `f7e149541a81e09a94faaf744d263deb50782d01`
  (later Graphify-only output; no product change)
- Reviewed: 6 September 2026 UTC
- Artifact: static web/PWA; no product backend is present

## First screen

Fresh 1440×1000 desktop and 390×844 phone browser contexts both started at the
top of `/`.

- Job: **Turn your voice into browser game controls.**
- Audience: game makers, music teachers, and accessible-play designers.
- First action: **Try it with sample data**. Its adjacent sentence says the
  click opens three ready gestures and populated controller output.

Both first screens also showed the local-audio, offline-after-first-visit, and
free/no-account facts before scrolling. The desktop target measured 245.7×48
CSS px; the phone target measured 350×48 CSS px. Neither viewport overflowed.
Fresh live screenshots are `/work/.evidence/review-2-desktop-root.png`,
`/work/.evidence/review-2-phone-root.png`, and
`/work/.evidence/review-2-phone-demo.png`.

## Demo and core task

One click opened `/demo`. It immediately showed the persistent **Demo — sample
data, nothing is saved** label, low 180 Hz, high 360 Hz, held 850 ms, `3 / 3
ready`, and populated controller output. The label remained visible after a
full-page scroll. **Reset demo** restored the sample.

On live HTTPS, valid seeded real calibration and mapping values remained byte
for byte identical through demo edits, reset, and **Start for real**. Leaving
demo removed only `demo:sing-switch-calibration` and
`demo:sing-switch-mappings`; it returned to `/#studio` with the real setup
intact. Malformed real values are intentionally rejected by the documented
invalid-settings recovery path, so they are not treated as a real setup.

The clean browser suite exercised deterministic microphone calibration,
low/high/held actions, keyboard-only three-gate game completion, JSON export,
copy, browser events, synthetic keys, optional WebSocket output, invalid
WebSocket recovery, microphone denial recovery, boundaries, saved-setting
recovery, focus, reduced motion, phone targets, and accessibility. It passed.

## Declared claims

From a clean detached checkout at the supplied SHA, `npm ci` completed with no
vulnerabilities. All 20 exact commands declared in `.factory/claims.json` were
run separately as `npm run test:claim -- --grep "@claim:<id>"`; every command
passed its single observable browser test.

| Claim IDs | Result |
| --- | --- |
| `demo-isolation`, `demo-populated`, `three-gesture-calibration`, `pitch-actions` | PASS |
| `local-audio`, `no-voice-retention`, `local-settings`, `browser-event` | PASS |
| `synthetic-keyboard`, `untrusted-input`, `json-export`, `copy-state` | PASS |
| `websocket-json`, `keyboard-game`, `offline-reload`, `tracking-free` | PASS |
| `free-core`, `non-goals`, `reset-storage`, `microphone-control` | PASS |

The manifest has 20 unique IDs. Source inspection counted exactly one
`@claim:<id>` test for each, with no extra or missing tags. Landing, demo,
legal, and README copy were cross-checked against the manifest; no additional
public claim was found. Untested claim count: **0**.

`npm test` also passed from that checkout: 18 Vitest tests and 56 Playwright
tests passed; 2 mobile project skips for the Chromium-only claim file are
intentional. `npm run build` passed, produced `dist/index.html`, and
`git diff --check` passed. The initial app JavaScript is 38,530 B raw / 12.98
KB gzip; CSS is 21,496 B raw / 5.53 KB gzip; initial WOFF2 fonts total 26,072
B; the AVIF hero is 25,634 B.

## Live routes, privacy, and accessibility

- `/`, `/demo`, `/privacy`, and `/terms` returned HTTP 200. Each has its own
  plain title, one H1, `lang=en`, main landmark, canonical, description,
  social image, and touch icon.
- `/review-2-missing-page` returned deliberate HTTP 404 and rendered the
  product-styled missing-page H1 and return action. Its expected failed-resource
  console entry is not a product error.
- All regular same-origin links on the landing, demo, legal, and 404 pages
  resolved to HTTP 200. Hash links on the deliberate 404 retain HTTP 404 by
  design and are not broken paths.
- Fresh live axe scans on those five route states at desktop and phone sizes
  reported zero violations. Public routes had no console or page errors.
- The skip link, keyboard game path, visible focus, reduced-motion behavior,
  invalid input recovery, and 200% text behavior passed in the clean browser
  suite; the verified live files are byte-identical to that build.
- A fresh live context registered and controlled `sing-switch-v4`. After an
  update check and offline switch, `/demo`, `/privacy`, `/terms`, and `/` all
  reloaded with their correct titles and H1s and no errors.
- Full demo-flow claim tests recorded same-origin requests only, no cookies,
  no recorder or speech-recognition calls, no IndexedDB or session storage,
  and local real settings limited to calibration and mappings. The live CSP,
  HSTS, referrer, nosniff, and microphone-permission headers are present.

## Candidate identity

Fresh local production output from the implementation candidate exactly matched
the deployed files:

| File | SHA-256 |
| --- | --- |
| `/` | `a2555a307dc70997521d81d7589b5c63d1f049fd6f8586422063d91aeced3829` |
| `/assets/main-BtCRxa1l.js` | `459dc2928553d8cc1594d12ed18675fc9ce8f964c9fd1ca703f0aadd558ca58e` |
| `/assets/style-tx1WAZA8.css` | `43cd893237ff66943d9c2fc3411c76e0c0d953a074f5e2e3f50c6b1877857393` |
| `/sw.js` | `b9665e03b24cc4e068d50658dc3cad9ab26bc80a4aaf36f09500c5d8e01dc893` |
| `/manifest.webmanifest` | `f438e04db6c6c8092094f43f116286771b06aca1fdac30eacac750dac103bcd2` |

## Earlier findings

All earlier findings remain resolved:

| Earlier finding | Current disposition |
| --- | --- |
| QA-01 pitch subharmonics | Resolved by deterministic fundamental/calibration coverage. |
| QA-02 wrong route action counted | Resolved by gate-specific action scoring coverage. |
| QA-03 malformed saved data | Resolved by live and automated default recovery. |
| QA-04 phone targets under 44 px | Resolved; required controls pass phone target checks. |
| QA-05 nested complementary landmark | Resolved; live axe reports zero violations. |
| R1 demo changed real storage | Resolved; valid seeded settings remain unchanged. |
| R2 claims absent | Resolved; 20 declared, separately passing claim commands. |
| R3 unknown route returned home | Resolved; designed HTTP 404 confirmed. |
| R4 first screen lacked audience/sample action | Resolved on fresh desktop and phone sessions. |
| R5 canonical and social data missing | Resolved on every public route. |
| R6 demo/copy documents and shared structure incomplete | Resolved; documents, shared navigation/footer, version, and legal headings are present. |

There is no backend, tenant data, health endpoint, payment path, or
product-controlled request allowance, so tenant isolation, restart persistence,
health, and 429 checks do not apply. The optional user-entered WebSocket is an
outbound integration, not a product backend.

## Findings

None. Finding count: **0**. Untested claim count: **0**. Final verdict:
**PASS**.
