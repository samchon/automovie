# Counters between the hands

Status: complete planned English prompt and unsubmitted payload template. Segment 6 of 12 in the [coverage table](source-bindings.md#coverage). The source clip has not been exported; no upload, provider task, paid job or generated take exists.

## Intended clip and request {#request}

| Field | Planned value |
| --- | --- |
| Local clip | `media/automovie/kickboxing/videos/segments/counters-between-the-hands.mp4`, pending export from the re-exported whole render |
| Whole-render global interval | [75, 90) seconds |
| Local interval | [0, 15) seconds |
| Global included frames at 30 fps | 2250–2699 |
| Local included frames | 0–449 |
| Intended profile | 1280×720, 16:9, 30 fps, H.264/yuv420p MP4, no audio track |
| Actual clip SHA-256, bytes and probe | Pending actual export; nothing here is a measurement |
| Whole render | `output/kickboxing.mp4`, pending re-export of the current source revision ([export state](source-bindings.md#export)) |
| Planned receiving model and mode | `dreamina-seedance-2-5-260628`, reference |
| Request budget | One 15-second video; 0 continuity videos, 0 images, 0 audio references |
| Upload | `{{SOURCE_CLIP_PUBLIC_URL}}`, unresolved; a local path is not a URL |
| Exact request | [payloads/counters-between-the-hands.json](payloads/counters-between-the-hands.json), 4458 bytes, raw LF SHA-256 `d7dc3338ed3d721988d0360a1383e2a65fe4c03e8560158598abb29fc4a87308` |
| Exact prompt length | 727 English whitespace-delimited words |

The single 15-second video stays below the carried 30-second / 10-video aggregate, and its raster, rate and container follow the [carried contract](../../../docs/research/seedance-2-5-handoff-contract.md). The maximum generated-output duration is unknown there and must be confirmed before submission. Native audio is disabled. No first/last-frame role is mixed with reference mode.

## Creative source mapping {#sources}

[Source bindings](source-bindings.md#source-epoch) own the raw SHA-256 of every source read, and [shared bases](source-bindings.md#shared-bases) map the identity, ring, impact and exclusion paragraphs, identical in all twelve requests, and the camera paragraph. This request's action paragraph consumes [screenplay#ring-bout](../../body/screenplay/kickboxing.md#ring-bout), raw SHA-256 `e37d7a62cd9f2b33fd95ba955c58560030baffbd674d83889e7f7f521943f1c8`, under “75–90: Counters Between the Hands”.

Literal basis: “Sweat jumps off the struck ribs.”

[BoutScript](../../../src/shots/kickboxing/ring-bout/BoutScript.ts), raw SHA-256 `860798c2df95b5ab6971aa87160bff6c23213c9af887d8914ea84c4314540ef7`, supplies the contact or closest-pass second of every exchange in the interval. Local seconds in the prompt are these values minus 75:

| Row id | Global s | Local s | Attacker, technique → answer |
| --- | ---: | ---: | --- |
| `x060-b-jab` | 76.3 | 1.3 | B, jab → parry |
| `x061-b-cross` | 76.65 | 1.65 | B, cross → cover |
| `x062-a-jab` | 77.15 | 2.15 | A, jab → slip |
| `x063-b-body-cross` | 77.9 | 2.9 | B, body-cross → hit |
| `x064-a-jab` | 78.5 | 3.5 | A, jab → slip |
| `x065-b-low-kick` | 79.9 | 4.9 | B, low-kick → check |
| `x066-a-cross` | 80.8 | 5.8 | A, cross → cover |
| `x067-b-jab` | 81.25 | 6.25 | B, jab → slip |
| `x068-a-body-hook` | 82.4 | 7.4 | A, body-hook → hit |
| `x069-b-cross` | 82.95 | 7.95 | B, cross → slip |
| `x070-b-jab` | 83.7 | 8.7 | B, jab → slip |

Clean landings in this clip, each with a camera jolt from [FilmPlan](../../../src/shots/kickboxing/ring-bout/FilmPlan.ts): `x063-b-body-cross` at local 2.9 s, `x068-a-body-hook` at local 7.4 s. Body landings (`x063-b-body-cross`, `x068-a-body-hook`) sink in with a sweat spray and leave reddened skin. The opening sentence of the action paragraph states the skin marks accumulated from earlier landings, following the screenplay's “Every landed blow sinks into what it meets: gloves flatten against gloves, ribs and faces, sweat flies off struck skin, and skin stays reddened where it was hit.”

The text supplies live-action identities, ring, light, impact detail and finish; the reference clip supplies movement, contact, camera and timing. These roles are semantic guidance, not a tested generator result or exact-frame following.

## Exact planned English prompt {#prompt}

Turn @Video1, a coarse 3D motion render, into photorealistic live-action footage of a professional kickboxing bout, shot like a high-end sports documentary. Use @Video1 as the sole reference for motion, camera and timing: keep its three people, their positions and spacing, every strike, contact and miss, every defence and footstep, and its camera path, with no cuts. This 15-second clip is part 6 of 12 of one continuous 180-second take.

The performer in red gloves is fighter A: a 28-year-old man, 180 cm and 80 kg, with broad shoulders, a thick athletic trunk, developed arms and thighs, warm medium skin and short-cropped dark hair. He wears red boxing gloves over wrist wraps, red mid-thigh shorts with a pale waistband and a mouthguard; his chest and feet are bare. The performer in cyan gloves is fighter B: a 30-year-old man of the same height and competitive build, with dark cool-toned skin and a closely shaved head. He wears cyan gloves over wrist wraps, navy mid-thigh shorts with cyan side stripes and a mouthguard; his chest and feet are bare. The man in white is the referee: an adult of 178 cm with a regular athletic build and short dark hair, in a white long-sleeve shirt, black trousers and black shoes, with bare hands.

The setting is an indoor kickboxing ring at night: a pale matte canvas, four taut ropes on padded posts, two diagonally opposite light-padded neutral corners, one red and one cyan corner, a dark apron and darkness beyond the ropes. Broad neutral overhead light with soft frontal fill separates gloves, limbs and contact shadows.

The camera stands inside the ropes on A's left side of the fighting line, about 2.75 m from the pair at chest height, with a moderate wide lens of about 27 mm full-frame equivalent, and drifts slowly along that side. A stays screen-left, B screen-right and the referee behind their line; heads, gloves and bare feet stay in frame together.

Show the force of every landed blow. The glove or shin visibly sinks into the flesh it meets and the glove flattens against it; sweat sprays off the struck skin, less when a guard takes the blow. A clean blow to the face also throws a light spray of blood from the nose, mouth or cheek, and the struck man winces with his eyes squeezed shut and brows lowered for about half a second. Every clean landing jolts the camera with a brief damped vertical shake of about 0.3 s. Struck skin reddens and stays marked, darkening on the faces and struck rib sides as the round goes on, and both men's skin grows slick with sweat.

Both faces and the struck rib sides stay reddened. A changes the angle. At 1.3 s his right glove brushes B's jab aside and his left glove and forearm absorb B's cross; A's jab misses B's slip. At 2.9 s B lowers and lands a right straight on A's left body side, sinking in with a spray of sweat as the camera jolts; A's breath breaks, he pulls the elbow home and jabs past B's slip. At 4.9 s B's right low kick meets A's raised lead shin check; A's lead foot returns and his cross meets B's cover, and B's quick jab misses as A moves his head outside it. At 7.4 s A turns into a left body hook beneath B's right elbow: sweat jumps off the struck ribs, the camera jolts and B gives through his trunk with an exhale. B's cross at 7.95 s and jab at 8.7 s both miss A's slips, the glove passing his cheek without contact. They separate with different short exit steps.

Between exchanges both men keep moving with separate small steps about 1.8 m apart, guards up and breathing hard; they step in for each attack and back out after it.

Keep realistic human anatomy, closed fists inside the gloves and the gloves on the hands. Keep the blood sports-realistic: light spray and small drops only, with no open wounds, cuts, pools of blood or gore. Add no other people, visible audience, cornermen, text, captions, logos, scoreboard or slow motion, and do not turn any miss or block in the reference into a hit. Generate no audio; the film keeps its own soundtrack. This request uses semantic motion reference, not a guarantee of identical frames.

## Output and retention boundary {#retention}

Availability: the source clip does not yet exist, and no input or output bytes are retained for this request. After export, add the clip's measured duration, frames, profile, bytes, SHA-256 and first/last-frame observations here, with the whole render's identity, keeping this planned epoch. A future submission becomes its own attributable attempt with the exact sent payload, job ID and retained outputs under [generation records](../../../.agents/skills/production/generation-records.md). Large files stay in ignored `media/automovie/kickboxing/videos/segments/` or `media/diffusion/videos/`; Git keeps these records, not the media.
