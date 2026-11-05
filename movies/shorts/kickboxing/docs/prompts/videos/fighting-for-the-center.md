# Fighting for the center

Status: complete planned English prompt and unsubmitted payload template. Segment 7 of 12 in the [coverage table](source-bindings.md#coverage). The source clip has not been exported; no upload, provider task, paid job or generated take exists.

## Intended clip and request {#request}

| Field | Planned value |
| --- | --- |
| Local clip | `output/segments/fighting-for-the-center.mp4`, pending export from the re-exported whole render |
| Whole-render global interval | [90, 105) seconds |
| Local interval | [0, 15) seconds |
| Global included frames at 30 fps | 2700–3149 |
| Local included frames | 0–449 |
| Intended profile | 1280×720, 16:9, 30 fps, H.264/yuv420p MP4, no audio track |
| Actual clip SHA-256, bytes and probe | Pending actual export; nothing here is a measurement |
| Whole render | `output/kickboxing.mp4`, pending re-export of the current source revision ([export state](source-bindings.md#export)) |
| Planned receiving model and mode | `dreamina-seedance-2-5-260628`, reference |
| Request budget | One 15-second video; 0 continuity videos, 0 images, 0 audio references |
| Upload | `{{SOURCE_CLIP_PUBLIC_URL}}`, unresolved; a local path is not a URL |
| Exact request | [payloads/fighting-for-the-center.json](payloads/fighting-for-the-center.json), 4539 bytes, raw LF SHA-256 `8c6029f4630bbd9870ce21e2c5aeaf1cdefbc6fe67c13ed8e79595c3bf10c042` |
| Exact prompt length | 742 English whitespace-delimited words |

The single 15-second video stays below the carried 30-second / 10-video aggregate, and its raster, rate and container follow the [carried contract](../../../references/research/seedance-2-5-handoff-contract.md). The maximum generated-output duration is unknown there and must be confirmed before submission. Native audio is disabled. No first/last-frame role is mixed with reference mode.

## Creative source mapping {#sources}

[Source bindings](source-bindings.md#source-epoch) own the raw SHA-256 of every source read, and [shared bases](source-bindings.md#shared-bases) map the identity, ring, impact and exclusion paragraphs, identical in all twelve requests, and the camera paragraph. This request's action paragraph consumes [screenplay#ring-bout](../../body/screenplay/kickboxing.md#ring-bout), raw SHA-256 `e37d7a62cd9f2b33fd95ba955c58560030baffbd674d83889e7f7f521943f1c8`, under “90–105: Fighting for the Center”.

Literal basis: “sweat and a thread of blood fly from B's nose”

[BoutScript](../../../src/bout/BoutScript.ts), raw SHA-256 `860798c2df95b5ab6971aa87160bff6c23213c9af887d8914ea84c4314540ef7`, supplies the contact or closest-pass second of every exchange in the interval. Local seconds in the prompt are these values minus 90:

| Row id | Global s | Local s | Attacker, technique → answer |
| --- | ---: | ---: | --- |
| `x071-a-jab` | 91.2 | 1.2 | A, jab → parry |
| `x072-b-cross` | 91.6 | 1.6 | B, cross → slip |
| `x073-a-body-cross` | 92.45 | 2.45 | A, body-cross → catch |
| `x074-b-jab` | 93 | 3 | B, jab → slip |
| `x075-a-hook` | 94 | 4 | A, hook → cover |
| `x076-a-low-kick` | 95.2 | 5.2 | A, low-kick → check |
| `x077-b-cross` | 96.3 | 6.3 | B, cross → slip |
| `x078-a-jab` | 96.85 | 6.85 | A, jab → hit |
| `x079-b-body-hook` | 98.1 | 8.1 | B, body-hook → catch |

Clean landings in this clip, each with a camera jolt from [FilmPlan](../../../src/film/FilmPlan.ts): `x078-a-jab` at local 6.85 s. Face landings (`x078-a-jab`) add the screenplay's blood spray and the hint's half-second wince from [Reaction](../../../src/bout/Reaction.ts). The opening sentence of the action paragraph states the skin marks accumulated from earlier landings, following the screenplay's “Every landed blow sinks into what it meets: gloves flatten against gloves, ribs and faces, sweat flies off struck skin, and skin stays reddened where it was hit.”

The text supplies live-action identities, ring, light, impact detail and finish; the reference clip supplies movement, contact, camera and timing. These roles are semantic guidance, not a tested generator result or exact-frame following.

## Exact planned English prompt {#prompt}

Turn @Video1, a coarse 3D motion render, into photorealistic live-action footage of a professional kickboxing bout, shot like a high-end sports documentary. Use @Video1 as the sole reference for motion, camera and timing: keep its three people, their positions and spacing, every strike, contact and miss, every defence and footstep, and its camera path, with no cuts. This 15-second clip is part 7 of 12 of one continuous 180-second take.

The performer in red gloves is fighter A: a 28-year-old man, 180 cm and 80 kg, with broad shoulders, a thick athletic trunk, developed arms and thighs, warm medium skin and short-cropped dark hair. He wears red boxing gloves over wrist wraps, red mid-thigh shorts with a pale waistband and a mouthguard; his chest and feet are bare. The performer in cyan gloves is fighter B: a 30-year-old man of the same height and competitive build, with dark cool-toned skin and a closely shaved head. He wears cyan gloves over wrist wraps, navy mid-thigh shorts with cyan side stripes and a mouthguard; his chest and feet are bare. The man in white is the referee: an adult of 178 cm with a regular athletic build and short dark hair, in a white long-sleeve shirt, black trousers and black shoes, with bare hands.

The setting is an indoor kickboxing ring at night: a pale matte canvas, four taut ropes on padded posts, two diagonally opposite light-padded neutral corners, one red and one cyan corner, a dark apron and darkness beyond the ropes. Broad neutral overhead light with soft frontal fill separates gloves, limbs and contact shadows.

The camera stands inside the ropes on A's left side of the fighting line, about 2.75 m from the pair at chest height, with a moderate wide lens of about 27 mm full-frame equivalent, and drifts slowly along that side. A stays screen-left, B screen-right and the referee behind their line; heads, gloves and bare feet stay in frame together.

Show the force of every landed blow. The glove or shin visibly sinks into the flesh it meets and the glove flattens against it; sweat sprays off the struck skin, less when a guard takes the blow. A clean blow to the face also throws a light spray of blood from the nose, mouth or cheek, and the struck man winces with his eyes squeezed shut and brows lowered for about half a second. Every clean landing jolts the camera with a brief damped vertical shake of about 0.3 s. Struck skin reddens and stays marked, darkening on the faces and struck rib sides as the round goes on, and both men's skin grows slick with sweat.

Both men are sweating heavily, with reddened faces and rib sides. At 1.2 s A's jab meets B's parry and B's cross misses A's slip. At 2.45 s A drops the level of a right straight and B catches it with his left glove before the ribs; B's counter jab misses A's outside slip. At 4.0 s A's left hook lands on B's right glove. At 5.2 s A's right low kick meets B's left shin check; both replant. At 6.3 s B's cross misses as A moves his head off the line. At 6.85 s A's jab lands on B's face as B's cross returns: sweat and a thread of blood fly from B's nose, the camera jolts, B's head snaps back along the punch, his trunk follows and he takes a short stagger step, wincing with eyes shut and mouth open, then restores his guard. At 8.1 s B lowers into a left hook toward A's right ribs and A's lowered right glove catches it with a dry thump. Both reset with distinct footsteps, breathing deeper, while the referee walks around their open flank.

Between exchanges both men keep moving with separate small steps about 1.8 m apart, guards up and breathing hard; they step in for each attack and back out after it.

Keep realistic human anatomy, closed fists inside the gloves and the gloves on the hands. Keep the blood sports-realistic: light spray and small drops only, with no open wounds, cuts, pools of blood or gore. Add no other people, visible audience, cornermen, text, captions, logos, scoreboard or slow motion, and do not turn any miss or block in the reference into a hit. Generate no audio; the film keeps its own soundtrack. This request uses semantic motion reference, not a guarantee of identical frames.

## Output and retention boundary {#retention}

Availability: the source clip does not yet exist, and no input or output bytes are retained for this request. After export, add the clip's measured duration, frames, profile, bytes, SHA-256 and first/last-frame observations here, with the whole render's identity, keeping this planned epoch. A future submission becomes its own attributable attempt with the exact sent payload, job ID and retained outputs under [generation records](../../../.agents/skills/production/generation-records.md). Large files stay in ignored `output/segments/` or `media/generated/`; Git keeps these records, not the media.
