# Sing Switch landing-page copy audit

Audited 6 September 2026 from the rendered `/` route. Counts treat hyphenated
terms as one word. No sentence exceeds 22 words. No text contains: leverage,
seamless, effortless, robust, powerful, intuitive, reimagine, supercharge,
unlock, delightful, journey, ecosystem, or AI-powered.

| Rendered copy | Words | Result |
| --- | ---: | --- |
| Vocal controls for browser games | 5 | Pass |
| Turn your voice into browser game controls | 7 | Pass |
| For game makers, music teachers, and accessible-play designers who need simple vocal controls without extra software. | 16 | Pass |
| The sample opens with three ready gestures and populated controller output. | 11 | Pass |
| Audio stays on this device. | 5 | Pass |
| Works offline after the first visit. | 6 | Pass |
| Free. | 1 | Pass |
| No account. | 2 | Pass |
| Calibrate three vocal gestures | 4 | Pass |
| Use a comfortable hum in a quiet room. | 8 | Pass |
| Sing Switch saves only your thresholds and mappings. | 8 | Pass |
| Start microphone input | 3 | Pass |
| Microphone access starts only when you ask. | 7 | Pass |
| Save three thresholds | 3 | Pass |
| Sing low and steady for 2 seconds. | 7 | Pass |
| Move clearly above your low note. | 6 | Pass |
| Sustain any comfortable note. | 4 | Pass |
| Start the microphone, then sample in any order. | 8 | Pass |
| Map gestures to browser actions | 5 | Pass |
| The defaults fit the test game. | 6 | Pass |
| Onset means a sound started. | 5 | Pass |
| Silence releases active controls. | 4 | Pass |
| Preview each mapped action | 4 | Pass |
| How it works | 3 | Pass |
| Set up, test, and connect | 5 | Pass |
| Calibrate your voice. | 3 | Pass |
| Sample one low note, one high note, and one held note. | 11 | Pass |
| Map each gesture. | 3 | Pass |
| Choose the browser action and keyboard code for each sound. | 9 | Pass |
| Test the result. | 3 | Pass |
| Play the three-gate game, then export or stream controller data. | 10 | Pass |
| Test controls in a three-gate game | 6 | Pass |
| Low moves down. | 3 | Pass |
| High moves up. | 3 | Pass |
| A held note adds speed. | 5 | Pass |
| You can also use ↓, ↑, and Space. | 6 | Pass |
| Start the route and microphone to compare controls with each gate. | 11 | Pass |
| Export or send controller data | 5 | Pass |
| Each change dispatches a sing-switch browser event. | 7 | Pass |
| You can export the mapping or stream controller JSON. | 9 | Pass |
| Only controller data is sent—never audio. | 7 | Pass |
| Start a local receiver, then connect. | 6 | Pass |
| What Sing Switch does not do | 6 | Pass |
| It does not transcribe speech, identify voices, or train a model. | 11 | Pass |
| Browser keyboard events stay synthetic. | 5 | Pass |
| This is not an anti-cheat tool. | 6 | Pass |
| Use a headset or raise the noise gate. | 8 | Pass |
| Keep another input method available. | 5 | Pass |
| Map vocal gestures to browser game controls. | 7 | Pass |

## First-screen read-aloud check

“Turn your voice into browser game controls. For game makers, music teachers,
and accessible-play designers who need simple vocal controls without extra
software. Try it with sample data.”

This states the job, audience, and first action in one breath. The adjacent
sentence explains that the click opens three gestures and populated output.

## Terminology

| Concept | One term used |
| --- | --- |
| A detected vocal category | gesture |
| A configured output | browser action |
| The public JSON payload | controller state |
| Saved real calibration and mappings | setup |
| Isolated sample mode | demo |
| Optional network output | WebSocket |
| Supplied test experience | test game |

“Note” appears only for a sung pitch, while “gesture” names the detected input
category. “Key” refers only to a keyboard code; the product has no accounts or
API keys.
