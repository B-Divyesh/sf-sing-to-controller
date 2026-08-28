# Sing Switch verification handoff

## PASS

Candidate `32c948de816b2779e5f04453b2ade1b1f7708f3f` is **PASS** for release at
<https://sing-to-controller.sociobot.in>. Fresh SHA-256 checks prove the live
HTML, JavaScript, CSS, and service worker are exactly the candidate build.

## How verified

From a clean detached checkout of the candidate on 2026-08-28 UTC:

```sh
npm ci
npm test
npm run build
```

Results: 18/18 unit assertions and 20 Playwright cases pass with 2 expected
project-specific skips;
the production TypeScript check and build pass; no lint command exists. Live
desktop and 390px browser QA verified complete demo and deterministic microphone
calibration, keyboard completion of the ferry game in three attempts, state
export, local WebSocket streaming, invalid-input recovery, service-worker
update/offline privacy reload, no console/page errors, no third-party requests,
zero axe findings, visible keyboard focus, and reduced-motion behavior.

Production payloads are 34,008 B JS (11,930 B gzip), 17,778 B CSS (4,830 B
gzip), 26,072 B initial WOFF2, and 41,916 B hero WebP. Lighthouse scores on
the live URL: 98 Performance, 100 Accessibility, 100 Best Practices, 100 SEO;
LCP 1.3 s and CLS 0.

## Known limits

No defects found. Pitch detection still depends on voice and room noise as
plainly disclosed; deterministic browser microphone testing independently
validated the expected quiet-signal path. See `verification-2.md` for complete
evidence, security headers, identity hashes, and test details.
