# Sing Switch verification handoff

## Independent verification 3

**PASS — 0 findings and 0 untested claims.** Independent verification on
6 September 2026 reviewed implementation
`c826ef8ba92893ac34f420ac7dc77e9fd66ce2ae` and documentation baseline
`8dd3898193de55ff1600d74cec36f148cbf6ac5b` against the live deployment.

- All 20 declared claim commands passed separately after `npm ci` in a clean
  detached checkout.
- `npm test` passed 18 unit and 56 browser tests, with 2 intentional skips.
- `npm run build` passed and produced `dist/index.html`.
- Fresh desktop and phone sessions passed the one-click populated demo,
  persistent label, reset, real-data isolation, keyboard, focus, touch target,
  reduced-motion, recovery, legal, metadata, link, and designed 404 checks.
- A fresh real microphone-buffer run calibrated all three gestures, completed
  all three game gates, and reported 92% route-action accuracy.
- Live axe found zero violations on all route states. The factory URL verifier
  found zero console or page errors on `/` and `/demo`.
- Offline demo and legal routes passed after a clean service-worker update.
- Fresh Lighthouse scored 98 Performance and 100 for Accessibility, Best
  Practices, and SEO; LCP was 1.34 s and CLS was 0.0006.
- Live HTML, JavaScript, CSS, service worker, and manifest hashes matched the
  candidate build exactly.

Detailed evidence and all earlier finding dispositions are in
`.factory/verification-3.md`. Runtime artifacts are under `/work/.evidence/`.
No product code was changed, and pre-existing Graphify working-tree changes
remain untouched.

## Result

All six findings in `review-1.md` and all earlier QA findings are resolved.
The repaired product is deployed at <https://sing-to-controller.sociobot.in>.

- Implementation SHA: `c826ef8ba92893ac34f420ac7dc77e9fd66ce2ae`
- Documentation evidence SHA: `56155ddc9e1a56dda277aef9e3f4b8bf637acbed`
  (the substantive handoff commit; the following report-only pointer commit
  adds this identifier and does not change the deployed product)
- Deployed artifact: production `dist/` built from the implementation SHA
- Deployment result: Azure Static Web Apps upload succeeded; the custom domain
  returned HTTPS 200 after deployment.

No backend, tenant database, billing integration, or external AI service is
part of this static, free product.

## What changed

- Added `/demo` and `?demo=1` entry points with three realistic vocal gestures,
  populated controller output, a persistent demo label, **Reset demo**, and
  **Start for real**.
- Isolated demo storage under `demo:sing-switch-*`. Demo entry, changes, reset,
  and exit do not read or alter real `sing-switch-*` settings.
- Added `.factory/claims.json` with 20 public claims and exactly one tagged,
  outcome-based Playwright check for each claim.
- Added a designed 404 document and Azure Static Web Apps response override.
  Unknown public URLs now return HTTP 404 while showing a useful return path.
- Rewrote the first screen to state the job, audience, first actions, local
  audio handling, offline availability, and free/no-account status before
  scrolling on 1280×720 desktop and 390×844 phone viewports.
- Added route-specific titles, descriptions, canonicals, Open Graph and
  Twitter metadata, a 1200×630 social image, and a 180×180 touch icon.
- Added standalone `/privacy` and `/terms` pages, consistent navigation and
  footer structure, version text, sitemap entries, strict response headers,
  and a service-worker cache that covers the demo and legal routes.
- Added `.factory/demo.md`, `.factory/copy-audit.md`, and the verb-first
  catalog description. Updated the README and visual-system provenance.
- Preserved and expanded pitch, action-accuracy, invalid-storage, keyboard,
  focus, reduced-motion, mobile-target, and automated accessibility checks.
- Removed deferred section rendering after cold screenshots showed oversized
  blank capture regions and false empty-button results.

## Finding disposition

| Finding | Disposition and proof |
| --- | --- |
| R1 demo overwrote real storage | Fixed with separate demo keys. The `demo-isolation` test preloads real values, edits and resets the demo, exits, and compares the exact real values. The same flow passed against live HTTPS. |
| R2 no claim manifest/tests | Fixed with 20 declared claims. Every listed command passed individually from a clean detached checkout. |
| R3 unknown routes returned the home page | Fixed. `/final-404-check` returned HTTP 404 and the designed page passed axe. |
| R4 first-screen audience/sample gaps | Fixed. Desktop and phone checks place the job, named audience, both first actions, and three facts above the fold. |
| R5 missing canonical/social metadata | Fixed on `/`, `/demo`, `/privacy`, `/terms`, and the 404 document. The live social and app assets return successfully. |
| R6 incomplete docs/site structure | Fixed with demo/copy docs, legal routes, shared header/footer, build id, and concrete legal headings. |
| Earlier pitch subharmonics and route accuracy | Remain fixed. Deterministic 220 Hz and 330 Hz microphone buffers complete ordered calibration and score only the requested action. |
| Earlier invalid saved data | Remain fixed. Malformed and incomplete values recover to complete defaults without a page error. |
| Earlier mobile targets and axe landmark issue | Remain fixed. Required controls are at least 44×44 CSS pixels; all public routes have zero serious or critical axe issues and zero total axe violations in the final checks. |

## Verification

Clean detached checkout at the implementation SHA:

```sh
npm ci
# Each of the 20 commands in .factory/claims.json, one by one
npm test
npm run build
```

Results:

- `npm ci`: passed; 101 packages audited, 0 vulnerabilities.
- Declared claim commands: 20 of 20 passed individually.
- Unit suite: 18 passed.
- Browser suite: 56 passed, 2 intentional duplicate-project skips. It covers
  desktop, phone, keyboard, focus, reduced motion, errors, boundaries,
  recovery, offline reloads, demo isolation, privacy, routes, and axe.
- Production build: passed. Initial app assets are 38.53 KB JavaScript
  (12.98 KB gzip), 21.50 KB CSS (5.53 KB gzip), two initial WOFF2 files
  totaling 26.07 KB, and a 25.63 KB AVIF hero image.
- `git diff --check`: passed before the implementation commit.

Cold live checks:

- `/`, `/demo`, `/privacy`, and `/terms`: HTTP 200.
- Unknown route: deliberate HTTP 404 with the designed missing-page UI.
- Final live CSS hash matched the deployed `dist/` artifact.
- `verify-url.sh` on `/` and `/demo`: no console errors, one H1, `lang=en`,
  main landmark present, no missing alt text, and no unlabeled buttons.
- Fresh 1280×720 and 390×844 browser contexts: first-screen requirements,
  populated sample, persistent demo label, no horizontal overflow, demo reset,
  real-data isolation, start-for-real cleanup, and 44 px demo targets passed.
- Live axe scan on `/`, `/demo`, `/privacy`, `/terms`, and the designed 404:
  zero violations.
- Live service-worker check: populated demo reload and privacy page both opened
  after the browser was switched offline.
- Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 100,
  SEO 100; LCP 1.3 s, CLS 0.001, total blocking time 40 ms.

Evidence is under `/work/.evidence/`, including `live-root/`, `live-demo/`,
the final phone/demo screenshots, `lighthouse-sing-switch.json`, and the copied
`catalog-description.txt`.

## Known limits

- Browser automation verifies pitch detection with deterministic microphone
  buffers. It cannot reproduce every room, microphone, echo, or voice. The UI
  states that noisy environments can reduce pitch accuracy and keeps keyboard
  controls available.
- The optional WebSocket path is verified with an in-browser receiver that
  inspects every message and confirms that no audio is sent. A visitor-provided
  remote WebSocket remains that visitor's integration responsibility.
- Lighthouse lab runs do not report field INP. Total blocking time was 40 ms,
  and direct keyboard and pointer paths passed.
- The researched offer is free and requires no account. There is no advertised
  paid product offer, so billing registration metadata is not applicable.

## Next step

No required product work remains. Future acoustic field tests can add room and
microphone profiles without changing the local-only privacy model.
