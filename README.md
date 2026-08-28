# Sing Switch

Sing Switch turns simple vocal pitch and sustained-note gestures into visible
browser game controls. It is for experimental game makers, music teachers, and
accessible-play designers who want an inspectable input layer without training
a model or installing audio middleware.

Live: <https://sing-to-controller.sociobot.in>

## What it does

- Calibrates a comfortable low note, high note, and held note in about a minute.
- Maps pitch, onset, hold, and silence gestures to named controller actions.
- Dispatches a `sing-switch` `CustomEvent`, previews synthetic keyboard events,
  exports a compact JSON mapping, and optionally streams controller-state JSON
  to a user-supplied WebSocket.
- Includes a keyboard-equivalent accessibility game for checking the mapping.
- Processes audio locally and works offline after the first load.

It does not record audio, recognize speech, identify voices, emulate trusted
operating-system input, or provide anti-cheat controls. Pitch detection is best
with one steady voice in a quiet room.

## Run and verify

Requires Node.js 20 or newer.

```sh
npm ci
npm run dev
npm test
npm run build
```

The production command is exactly `npm run build`. It writes the static site to
`dist/` with `dist/index.html` at the root. Preview it with `npm run preview`.
Microphone access requires HTTPS or localhost.

## Integration

Listen for state updates in the same page:

```js
window.addEventListener('sing-switch', (event) => {
  const { gesture, pitchHz, activeActions, keys } = event.detail;
});
```

The optional WebSocket sends the same versioned JSON state. Synthetic keyboard
events have `isTrusted === false`, as required by browsers; use the custom event
or WebSocket for a production integration.

Mappings and calibration values are stored only in local browser storage. See
[`/privacy`](https://sing-to-controller.sociobot.in/privacy) for details.

The researched scope is in [`.factory/brief.json`](.factory/brief.json), the
product-specific visual system and asset provenance are in
[`design.md`](.factory/design.md), and final verification notes are in
[`handoff.md`](.factory/handoff.md).

## License

MIT © 2026 Sociobot (Param Factory).
