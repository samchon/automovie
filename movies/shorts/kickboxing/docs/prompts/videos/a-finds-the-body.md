# A finds the body

Status: complete planned English prompt and unsubmitted payload template. Segment 2 of 12 in the [coverage table](source-bindings.md#coverage). The source clip has not been exported; no upload, provider task, paid job or generated take exists.

## Intended clip and request {#request}

| Field | Planned value |
| --- | --- |
| Local clip | `output/segments/a-finds-the-body.mp4`, pending export from the re-exported whole render |
| Whole-render global interval | [15, 30) seconds |
| Local interval | [0, 15) seconds |
| Global included frames at 30 fps | 450–899 |
| Local included frames | 0–449 |
| Intended profile | 1280×720, 16:9, 30 fps, H.264/yuv420p MP4, no audio track |
| Actual clip SHA-256, bytes and probe | Pending actual export; nothing here is a measurement |
| Whole render | `output/kickboxing.mp4`, pending re-export of the current source revision ([export state](source-bindings.md#export)) |
| Planned receiving model and mode | `dreamina-seedance-2-5-260628`, reference |
| Request budget | One 15-second video; 0 continuity videos, 0 images, 0 audio references |
| Upload | `{{SOURCE_CLIP_PUBLIC_URL}}`, unresolved; a local path is not a URL |
| Exact request | [payloads/a-finds-the-body.json](payloads/a-finds-the-body.json), 4832 bytes, raw LF SHA-256 `f466e87371dcdb6d52c666b2d32a37d28af20e31b823be39a769a8dffa139ae5` |
| Exact prompt length | 803 English whitespace-delimited words |

The single 15-second video stays below the carried 30-second / 10-video aggregate, and its raster, rate and container follow the [carried contract](../../../docs/research/seedance-2-5-handoff-contract.md). The maximum generated-output duration is unknown there and must be confirmed before submission. Native audio is disabled. No first/last-frame role is mixed with reference mode.

## Creative source mapping {#sources}

[Source bindings](source-bindings.md#source-epoch) own the raw SHA-256 of every source read, and [shared bases](source-bindings.md#shared-bases) map the identity, ring, impact and exclusion paragraphs, identical in all twelve requests, and the camera paragraph. This request's action paragraph consumes [screenplay#ring-bout](../../body/screenplay/kickboxing.md#ring-bout), raw SHA-256 `e37d7a62cd9f2b33fd95ba955c58560030baffbd674d83889e7f7f521943f1c8`, under “15–30: A Finds the Body”.

Literal basis: “sweat and a thin spray of blood leave his nose and mouth”

[BoutScript](../../../src/bout/BoutScript.ts), raw SHA-256 `860798c2df95b5ab6971aa87160bff6c23213c9af887d8914ea84c4314540ef7`, supplies the contact or closest-pass second of every exchange in the interval. Local seconds in the prompt are these values minus 15:

| Row id | Global s | Local s | Attacker, technique → answer |
| --- | ---: | ---: | --- |
| `x013-b-jab` | 16.2 | 1.2 | B, jab → parry |
| `x014-b-cross` | 16.55 | 1.55 | B, cross → cover |
| `x015-a-jab` | 17.05 | 2.05 | A, jab → slip |
| `x016-a-cross` | 17.45 | 2.45 | A, cross → slip |
| `x017-b-jab` | 18 | 3 | B, jab → slip |
| `x018-a-body-hook` | 19.3 | 4.3 | A, body-hook → hit |
| `x019-b-jab` | 20.4 | 5.4 | B, jab → cover |
| `x020-a-cross` | 20.95 | 5.95 | A, cross → slip |
| `x021-b-jab` | 22.2 | 7.2 | B, jab → cover |
| `x022-b-cross` | 22.55 | 7.55 | B, cross → cover |
| `x023-a-jab` | 23.1 | 8.1 | A, jab → hit |
| `x024-a-body-kick` | 25 | 10 | A, body-kick → hit |
| `x025-b-jab` | 27.6 | 12.6 | B, jab → parry |

Clean landings in this clip, each with a camera jolt from [FilmPlan](../../../src/film/FilmPlan.ts): `x018-a-body-hook` at local 4.3 s, `x023-a-jab` at local 8.1 s, `x024-a-body-kick` at local 10 s. Face landings (`x023-a-jab`) add the screenplay's blood spray and the hint's half-second wince from [Reaction](../../../src/bout/Reaction.ts). Body landings (`x018-a-body-hook`, `x024-a-body-kick`) sink in with a sweat spray and leave reddened skin. The opening sentence of the action paragraph states the skin marks accumulated from earlier landings, following the screenplay's “Every landed blow sinks into what it meets: gloves flatten against gloves, ribs and faces, sweat flies off struck skin, and skin stays reddened where it was hit.”

The text supplies live-action identities, ring, light, impact detail and finish; the reference clip supplies movement, contact, camera and timing. These roles are semantic guidance, not a tested generator result or exact-frame following.

## Exact planned English prompt {#prompt}

Turn @Video1, a coarse 3D motion render, into photorealistic live-action footage of a professional kickboxing bout, shot like a high-end sports documentary. Use @Video1 as the sole reference for motion, camera and timing: keep its three people, their positions and spacing, every strike, contact and miss, every defence and footstep, and its camera path, with no cuts. This 15-second clip is part 2 of 12 of one continuous 180-second take.

The performer in red gloves is fighter A: a 28-year-old man, 180 cm and 80 kg, with broad shoulders, a thick athletic trunk, developed arms and thighs, warm medium skin and short-cropped dark hair. He wears red boxing gloves over wrist wraps, red mid-thigh shorts with a pale waistband and a mouthguard; his chest and feet are bare. The performer in cyan gloves is fighter B: a 30-year-old man of the same height and competitive build, with dark cool-toned skin and a closely shaved head. He wears cyan gloves over wrist wraps, navy mid-thigh shorts with cyan side stripes and a mouthguard; his chest and feet are bare. The man in white is the referee: an adult of 178 cm with a regular athletic build and short dark hair, in a white long-sleeve shirt, black trousers and black shoes, with bare hands.

The setting is an indoor kickboxing ring at night: a pale matte canvas, four taut ropes on padded posts, two diagonally opposite light-padded neutral corners, one red and one cyan corner, a dark apron and darkness beyond the ropes. Broad neutral overhead light with soft frontal fill separates gloves, limbs and contact shadows.

The camera stands inside the ropes on A's left side of the fighting line, about 2.75 m from the pair at chest height, with a moderate wide lens of about 27 mm full-frame equivalent, and drifts slowly along that side. A stays screen-left, B screen-right and the referee behind their line; heads, gloves and bare feet stay in frame together.

Show the force of every landed blow. The glove or shin visibly sinks into the flesh it meets and the glove flattens against it; sweat sprays off the struck skin, less when a guard takes the blow. A clean blow to the face also throws a light spray of blood from the nose, mouth or cheek, and the struck man winces with his eyes squeezed shut and brows lowered for about half a second. Every clean landing jolts the camera with a brief damped vertical shake of about 0.3 s. Struck skin reddens and stays marked, darkening on the faces and struck rib sides as the round goes on, and both men's skin grows slick with sweat.

B's left ribs are already reddened. B shifts the line with a short angle step and A turns to follow. At 1.2 s B's jab is parried by A's right glove and his cross lands on A's raised left glove and forearm. A's jab and cross both miss as B slips outside them, and B's counter jab misses A's moving head. At 4.3 s A drops his level and swings a left hook into B's right ribs; the glove buries itself in B's side, throws off a fan of sweat and the camera jolts. B exhales and restores his elbow. B's jab hits A's cover and A's cross passes B's slip. At 7.2 s B fires another jab-cross into A's closed guard. At 8.1 s A's jab lands flush on B's face and flattens against his cheek: sweat and a thin spray of blood leave B's nose and mouth, the camera jolts, B's head snaps back along the punch, his trunk follows, he takes a short stagger step and winces with eyes squeezed shut and mouth open, then his guard resets. At 10.0 s A turns his hips into a right body kick; B's arm arrives late and the shin sinks into his left side with a burst of sweat and a camera jolt, folding him slightly through knees and trunk. A folds the knee clear and lands without crossing his feet while B adjusts rear foot first. At 12.6 s B's jab is parried by A.

Between exchanges both men keep moving with separate small steps about 1.8 m apart, guards up and breathing hard; they step in for each attack and back out after it.

Keep realistic human anatomy, closed fists inside the gloves and the gloves on the hands. Keep the blood sports-realistic: light spray and small drops only, with no open wounds, cuts, pools of blood or gore. Add no other people, visible audience, cornermen, text, captions, logos, scoreboard or slow motion, and do not turn any miss or block in the reference into a hit. Generate no audio; the film keeps its own soundtrack. This request uses semantic motion reference, not a guarantee of identical frames.

## Output and retention boundary {#retention}

Availability: the source clip does not yet exist, and no input or output bytes are retained for this request. After export, add the clip's measured duration, frames, profile, bytes, SHA-256 and first/last-frame observations here, with the whole render's identity, keeping this planned epoch. A future submission becomes its own attributable attempt with the exact sent payload, job ID and retained outputs under [generation records](../../../.agents/skills/production/generation-records.md). Large files stay in ignored `output/segments/` or `media/generated/`; Git keeps these records, not the media.
