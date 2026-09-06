# Review: map vocal gestures to browser controls

## Verdict

**FAIL — 6 findings, including 1 major, and 15 untested public-claim groups.**

- Reviewed implementation: `32c948de816b2779e5f04453b2ade1b1f7708f3f`
- Reviewed documentation commit: `2c54d20fcc17b34db258615800d081c418aaf020`
- Live URL: <https://sing-to-controller.sociobot.in>
- Reviewed: 2026-09-06 UTC
- Scope: static web/PWA only. No product code was changed.

The commits after the implementation candidate change verification/handoff files
and Graphify output, not product code. Fresh SHA-256 comparisons prove that
live `/`, JavaScript, CSS, and `sw.js` exactly match a fresh local build from
this checkout, which has the same product source as the implementation
candidate.

| Resource | SHA-256 |
| --- | --- |
| `/` | `2671553874a5d525e886e25d3f74950a022d6af361e8b8693cb3fa44dabf82fc` |
| `/assets/index-BSR9hsqC.js` | `adef20b86587c6f30775cef5f965950f86e3d909891b5d308eb0a6f848f4655b` |
| `/assets/style-f48blK_E.css` | `9072618718f0e9d26c7c0ae5f419703bc5fe28a2e9ea493739847defc8f9b797` |
| `/sw.js` | `e9c8959f8c41d1ca385bf174a837066c40a3b42701c9c4dfd3a957e493f21170` |

## What a new visitor sees first

Fresh desktop (1440×1000) and phone (390×844) sessions began at scroll
position zero. The page states the job as “Make your voice a game control.”
It does not name the intended audience on that screen. The first action is
“Set up my voice”; the other action is the keyboard path. Neither is “Try it
with sample data,” and the “Use demo setup” button is below the first screen.

The product's intended job is to map low, high, and held vocal gestures to
visible browser controller actions. Its audience is experimental game makers,
music teachers, and accessible-play designers. The first action should let a
new visitor enter the isolated sample immediately.

## Findings

### R1 — Major: the sample is not an isolated demo sandbox

The required one-click sample has no direct `/demo` route or working `?demo=1`
entry. Visiting `/?demo=1` showed the normal app at `0 / 3 ready`. “Use demo
setup” did populate all three samples and a low preview emitted `MOVE_DOWN`,
but it is below the first screen and is not a separate storage namespace.

With deliberately pre-seeded real `sing-switch-calibration` and
`sing-switch-mappings` values, clicking the sample button overwrote both real
keys with the default data. “Reset setup” then deleted those same keys.
There is no persistent “Demo — sample data, nothing is saved” label, no “Reset
demo” action, and no “Start for real” action. This can change or erase a real
visitor's setup and fails the demo-sandbox contract.

Create `/demo` (and make `?demo=1` enter it if retained), use only a `demo:`
storage namespace while its persistent banner is present, and discard that
namespace when leaving. Put “Try it with sample data” in the first screen and
document the route, sample, reset, and namespace in `.factory/demo.md`.

### R2 — Moderate: public claims have no required claim manifest or proof

`.factory/claims.json` is absent, so there are no declared claim commands to
run. The test suite has useful ordinary coverage, but it does not meet the
claims contract: every public claim needs one tagged, observable sandbox test.
The following 15 public-claim groups are therefore unlisted and untested under
that contract:

1. Maps pitch and held notes to browser controls.
2. Calibrates a low, high, and held note in about a minute.
3. Processes audio locally.
4. Does not record, upload, retain, transcribe, or identify voice audio.
5. Does not train a model from the visitor's voice.
6. Saves only thresholds and mappings in local browser storage.
7. Dispatches the `sing-switch` browser event.
8. Produces synthetic keyboard events.
9. Exports compact mapping JSON.
10. Streams controller JSON, not audio, to an optional WebSocket.
11. Provides a keyboard-equivalent game path.
12. Works offline after the first load.
13. Has no accounts, ads, tracking cookies, fingerprinting, or third-party analytics.
14. Does not emulate trusted operating-system input.
15. Does not provide speech recognition or anti-cheat controls.

Add a manifest and one `@claim:<id>` test for every retained group. The privacy
test must record requests for the whole demo flow, and the offline test must
use its own browser context. Remove any claim that cannot be proved.

### R3 — Moderate: an unknown address is a successful home page, not a 404 page

Fresh navigation to `/does-not-exist` returned HTTP 200 and rendered the home
page with title “Sing Switch — voice to browser controls.” It does not give the
visitor a clear missing-page result or a way back from a designed 404 route.

Add a real `404.html` in the product's visual system, a return-home link, and
the Static Web Apps 404 `responseOverrides` configuration. A deliberate HTTP
404 is expected; rendering the landing page as success is the defect.

### R4 — Moderate: the first screen does not meet the plain-words entry contract

The headline describes the broad job, but the accompanying sentence does not
name who it is for. The required visible sample action is missing from the
first screen. “Set up my voice” starts a real setup rather than explaining that
an isolated realistic sample will open. This leaves the first safe action
unclear for a visitor without a microphone.

Use a job headline, a ≤22-word audience sentence, “Try it with sample data,”
and a short statement of what the click loads. Add the required first-screen
facts only after their claim tests exist.

### R5 — Moderate: required route metadata is missing

Live HTML has no canonical link, Open Graph tags, Twitter-card tags, or
180-pixel Apple touch icon. This fails the required site metadata and leaves
shared links without product-specific preview data.

Add canonical, Open Graph, Twitter, and Apple-touch metadata with a real
1200×630 product image, then verify each route title and metadata after build.

### R6 — Minor: required site and review documents are incomplete

There is no `.factory/demo.md` or `.factory/copy-audit.md`. The footer omits
the required “Built by Param Factory” text and version/build id. The legal-page
header also omits the consistent primary navigation. The terms-page H1,
“A small tool, used fairly,” is a vague phrase instead of a page name or clear
plain-language legal purpose.

Add the missing documents, complete the shared header/footer, and replace the
terms H1 with a specific terms heading.

## Demo, normal, invalid, boundary, and recovery checks

The non-isolated sample itself produces realistic populated state: it reaches
`3 / 3 ready`; a low preview shows `MOVE_DOWN`; export downloaded
`sing-switch-mapping.json` with product `sing-switch` and five mappings; reset
returned the display to `0 / 3 ready`. R1 makes that path unsuitable as the
required demo.

Current focused Playwright checks passed for the repaired microphone path,
invalid saved-setting recovery, mobile 44px targets, and automated axe checks.
The deterministic microphone test samples 220 Hz low and 260 Hz high, completes
the held sample, and observes `MOVE_UP`. This supplies current evidence for
the former subharmonic and wrong-action defects. Offline recovery also passed
live: after service-worker activation and `registration.update()`, `/privacy`
reloaded offline with the correct H1 and no console errors.

The optional backend checks do not apply: this is a static product with no
tenant backend or health endpoint. Its optional user-entered WebSocket is an
integration output, not a product backend.

## Earlier findings

| Earlier finding | Current disposition | Evidence |
| --- | --- | --- |
| QA-01 pitch subharmonics block calibration | Resolved | Current desktop and mobile deterministic 220/260 Hz calibration test passed. |
| QA-02 wrong action counted as recognition | Resolved | The same test checks the repaired `MOVE_UP` action and gate-specific accuracy logic. |
| QA-03 malformed saved settings crash app | Resolved | Current desktop and mobile recovery tests passed. |
| QA-04 mobile targets below 44px | Resolved | Current mobile target test passed. |
| QA-05 nested complementary landmark | Resolved | Live axe integration found zero violations; current desktop and mobile axe tests passed. |

## Checks run

| Check | Result |
| --- | --- |
| `npm ci` | PASS — 100 packages installed, 0 vulnerabilities. |
| `npm test` | PASS — 18 Vitest tests passed; Playwright reported 20 passed and 2 intentional project-specific skips. |
| `npm run build` | PASS — TypeScript check and Vite build produced `dist/index.html`. |
| Focused repaired-path tests | PASS — desktop 3 passed/1 expected skip; mobile 4 passed. |
| `/opt/fleet/lib/verify-url.sh` | PASS — HTTP 200, title, `lang=en`, one H1, main, image alt text, and no console errors. |
| Live axe integration | PASS — zero violations after demo/reset audit. |
| Fresh desktop and phone browser sessions | PASS for load, keyboard/focus baseline, no console errors, no failed requests, and no horizontal overflow; failures R1, R3, and R4 remain. |
| Privacy request observation | PASS for observed page/demo requests — only the product origin loaded. This does not turn the privacy copy into a proved claim without R2's required claim test. |
| Service worker update and offline legal reload | PASS — cache `sing-switch-v2`, controlled page, and offline `/privacy` reload. |

No deployment repair is requested by this review. The live deployment is the
reviewed implementation. The report is **FAIL** until every listed finding and
all 15 untested public-claim groups are resolved.
