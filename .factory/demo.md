# Sing Switch demo sandbox

## Entry point

- Live: <https://sing-to-controller.sociobot.in/demo>
- Local: <http://127.0.0.1:5173/demo>
- Compatibility entry: `/?demo=1`

The landing-page action **Try it with sample data** opens `/demo` in one click.

## Sample data

The sample opens with three ready gestures:

| Gesture | Threshold | Browser action | Key |
| --- | ---: | --- | --- |
| Low | 180 Hz | `MOVE_DOWN` | `ArrowDown` |
| High | 360 Hz | `MOVE_UP` | `ArrowUp` |
| Held | 850 ms | `BOOST` | `Space` |

Onset and silence are also present and mapped to no action. The first
controller state shows the low gesture and `MOVE_DOWN`, so the output is
populated before the visitor changes anything.

## Isolation and reset

Demo settings use only these localStorage keys:

- `demo:sing-switch-calibration`
- `demo:sing-switch-mappings`

Demo code never reads or writes the real `sing-switch-calibration` and
`sing-switch-mappings` keys. **Reset demo** restores the sample values in the
demo namespace. **Start for real** deletes both `demo:*` keys and opens the real
setup. It does not copy sample values into real storage.

The persistent banner reads **Demo — sample data, nothing is saved** and stays
visible while scrolling. “Nothing is saved” means nothing is saved to the
visitor's real setup; temporary sample changes remain only in the demo keys
until reset or exit.

## Verification

Run the isolation claim from a clean checkout:

```sh
npm ci
npm run test:claim -- --grep "@claim:demo-isolation"
```

The test preloads distinct real values, modifies and resets the demo, compares
the real values byte for byte, exits demo mode, and confirms the demo keys were
removed.
