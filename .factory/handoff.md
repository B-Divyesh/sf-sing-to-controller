# Sing Switch independent verification handoff

## Result: FAIL

Candidate `e35d52117f740f7087c12fdc705b8dffd421272c` was independently
verified on 2026-08-28 against
<https://sing-to-controller.sociobot.in>. The live executable and render assets
match the candidate byte for byte, but the product does not satisfy its core
vocal-control acceptance contract.

The release blocker is deterministic pitch aliasing: common inputs such as
260 Hz, 360 Hz, 550 Hz, 700 Hz, and 900 Hz are reported as subharmonics. In a
representative calibration, low 220 Hz saved correctly but high 260 Hz was read
as 87 Hz and rejected, leaving calibration at `1 / 3 ready`. Separately, the
session metric showed 96% recognition for that wrong 260 Hz → `Low` /
`MOVE_DOWN` result, so it does not establish the required 90% action accuracy.

Full evidence, reproduction details, asset hashes, and all lower-severity
findings are in [verification.md](verification.md).

## Verification completed

- Clean detached checkout at the exact candidate
- `npm ci`: pass, 0 vulnerabilities
- `npm test`: pass, 4 unit + 14 Playwright checks
- `npm run build`: pass, including `tsc --noEmit`; `dist/` produced
- No separate lint script exists
- Independent normal, boundary, invalid-input, recovery, persistence, export,
  CustomEvent, synthetic-keyboard, real local-WebSocket, microphone
  allow/deny/start/stop, and three-gate keyboard-game checks
- Live desktop and 390×844 mobile browser checks
- Factory `verify-url.sh` pass
- Axe: 0 serious/critical; one moderate nested-landmark finding
- Lighthouse mobile: 99 performance, 100 accessibility, 100 best practices,
  100 SEO; LCP 1.291 s, TBT 118 ms, CLS 0.0004
- Privacy/storage/outbound-request and response-header inspection
- Service-worker update check and successful offline `/privacy` reload
- Live/local SHA-256 comparison for HTML, JS, CSS, hero, manifest, and SW

## Other defects

- Moderate: structurally invalid saved JSON causes `t.map is not a function`
  and removes the mapping UI instead of recovering to defaults.
- Moderate: multiple mobile links and sliders are below the required 44×44 CSS
  px target size.
- Minor: axe reports a nested complementary landmark for the tuning `<aside>`.

## Re-run

```sh
npm ci
npm test
npm run build
npm run preview -- --host 127.0.0.1
```

No product code was modified. The only intended repository changes from this
verification are `.factory/verification.md` and this handoff.
