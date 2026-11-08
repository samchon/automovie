# Video prompt source bindings

These are planned, unsubmitted video-diffusion requests under the [prompt-preparation commission](../../../PROJECT.md#video-generation-prompts), rewritten on 2026-11-08 for the restructured [screenplay](../../body/screenplay/kickboxing.md). Each request restyles one interval of the deterministic render; the render carries motion, camera, contact and timing, and the text carries only appearance and finish. No clip has been cut, uploaded or generated.

## Segment coverage {#coverage}

| # | Record | Global seconds | Frames at 30 fps | Screenplay scene |
| ---: | --- | --- | --- | --- |
| 1 | [Reading each other](reading-each-other.md) | [0, 15) | 0–449 | [s01](../../body/screenplay/kickboxing.md#s01) |
| 2 | [A finishes with the leg](a-finishes-with-the-leg.md) | [15, 30) | 450–899 | [s02](../../body/screenplay/kickboxing.md#s02) |
| 3 | [B plays the long game](b-plays-the-long-game.md) | [30, 45) | 900–1349 | [s03](../../body/screenplay/kickboxing.md#s03) |
| 4 | [Pressure changes hands](pressure-changes-hands.md) | [45, 60) | 1350–1799 | [s04](../../body/screenplay/kickboxing.md#s04) |
| 5 | [The body kick lands](the-body-kick-lands.md) | [60, 75) | 1800–2249 | [s05](../../body/screenplay/kickboxing.md#s05) |
| 6 | [Feints find the openings](feints-find-the-openings.md) | [75, 90) | 2250–2699 | [s06](../../body/screenplay/kickboxing.md#s06) |
| 7 | [B's longest combination](b-longest-combination.md) | [90, 105) | 2700–3149 | [s07](../../body/screenplay/kickboxing.md#s07) |
| 8 | [A weathers it](a-weathers-it.md) | [105, 120) | 3150–3599 | [s08](../../body/screenplay/kickboxing.md#s08) |
| 9 | [A sets the trap](a-sets-the-trap.md) | [120, 135) | 3600–4049 | [s09](../../body/screenplay/kickboxing.md#s09) |
| 10 | [The Brazilian kick](the-brazilian-kick.md) | [135, 150) | 4050–4499 | [s10](../../body/screenplay/kickboxing.md#s10) |
| 11 | [Down and the count](down-and-the-count.md) | [150, 167) | 4500–5009 | [s11](../../body/screenplay/kickboxing.md#s11) |
| 12 | [Knockout and celebration](knockout-and-celebration.md) | [167, 180) | 5010–5399 | [s12](../../body/screenplay/kickboxing.md#s12) |

The twelve segments cover [0, 180) seconds, all 5400 frames, with no gap and no overlap; each follows one screenplay scene, the last two following the count and the celebration.

## Shared paragraphs {#shared}

Every request opens with the restyle paragraph and closes with the identity, ring, impact and exclusion paragraphs below, verbatim; only its action paragraph differs.

### Restyle {#restyle}

> Turn @Video1, a coarse 3D motion render, into photorealistic live-action footage of a professional kickboxing bout, shot like a high-end sports documentary. Use @Video1 as the sole reference for motion, camera and timing: keep its three people, their positions and spacing, every strike, block, contact and fall, and its camera path exactly.

### Identity {#identity}

> Fighter A, in red gloves, is a 28-year-old man, 180 cm and 80 kg, with broad shoulders, a thick athletic trunk and warm medium skin, in red mid-thigh shorts with a pale waistband, wrist wraps and a mouthguard. Fighter B, in cyan gloves, is a 30-year-old man of the same build with dark cool skin, in navy shorts with cyan side stripes, wrist wraps and a mouthguard. Both are bare-chested and barefoot. The referee is a 178 cm man in a white long-sleeve shirt, black trousers and black shoes with bare hands.

### Ring {#ring}

> An indoor ring at night: a pale matte canvas, four taut ropes on padded posts, one red and one cyan corner, two light-padded neutral corners, a dark apron and darkness beyond the ropes where no audience is visible. Broad neutral overhead light with soft frontal fill.

### Impact {#impact}

> Every landed blow visibly sinks into what it meets and throws sweat off the struck skin; a clean blow to the face throws a light spray of blood; struck skin stays reddened. Blocked blows meet gloves, forearms or shins without spray.

### Exclusions {#exclusions}

> Keep realistic anatomy and closed fists inside the gloves. Keep blood sports-realistic: light spray and small drops only, no open wounds or gore. Add no other people, visible audience, text, captions, logos, slow motion or cuts.

## Sources {#sources}

The paragraphs restate [Fighter A](../../body/settings/cast/fighter-a.md), [Fighter B](../../body/settings/cast/fighter-b.md), the [referee](../../body/settings/cast/referee.md), the [ring](../../body/settings/sets/ring.md) and each scene's beats; hair, age styling and the documentary finish are delegated production choices. The receiving model's limits are in the [Seedance 2.5 handoff contract](../../research/video-generation/seedance-2-5-handoff-contract.md) and need a fresh check before any submission.

## Export {#export}

Cut each segment from the delivered render `media/automovie/kickboxing/videos/film.mp4` with `ffmpeg -i film.mp4 -ss <start> -t <seconds> -an -c:v libx264 -pix_fmt yuv420p -r 30 segments/<record>.mp4`, check that it decodes to 30 x seconds frames, and record its bytes and SHA-256 in its request record before any upload.
