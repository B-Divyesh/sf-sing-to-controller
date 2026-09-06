# Sing Switch

Sing Switch maps low, high, and held vocal gestures to browser game controls.
It is for experimental game makers, music teachers, and accessible-play
designers who need a small, inspectable input layer.

Live product: <https://sing-to-controller.sociobot.in>

Sample demo: <https://sing-to-controller.sociobot.in/demo>

## Try the sample

Open `/demo` to load three calibrated gestures and a populated controller
state. The banner stays visible while demo mode is active. Use **Reset demo**
to restore the sample. Use **Start for real** to discard `demo:*` storage and
return to the real setup.

Demo mode never reads or changes the real `sing-switch-*` storage keys. See
[`.factory/demo.md`](.factory/demo.md) for the sample and namespace contract.

## What it does

- Calibrates a low note, a high note, and a held note.
- Maps pitch, onset, hold, and silence to configurable browser actions.
- Dispatches a versioned `sing-switch` browser event.
- Emits browser-untrusted synthetic keyboard events for previews.
- Copies controller state and exports calibration plus five mappings as JSON.
- Optionally sends controller JSON, never audio, to a WebSocket you enter.
- Includes a keyboard-accessible three-gate test game.
- Works offline after the first successful visit.

Microphone analysis stays on the device. Sing Switch does not record, retain,
transcribe, identify, or train on voice audio. A real setup stores only
calibration thresholds and mappings in localStorage. There are no accounts,
ads, tracking cookies, fingerprinting, or third-party analytics.

Pitch detection can fail around noise, echoes, or multiple voices. Sing Switch
does not provide speech recognition, trusted operating-system input, or
anti-cheat controls. Keep another input method available.

## Run and verify

Use Node.js 20 or newer. Playwright 1.58.2 is pinned in `package.json`.

```sh
npm ci
npm test
npm run build
```

`npm test` runs unit, browser, accessibility, mobile, demo-isolation, privacy,
and offline checks. Every public claim is declared in
[`.factory/claims.json`](.factory/claims.json). Run one claim from a clean
checkout with its listed command, for example:

```sh
npm run test:claim -- --grep "@claim:demo-isolation"
```

Start a development server with `npm run dev`. Preview the production build
with `npm run preview`. Microphone access requires HTTPS or localhost.

## Build and deploy

`npm run build` writes the static product to `dist/`, with `index.html` at its
root. Deploy that directory to Azure Static Web Apps. The included
`staticwebapp.config.json` supplies route rewrites, security headers, cache
policy, and the designed HTTP 404 response.

## Integration

Listen for controller changes on the same page:

```js
window.addEventListener('sing-switch', (event) => {
  const { gesture, pitchHz, activeActions, keys } = event.detail;
});
```

The optional WebSocket sends the same versioned controller state. Synthetic
keyboard events have `isTrusted === false`; use the custom event or WebSocket
for a production integration.

The researched scope is in [`.factory/brief.json`](.factory/brief.json). The
visual system and original asset provenance are in
[`.factory/design.md`](.factory/design.md). Verification and remaining limits
are recorded in [`.factory/handoff.md`](.factory/handoff.md).

## License

MIT © 2026 Sociobot (Param Factory).
