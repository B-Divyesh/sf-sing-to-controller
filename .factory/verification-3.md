# Verification 3: map vocal gestures to browser game controls

## Verdict

**PASS — 0 findings and 0 untested claims.**

Sing Switch satisfies the researched product contract and the attached QA
contracts. No blocker, major, moderate, or minor defect was found.

- Live URL: <https://sing-to-controller.sociobot.in>
- Implementation reviewed: `c826ef8ba92893ac34f420ac7dc77e9fd66ce2ae`
- Documentation baseline reviewed: `8dd3898193de55ff1600d74cec36f148cbf6ac5b`
- Supplied checkout before this report: `15731469dba29f5ba777391018c7d61503146231`
  (later Graphify-only commit; no product change)
- Verified: 6 September 2026 UTC
- Work order: `sing-to-controller-verify-3`
- Artifact: static web/PWA; backend checks do not apply

No product code was changed. Pre-existing Graphify working-tree changes were
left untouched.

## First screen before scrolling

Fresh 1440×1000 desktop and 390×844 phone browsers started at scroll position
zero.

- Job: turn low, high, and held vocal gestures into browser game controls.
- Audience: game makers, music teachers, and accessible-play designers.
- First action: **Try it with sample data**. The adjacent text says it opens
  three ready gestures and populated controller output.

The job headline, audience sentence, sample and real-setup actions, and three
facts were visible before scrolling on both screens. The phone layout had no
horizontal overflow. Visual inspection found no clipping, overlap, or empty
capture region. Screenshots are in `/work/.evidence/verification-3-*-root.png`
and `/work/.evidence/verification-3-*-demo.png`.

## Demo and core job

The landing action opened `/demo` in one click. It immediately showed:

- the persistent label **Demo — sample data, nothing is saved**;
- low at 180 Hz, high at 360 Hz, and held at 850 ms;
- `3 / 3 ready`; and
- a pressed low state with populated `MOVE_DOWN` controller JSON.

The label remained visible after scrolling. Changing the sample, resetting it,
and leaving it preserved deliberately seeded real calibration and mappings byte
for byte. Reset restored the sample split to 255 Hz. **Start for real** removed
both `demo:*` keys and did not copy or change real data.

An independent live end-to-end run used deterministic microphone buffers in a
fresh real setup. It calibrated 220 Hz low, 330 Hz high, and a 1.8-second held
note, reached `3 / 3 ready`, completed all three game gates, and reported **92%
route-action accuracy**: 1,371 of 1,486 voiced frames matched the requested gate
action. There were no page errors. This meets the brief's 90% success measure.

Keyboard preview pressed and released `MOVE_DOWN`. Browser Back and Forward
restored the landing and demo routes. Reset setup removed both real storage
keys.

## Declared claims

After `npm ci` in a detached clean checkout at the implementation commit, every
command in `.factory/claims.json` was run separately. All 20 passed. The
manifest has 20 unique IDs, and every ID occurs in exactly one tagged test.

| Claim | Result | Observable proof |
| --- | --- | --- |
| `demo-isolation` | PASS | Demo edit, reset, and exit preserved seeded real values. |
| `demo-populated` | PASS | Three thresholds, ready count, pressed state, and JSON were populated. |
| `three-gesture-calibration` | PASS | Deterministic low, high, and held microphone samples completed. |
| `pitch-actions` | PASS | Low, high, held, and remapped low produced the configured actions. |
| `local-audio` | PASS | Microphone analysis made no upload request. |
| `no-voice-retention` | PASS | No recorder, speech API, IndexedDB, or session storage was used. |
| `local-settings` | PASS | Real mode stored only calibration and mapping keys. |
| `browser-event` | PASS | A versioned `sing-switch` event carried the high action. |
| `synthetic-keyboard` | PASS | High preview emitted `ArrowUp`. |
| `untrusted-input` | PASS | Generated `ArrowDown` had `isTrusted === false`. |
| `json-export` | PASS | Download contained product, version, calibration, and five mappings. |
| `copy-state` | PASS | Clipboard JSON contained the current low controller state. |
| `websocket-json` | PASS | Receiver got only the eight controller-state fields and no audio. |
| `keyboard-game` | PASS | Arrow keys and Space completed all three gates. |
| `offline-reload` | PASS | Demo, privacy, terms, and landing routes reopened offline. |
| `tracking-free` | PASS | Full flow used same-origin requests and set no cookies. |
| `free-core` | PASS | Demo, game, and export worked without login or payment. |
| `non-goals` | PASS | Output had no transcript or identity and used no speech API. |
| `reset-storage` | PASS | Reset removed both real setup keys. |
| `microphone-control` | PASS | Access began on request and the track stopped with listening. |

Landing, legal, demo, metadata, and README copy were cross-checked against the
manifest. No additional public claim was found. Untested claim count: **0**.

## Clean checkout and build

| Check | Result |
| --- | --- |
| `npm ci` | PASS — 100 packages installed, 101 audited, 0 vulnerabilities. |
| All 20 declared claim commands, separately | PASS — 20 of 20. |
| `npm test` | PASS — 18 unit and 56 browser tests; 2 intentional project-specific skips. |
| `npm run build` | PASS — TypeScript and Vite produced `dist/index.html`. |
| `git diff --check` | PASS. |

Production output stayed within the static-web budgets:

- JavaScript: 38,530 bytes raw / 12.98 KB gzip.
- CSS: 21,496 bytes raw / 5.53 KB gzip.
- Initial WOFF2 fonts: 26,072 bytes.
- AVIF hero: 25,634 bytes.

## Live routes, accessibility, and recovery

- `/`, `/demo`, `/privacy`, and `/terms` returned HTTP 200 with distinct plain
  titles, one correct H1, a main landmark, canonicals, social metadata, and the
  touch icon.
- `/verification-3-real-missing-page` returned deliberate HTTP 404 and rendered
  the designed missing-page title, H1, and return link. Chromium's expected
  failed-resource console line for that 404 is not a defect.
- Every same-origin link on the landing page returned 200. `robots.txt`, the
  four-route sitemap, manifest, social image, and touch icon returned 200.
- Axe found zero violations on all five route states on desktop and phone.
- The factory URL verifier passed `/` and `/demo`: `lang=en`, one H1, main,
  image alt text, labelled buttons, and zero console or page errors.
- The first Tab reached the skip link; its focus outline was at least 3 px, and
  Enter moved focus to main. Keyboard preview, game controls, and Back/Forward
  worked. There was no keyboard trap.
- Required phone targets measured at least 44×44 CSS pixels. At 200% text size,
  the primary action remained available with no horizontal overflow.
- Reduced-motion emulation matched the media query, removed visible transition
  time, and changed smooth scrolling to `auto`.
- Structurally invalid saved `{}` values were removed and recovered to five
  mappings and `0 / 3 ready`, without an error.
- Pitch, hold, and noise controls passed both documented boundaries and
  persisted after reload.
- An invalid `https://` WebSocket address explained the required `ws://` or
  `wss://` form and kept retry enabled.
- Sampling before microphone access focused the permission action. Denied
  access gave a direct recovery message and kept the sample fallback visible.

## Privacy, offline behavior, and response policy

Automatic live requests stayed on the product origin, and fresh contexts set
no cookies. Demo storage and real storage stayed separate. The privacy page and
tested reset path provide the local data-deletion route. The microphone and
voice-retention claims passed with deterministic sentinels.

The service worker controlled a fresh live demo, `registration.update()` left
no waiting worker, and cache `sing-switch-v4` was present. After switching the
browser offline, the populated demo, privacy, terms, and landing routes all
opened correctly.

Live headers include HSTS, `nosniff`, strict-origin referrer policy,
`Permissions-Policy: microphone=(self)`, and a restrictive CSP that permits
only self resources plus user-chosen `ws:`/`wss:` output. The manifest has the
correct `application/manifest+json` type. Hashed JavaScript uses one-year
immutable caching; HTML uses 30-second revalidation.

This product has no backend, tenant data, health endpoint, billing path, or
product-controlled rate limit. Tenant isolation, restart persistence, and 429
checks are therefore not applicable. The optional user-entered WebSocket is an
output integration, not a product backend.

## Candidate identity and performance

The following live files matched the clean candidate build exactly:

| File | SHA-256 |
| --- | --- |
| `/` | `a2555a307dc70997521d81d7589b5c63d1f049fd6f8586422063d91aeced3829` |
| `/assets/main-BtCRxa1l.js` | `459dc2928553d8cc1594d12ed18675fc9ce8f964c9fd1ca703f0aadd558ca58e` |
| `/assets/style-tx1WAZA8.css` | `43cd893237ff66943d9c2fc3411c76e0c0d953a074f5e2e3f50c6b1877857393` |
| `/sw.js` | `b9665e03b24cc4e068d50658dc3cad9ab26bc80a4aaf36f09500c5d8e01dc893` |
| `/manifest.webmanifest` | `f438e04db6c6c8092094f43f116286771b06aca1fdac30eacac750dac103bcd2` |

Fresh mobile Lighthouse 13.4.1 results:

- Performance 98; Accessibility 100; Best Practices 100; SEO 100.
- FCP 1.05 s; LCP 1.34 s; Speed Index 1.05 s.
- Total blocking time 172 ms; CLS 0.0006; transfer 73,549 bytes.

## Earlier finding disposition

| Earlier finding | Current proof | Disposition |
| --- | --- | --- |
| QA-01 vocal pitches aliased and blocked calibration | Clean tests and live 220/330 Hz real calibration completed. | Resolved |
| QA-02 wrong actions counted as recognition | Gate-specific scoring reached 92% and counts requested actions. | Resolved |
| QA-03 malformed settings crashed the app | Live `{}` recovery restored complete defaults without errors. | Resolved |
| QA-04 mobile targets below 44 px | Live phone measurements passed for required targets. | Resolved |
| QA-05 nested complementary landmark | Axe reported zero violations on every public route state. | Resolved |
| R1 sample changed real storage | Live seeded-data edit, reset, and exit preserved real data. | Resolved |
| R2 claims were unlisted and untested | Twenty unique claims and twenty separate commands passed. | Resolved |
| R3 unknown routes returned home with 200 | A fresh unknown URL returned the designed HTTP 404. | Resolved |
| R4 first screen omitted audience and sample action | Both appeared before scrolling on desktop and phone. | Resolved |
| R5 canonical and social metadata were missing | All public routes exposed route metadata and working assets. | Resolved |
| R6 site documents and shared structure were incomplete | Demo/copy docs, legal pages, shared navigation/footer, version, and concrete terms H1 are present. | Resolved |

## Findings

None. Finding count: **0**. Untested claim count: **0**. Final verdict:
**PASS**.
