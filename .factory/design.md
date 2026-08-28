# Sing Switch — visual system

## Thesis

**Luminous glass data landscape.** Sing Switch turns an invisible signal into an
inspectable control surface. The interface should feel like looking through a
smoked studio window at sound as it becomes terrain: a bright pitch trace, thin
calibration strata, and discrete controller nodes. Glass is used only where it
communicates a live layer (microphone, mapping, controller state); functional
content is grouped by proximity instead of a field of generic cards.

The product is explicitly single-mode and dark. A dark acoustic-room backdrop
makes the live pitch trace and state changes legible and lets the instrument-like
surface feel calm in classrooms and low-light play spaces. Every state also uses
text or shape, never color alone.

## Palette

| Token | Value | Purpose |
| --- | --- | --- |
| `--ink-950` | `#07110f` | Deep room background |
| `--ink-900` | `#0b1916` | Raised ground |
| `--glass` | `rgba(20, 46, 40, .72)` | Live signal layers |
| `--line` | `#41665c` | Outlines and inactive tracks |
| `--paper` | `#f4fff9` | Primary text |
| `--mist` | `#b8cdc5` | Secondary text (≥4.5:1 on grounds) |
| `--mint` | `#7fffc4` | Primary action / live signal |
| `--mint-ink` | `#062016` | Text on mint |
| `--violet` | `#c7a8ff` | Mapped-action nodes |
| `--amber` | `#ffd38b` | Hold / caution |
| `--coral` | `#ff9c91` | Errors |
| `--success` | `#9ef4bd` | Confirmed recognition |

The palette comes from a dark rehearsal room: oxidized green-black walls,
mint LED meters, violet patch cables, and the amber glow of an old sustain lamp.
Text and controls meet WCAG AA against their intended backgrounds.

## Type and spacing

- Display: self-hosted **Space Grotesk**, 600/700, for the wordmark, single H1,
  pitch readouts, and numeric game state. Its open forms resemble test equipment
  without becoming retro pastiche.
- Utility/body: system UI (`Inter`-like system stack), 400/600. This avoids a
  second font payload while keeping long instructions familiar and readable.
- Scale: 14px micro-label, 16px body, 20px section title, 28px readout,
  `clamp(42px, 7vw, 76px)` H1. Body line height is 1.55 and prose measure is
  capped at 68 characters.
- Spacing follows a 4/8px rhythm: 4, 8, 12, 16, 24, 32, 48, 72px. Controls are
  at least 44px high with 8px separation.

## Interaction grammar

1. **Listen → place → play.** A numbered three-step rail remains visible so the
   primary next action is apparent within two seconds.
2. Listening is circular and organic; mapped actions are square controller
   nodes. The live pitch line bridges the two shapes.
3. Calibration takes three short samples (low, high, held). Users can retry any
   sample, then tune thresholds numerically. Each sample confirms with text,
   value, and a check mark.
4. The live controller state is exposed as labelled pressed/released switches,
   a copyable JSON object, download, keyboard event dispatch, and optional local
   WebSocket output. No output is hidden behind an account.
5. The mini-game is a single-switch sky ferry: low/high pitch steers vertically,
   hold adds forward thrust, and silence rests. Keyboard alternatives use arrows
   and Space. The target is intentionally forgiving and reports attempts and
   recognition accuracy.

## Depth and motion

- Layering uses a static landscape illustration, subtle one-pixel specular
  borders, shadows, and blur. Decoration never obscures the live meter.
- UI transitions last 180–240ms and use opacity/transform only. Controller nodes
  depress by 2px; progress fills originate at the left; game movement follows
  the player's input rather than autoplay.
- The background does not loop. With `prefers-reduced-motion: reduce`, entrance
  and transform transitions are removed, scrolling is instant, and the game
  updates position without interpolation. Meaning survives via labels, borders,
  and numeric state.

## Responsive intent

At 390px the wide signal landscape becomes a compact vertical meter; controller
nodes wrap into a 2×2 grid; calibration samples stack; secondary educational
copy collapses behind native disclosure controls. The game and primary controls
remain full width. No fixed action bar competes with device safe areas.

## Asset plan and provenance

- `public/assets/sound-landscape.webp` and `.avif`: original generated abstract
  hero landscape. It visualizes a voice waveform crossing translucent controller
  gates; it does not imply speech recognition or a hardware product.
- Functional icons, waveform, meter, and game graphics are authored in HTML/CSS
  or Canvas for deterministic state and crisp scaling.
- Generation model: Azure OpenAI factory image deployment via
  `/opt/fleet/lib/gen-image.sh`; generated 2026-08-28. Original for this product.
- Art-direction prompt: “Use case: stylized-concept. Asset type: wide landing
  page background illustration. A dark abstract acoustic landscape made from
  translucent smoked glass terraces; one luminous mint waveform travels from a
  soft circular vocal source through three precise square controller gates;
  violet and amber refractions, subtle grain, deep oxidized green-black space,
  calm scientific mood, cinematic wide composition, generous dark negative
  space, crisp glass materials, no people, no microphones, no game controller,
  no UI, no letters, no text, no watermark, no logos, no recognizable symbols.”
- The exact request and output metadata are retained in
  `assets/src/sound-landscape.json`. Generated imagery is disclosed in the
  footer.
