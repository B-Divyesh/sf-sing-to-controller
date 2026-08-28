# Independent product verification 2 — PASS

## Verdict

**PASS.** Candidate `32c948de816b2779e5f04453b2ade1b1f7708f3f` satisfies the researched Sing Switch acceptance contract. The live deployment at <https://sing-to-controller.sociobot.in> was independently confirmed byte-for-byte identical to this candidate's fresh production build. No release-blocking or major defects were found.

- Verified: 2026-08-28 UTC
- Work order: `sing-to-controller-verify-2`
- Artifact: static web/PWA
- Environment: Node 22.23.2, npm 10.9.8, Playwright Chromium 1.58.2 / Chrome 145, Lighthouse 13.4.1
- Method: clean detached Git worktree at exactly the candidate; no product code changed.

## Clean checkout and build

| Check | Result |
| --- | --- |
| `npm ci` | PASS — 100 packages installed; 0 vulnerabilities |
| `npm test` | PASS — 18/18 Vitest assertions and 22/22 Playwright cases (20 pass, 2 expected project-specific skips) |
| Type check | PASS — `tsc --noEmit` is part of the production build |
| Lint | No lint script/tool is configured in `package.json` |
| `npm run build` | PASS — generated `dist/index.html` and hashed assets |

Production output is comfortably within the static-web budgets:

- JavaScript: 34,008 B raw / 11,930 B gzip (≤ 200 KB)
- CSS: 17,778 B raw / 4,830 B gzip (≤ 50 KB)
- Initial WOFF2 files: 26,072 B total (≤ 120 KB)
- Hero WebP: 41,916 B (≤ 300 KB)

## End-to-end product evidence

The live app was exercised in fresh Chromium sessions at desktop 1440×1000 and mobile 390×844.

- Demo calibration reached `3 / 3 ready`; previewing low emitted visible `MOVE_DOWN`; export acknowledged `Mapping exported as JSON.`
- A deterministic, permitted 48 kHz microphone/AudioContext double independently reproduced the repaired vocal path: 220 Hz sampled as low, 260 Hz sampled as high, a held 260 Hz completed the third sample, and the live state emitted `MOVE_UP` plus `BOOST`. This covers the former subharmonic and wrong-direction blockers with repeatable signal evidence.
- Keyboard-only play completed the supplied ferry route in **3 gate attempts**, ending with `Route complete in 3 gate attempts. Your controls are ready to export.`
- A local WebSocket receiver received versioned controller JSON for a pressed high action (`MOVE_UP`, `ArrowUp`) and the subsequent silence/release state.
- Invalid recovery paths pass: sampling before microphone access focuses Allow microphone with clear guidance; denied access explains recovery; malformed saved `{}` settings are discarded and recover to five mapping rows and `0 / 3 ready`; an `https://` WebSocket address is rejected with actionable `ws://`/`wss://` guidance.
- `/privacy` and `/terms` render as standalone routes. The privacy page reloaded successfully while offline after service-worker activation.

## Accessibility, interaction, and visual QA

- Axe 4.10 on live desktop and 390px mobile: **0 violations**, therefore 0 serious and 0 critical findings.
- `lang=en`, descriptive title, exactly one H1, main landmark, labelled controls, image alt text, skip link, and legal routes were verified in the browser.
- Keyboard-only traversal begins with the skip link and preserves a 3px visible focus outline through navigation, hero actions, and microphone controls; no trap was observed.
- At 390px there is 0 px horizontal overflow. Required representative targets are at least 44 px tall: brand 147×44, keyboard-path link 350×44, sliders 300×44, footer brand 147×44, and legal links 58×44 / 47×44.
- Reduced-motion emulation reports the reduced media query, `0.01ms` transitions, and `scroll-behavior: auto`.
- Desktop and mobile visual inspection found the product-specific dark acoustic/glass system intact and readable; scrolled play and output areas render without clipping or overlap.

## Privacy, network, PWA, and response policy

- In a fresh profile, starting the microphone made **zero** additional network requests and left zero cookies, local-storage entries, and session-storage entries. Saved calibration/mappings are local-only after the user chooses to save them. Browser request capture found no third-party requests, analytics, fonts, recording, or upload traffic.
- The optional WebSocket only transmits controller state, not audio, to the user-entered endpoint.
- Live headers include HSTS, `nosniff`, `strict-origin-when-cross-origin`, `Permissions-Policy: microphone=(self)`, and a restrictive self-only CSP with explicitly optional `ws:`/`wss:` connections. Framing and objects are blocked.
- HTML and service worker use 30-second revalidation; hashed assets use `public, max-age=31536000, immutable`; a conditional HTML request returned 304.
- Service worker `sing-switch-v2` became active and controlled the page; its update completed and the privacy route rendered on offline reload.

## Live identity

Fresh SHA-256 comparisons prove the live deployment is the exact candidate build:

| Resource | SHA-256 |
| --- | --- |
| `/` / `dist/index.html` | `2671553874a5d525e886e25d3f74950a022d6af361e8b8693cb3fa44dabf82fc` |
| `/assets/index-BSR9hsqC.js` | `adef20b86587c6f30775cef5f965950f86e3d909891b5d308eb0a6f848f4655b` |
| `/assets/style-f48blK_E.css` | `9072618718f0e9d26c7c0ae5f419703bc5fe28a2e9ea493739847defc8f9b797` |
| `/sw.js` | `e9c8959f8c41d1ca385bf174a837066c40a3b42701c9c4dfd3a957e493f21170` |

## Performance

Live mobile-style Lighthouse run (Lighthouse 13.4.1): Performance **98**, Accessibility **100**, Best Practices **100**, SEO **100**. FCP was 1.1 s, LCP 1.3 s, Speed Index 1.2 s, TBT 170 ms, and CLS 0. No navigation-only lab run can establish field INP; interaction checks showed immediate controller and game-state updates.

## Defects and known limits

No blocker, major, moderate, or minor defects found.

Pitch detection is necessarily dependent on a user's voice and room noise, as the UI and terms disclose. Real-room microphone testing is outside this container; deterministic browser microphone coverage establishes the shipped algorithm's expected quiet-signal behavior without claiming universal acoustic accuracy.
