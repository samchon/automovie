# A turns back into range

Status: complete planned English prompt and unsubmitted payload template. Segment 9 of 12 in the [coverage table](source-bindings.md#coverage). The source clip has not been exported; no upload, provider task, paid job or generated take exists.

## Intended clip and request {#request}

| Field | Planned value |
| --- | --- |
| Local clip | `output/segments/a-turns-back-into-range.mp4`, pending export from the re-exported whole render |
| Whole-render global interval | [120, 135) seconds |
| Local interval | [0, 15) seconds |
| Global included frames at 30 fps | 3600–4049 |
| Local included frames | 0–449 |
| Intended profile | 1280×720, 16:9, 30 fps, H.264/yuv420p MP4, no audio track |
| Actual clip SHA-256, bytes and probe | Pending actual export; nothing here is a measurement |
| Whole render | `output/kickboxing.mp4`, pending re-export of the current source revision ([export state](source-bindings.md#export)) |
| Planned receiving model and mode | `dreamina-seedance-2-5-260628`, reference |
| Request budget | One 15-second video; 0 continuity videos, 0 images, 0 audio references |
| Upload | `{{SOURCE_CLIP_PUBLIC_URL}}`, unresolved; a local path is not a URL |
| Exact request | [payloads/a-turns-back-into-range.json](payloads/a-turns-back-into-range.json), 4626 bytes, raw LF SHA-256 `058dbca9260a73200c5779413fef9fa1e92efd867a3d8a15b7636b41a28bcd94` |
| Exact prompt length | 753 English whitespace-delimited words |

The single 15-second video stays below the carried 30-second / 10-video aggregate, and its raster, rate and container follow the [carried contract](../../../docs/research/seedance-2-5-handoff-contract.md). The maximum generated-output duration is unknown there and must be confirmed before submission. Native audio is disabled. No first/last-frame role is mixed with reference mode.

## Creative source mapping {#sources}

[Source bindings](source-bindings.md#source-epoch) own the raw SHA-256 of every source read, and [shared bases](source-bindings.md#shared-bases) map the identity, ring, impact and exclusion paragraphs, identical in all twelve requests, and the camera paragraph. This request's action paragraph consumes [screenplay#ring-bout](../../body/screenplay/kickboxing.md#ring-bout), raw SHA-256 `e37d7a62cd9f2b33fd95ba955c58560030baffbd674d83889e7f7f521943f1c8`, under “120–135: A Turns Back Into Range”.

Literal basis: “The jab lands on B's already reddened face and his head jerks back with a fresh spray of sweat and blood”

[BoutScript](../../../src/bout/BoutScript.ts), raw SHA-256 `860798c2df95b5ab6971aa87160bff6c23213c9af887d8914ea84c4314540ef7`, supplies the contact or closest-pass second of every exchange in the interval. Local seconds in the prompt are these values minus 120:

| Row id | Global s | Local s | Attacker, technique → answer |
| --- | ---: | ---: | --- |
| `x092-a-body-cross` | 121.4 | 1.4 | A, body-cross → catch |
| `x093-b-jab` | 121.95 | 1.95 | B, jab → slip |
| `x094-a-body-hook` | 122.7 | 2.7 | A, body-hook → hit |
| `x095-b-cross` | 123.25 | 3.25 | B, cross → slip |
| `x096-a-body-kick` | 124.9 | 4.9 | A, body-kick → block |
| `x097-b-jab` | 126.2 | 6.2 | B, jab → parry |
| `x098-b-cross` | 126.55 | 6.55 | B, cross → cover |
| `x099-a-jab` | 127.05 | 7.05 | A, jab → slip |
| `x100-b-cross` | 128.3 | 8.3 | B, cross → slip |
| `x101-a-jab` | 128.85 | 8.85 | A, jab → hit |
| `x102-a-cross` | 129.25 | 9.25 | A, cross → cover |

Clean landings in this clip, each with a camera jolt from [FilmPlan](../../../src/film/FilmPlan.ts): `x094-a-body-hook` at local 2.7 s, `x101-a-jab` at local 8.85 s. Face landings (`x101-a-jab`) add the screenplay's blood spray and the hint's half-second wince from [Reaction](../../../src/bout/Reaction.ts). Body landings (`x094-a-body-hook`) sink in with a sweat spray and leave reddened skin. The opening sentence of the action paragraph states the skin marks accumulated from earlier landings, following the screenplay's “Every landed blow sinks into what it meets: gloves flatten against gloves, ribs and faces, sweat flies off struck skin, and skin stays reddened where it was hit.”

The text supplies live-action identities, ring, light, impact detail and finish; the reference clip supplies movement, contact, camera and timing. These roles are semantic guidance, not a tested generator result or exact-frame following.

## Exact planned English prompt {#prompt}

Turn @Video1, a coarse 3D motion render, into photorealistic live-action footage of a professional kickboxing bout, shot like a high-end sports documentary. Use @Video1 as the sole reference for motion, camera and timing: keep its three people, their positions and spacing, every strike, contact and miss, every defence and footstep, and its camera path, with no cuts. This 15-second clip is part 9 of 12 of one continuous 180-second take.

The performer in red gloves is fighter A: a 28-year-old man, 180 cm and 80 kg, with broad shoulders, a thick athletic trunk, developed arms and thighs, warm medium skin and short-cropped dark hair. He wears red boxing gloves over wrist wraps, red mid-thigh shorts with a pale waistband and a mouthguard; his chest and feet are bare. The performer in cyan gloves is fighter B: a 30-year-old man of the same height and competitive build, with dark cool-toned skin and a closely shaved head. He wears cyan gloves over wrist wraps, navy mid-thigh shorts with cyan side stripes and a mouthguard; his chest and feet are bare. The man in white is the referee: an adult of 178 cm with a regular athletic build and short dark hair, in a white long-sleeve shirt, black trousers and black shoes, with bare hands.

The setting is an indoor kickboxing ring at night: a pale matte canvas, four taut ropes on padded posts, two diagonally opposite light-padded neutral corners, one red and one cyan corner, a dark apron and darkness beyond the ropes. Broad neutral overhead light with soft frontal fill separates gloves, limbs and contact shadows.

The camera stands inside the ropes on A's left side of the fighting line, about 2.75 m from the pair at chest height, with a moderate wide lens of about 27 mm full-frame equivalent, and drifts slowly along that side. A stays screen-left, B screen-right and the referee behind their line; heads, gloves and bare feet stay in frame together.

Show the force of every landed blow. The glove or shin visibly sinks into the flesh it meets and the glove flattens against it; sweat sprays off the struck skin, less when a guard takes the blow. A clean blow to the face also throws a light spray of blood from the nose, mouth or cheek, and the struck man winces with his eyes squeezed shut and brows lowered for about half a second. Every clean landing jolts the camera with a brief damped vertical shake of about 0.3 s. Struck skin reddens and stays marked, darkening on the faces and struck rib sides as the round goes on, and both men's skin grows slick with sweat.

Both faces and struck rib sides are darkening. At 1.4 s A's right straight toward the body is caught by B's lowered left glove; B's jab misses A's slip. At 2.7 s A's left body hook reaches beneath B's right elbow and sinks in, throwing sweat as the camera jolts; B exhales and turns with it, and his cross misses A's slipping head. At 4.9 s A's right body kick meets B's braced left forearm; A bends the knee clear and replants behind his lead foot. At 6.2 s B's jab meets A's right-glove parry and his cross lands on A's raised left glove and forearm; A's counter jab misses B's slip. At 8.3 s B's cross misses A's moving head. At 8.85 s A's jab lands on B's already reddened face: his head jerks back along the punch with a fresh spray of sweat and blood, the camera jolts, his trunk follows and he takes a short stagger step, wincing with eyes shut and mouth open. At 9.25 s A's cross meets B's closed guard and B's knees absorb it. They recover with short separate steps; the referee's gaze moves from the gloves to their feet.

Between exchanges both men keep moving with separate small steps about 1.8 m apart, guards up and breathing hard; they step in for each attack and back out after it.

Keep realistic human anatomy, closed fists inside the gloves and the gloves on the hands. Keep the blood sports-realistic: light spray and small drops only, with no open wounds, cuts, pools of blood or gore. Add no other people, visible audience, cornermen, text, captions, logos, scoreboard or slow motion, and do not turn any miss or block in the reference into a hit. Generate no audio; the film keeps its own soundtrack. This request uses semantic motion reference, not a guarantee of identical frames.

## Output and retention boundary {#retention}

Availability: the source clip does not yet exist, and no input or output bytes are retained for this request. After export, add the clip's measured duration, frames, profile, bytes, SHA-256 and first/last-frame observations here, with the whole render's identity, keeping this planned epoch. A future submission becomes its own attributable attempt with the exact sent payload, job ID and retained outputs under [generation records](../../../.agents/skills/production/generation-records.md). Large files stay in ignored `output/segments/` or `media/generated/`; Git keeps these records, not the media.
