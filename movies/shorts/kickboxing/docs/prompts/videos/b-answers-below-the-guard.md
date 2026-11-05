# B answers below the guard

Status: complete planned English prompt and unsubmitted payload template. Segment 3 of 12 in the [coverage table](source-bindings.md#coverage). The source clip has not been exported; no upload, provider task, paid job or generated take exists.

## Intended clip and request {#request}

| Field | Planned value |
| --- | --- |
| Local clip | `media/automovie/kickboxing/videos/segments/b-answers-below-the-guard.mp4`, pending export from the re-exported whole render |
| Whole-render global interval | [30, 45) seconds |
| Local interval | [0, 15) seconds |
| Global included frames at 30 fps | 900–1349 |
| Local included frames | 0–449 |
| Intended profile | 1280×720, 16:9, 30 fps, H.264/yuv420p MP4, no audio track |
| Actual clip SHA-256, bytes and probe | Pending actual export; nothing here is a measurement |
| Whole render | `output/kickboxing.mp4`, pending re-export of the current source revision ([export state](source-bindings.md#export)) |
| Planned receiving model and mode | `dreamina-seedance-2-5-260628`, reference |
| Request budget | One 15-second video; 0 continuity videos, 0 images, 0 audio references |
| Upload | `{{SOURCE_CLIP_PUBLIC_URL}}`, unresolved; a local path is not a URL |
| Exact request | [payloads/b-answers-below-the-guard.json](payloads/b-answers-below-the-guard.json), 4747 bytes, raw LF SHA-256 `fca23a926340393277351da334f7b4bfc7dea9aee7ef5c0b07725f5afec5adde` |
| Exact prompt length | 783 English whitespace-delimited words |

The single 15-second video stays below the carried 30-second / 10-video aggregate, and its raster, rate and container follow the [carried contract](../../../docs/research/seedance-2-5-handoff-contract.md). The maximum generated-output duration is unknown there and must be confirmed before submission. Native audio is disabled. No first/last-frame role is mixed with reference mode.

## Creative source mapping {#sources}

[Source bindings](source-bindings.md#source-epoch) own the raw SHA-256 of every source read, and [shared bases](source-bindings.md#shared-bases) map the identity, ring, impact and exclusion paragraphs, identical in all twelve requests, and the camera paragraph. This request's action paragraph consumes [screenplay#ring-bout](../../body/screenplay/kickboxing.md#ring-bout), raw SHA-256 `e37d7a62cd9f2b33fd95ba955c58560030baffbd674d83889e7f7f521943f1c8`, under “30–45: B Answers Below the Guard”.

Literal basis: “the fist catches A square on the face and flattens against his cheek; sweat and a spray of blood leave his mouth”

[BoutScript](../../../src/shots/kickboxing/ring-bout/BoutScript.ts), raw SHA-256 `860798c2df95b5ab6971aa87160bff6c23213c9af887d8914ea84c4314540ef7`, supplies the contact or closest-pass second of every exchange in the interval. Local seconds in the prompt are these values minus 30:

| Row id | Global s | Local s | Attacker, technique → answer |
| --- | ---: | ---: | --- |
| `x026-b-jab` | 31 | 1 | B, jab → parry |
| `x027-a-cross` | 31.45 | 1.45 | A, cross → slip |
| `x028-b-body-cross` | 32.1 | 2.1 | B, body-cross → hit |
| `x029-a-jab` | 32.75 | 2.75 | A, jab → slip |
| `x030-b-hook` | 33.8 | 3.8 | B, hook → weave |
| `x031-b-low-kick` | 35.2 | 5.2 | B, low-kick → check |
| `x032-a-cross` | 36.3 | 6.3 | A, cross → slip |
| `x033-a-uppercut` | 37.4 | 7.4 | A, uppercut → cover |
| `x034-b-cross` | 37.95 | 7.95 | B, cross → hit |
| `x035-a-body-hook` | 38.6 | 8.6 | A, body-hook → catch |
| `x036-a-jab` | 41.6 | 11.6 | A, jab → parry |

Clean landings in this clip, each with a camera jolt from [FilmPlan](../../../src/shots/kickboxing/ring-bout/FilmPlan.ts): `x028-b-body-cross` at local 2.1 s, `x034-b-cross` at local 7.95 s. Face landings (`x034-b-cross`) add the screenplay's blood spray and the hint's half-second wince from [Reaction](../../../src/motion/reactions/Reaction.ts). Body landings (`x028-b-body-cross`) sink in with a sweat spray and leave reddened skin. The opening sentence of the action paragraph states the skin marks accumulated from earlier landings, following the screenplay's “Every landed blow sinks into what it meets: gloves flatten against gloves, ribs and faces, sweat flies off struck skin, and skin stays reddened where it was hit.”

The text supplies live-action identities, ring, light, impact detail and finish; the reference clip supplies movement, contact, camera and timing. These roles are semantic guidance, not a tested generator result or exact-frame following.

## Exact planned English prompt {#prompt}

Turn @Video1, a coarse 3D motion render, into photorealistic live-action footage of a professional kickboxing bout, shot like a high-end sports documentary. Use @Video1 as the sole reference for motion, camera and timing: keep its three people, their positions and spacing, every strike, contact and miss, every defence and footstep, and its camera path, with no cuts. This 15-second clip is part 3 of 12 of one continuous 180-second take.

The performer in red gloves is fighter A: a 28-year-old man, 180 cm and 80 kg, with broad shoulders, a thick athletic trunk, developed arms and thighs, warm medium skin and short-cropped dark hair. He wears red boxing gloves over wrist wraps, red mid-thigh shorts with a pale waistband and a mouthguard; his chest and feet are bare. The performer in cyan gloves is fighter B: a 30-year-old man of the same height and competitive build, with dark cool-toned skin and a closely shaved head. He wears cyan gloves over wrist wraps, navy mid-thigh shorts with cyan side stripes and a mouthguard; his chest and feet are bare. The man in white is the referee: an adult of 178 cm with a regular athletic build and short dark hair, in a white long-sleeve shirt, black trousers and black shoes, with bare hands.

The setting is an indoor kickboxing ring at night: a pale matte canvas, four taut ropes on padded posts, two diagonally opposite light-padded neutral corners, one red and one cyan corner, a dark apron and darkness beyond the ropes. Broad neutral overhead light with soft frontal fill separates gloves, limbs and contact shadows.

The camera stands inside the ropes on A's left side of the fighting line, about 2.75 m from the pair at chest height, with a moderate wide lens of about 27 mm full-frame equivalent, and drifts slowly along that side. A stays screen-left, B screen-right and the referee behind their line; heads, gloves and bare feet stay in frame together.

Show the force of every landed blow. The glove or shin visibly sinks into the flesh it meets and the glove flattens against it; sweat sprays off the struck skin, less when a guard takes the blow. A clean blow to the face also throws a light spray of blood from the nose, mouth or cheek, and the struck man winces with his eyes squeezed shut and brows lowered for about half a second. Every clean landing jolts the camera with a brief damped vertical shake of about 0.3 s. Struck skin reddens and stays marked, darkening on the faces and struck rib sides as the round goes on, and both men's skin grows slick with sweat.

B's face and both rib sides are reddened; A is still unmarked. A takes a small angle step as B tracks him. At 1.0 s B's jab meets A's parry; A's cross misses B's outside slip. At 2.1 s B lowers through his legs and lands a right straight on A's left ribs: the glove sinks in, sweat flies off A's side and the camera jolts. A gives through his trunk and closes his elbow, then jabs past B's slipping head. At 3.8 s B's left hook passes over A's curved weave. At 5.2 s B's right low kick meets A's raised left shin check; both legs return. A's cross misses B's slip. At 7.4 s A's short left uppercut is stopped by B's joined gloves below his chin. At 7.95 s B's right cross catches A square on the face and flattens against his cheek: sweat and a spray of blood leave A's mouth, the camera jolts, A's head whips back along the punch, his trunk follows, he winces with eyes squeezed shut and mouth open and rocks onto his rear foot in a short stagger before his guard closes again. At 8.6 s A's left body hook is caught by B's lowered right glove. At 11.6 s A's jab meets B's parry, and they move apart with their own short steps, still facing each other.

Between exchanges both men keep moving with separate small steps about 1.8 m apart, guards up and breathing hard; they step in for each attack and back out after it.

Keep realistic human anatomy, closed fists inside the gloves and the gloves on the hands. Keep the blood sports-realistic: light spray and small drops only, with no open wounds, cuts, pools of blood or gore. Add no other people, visible audience, cornermen, text, captions, logos, scoreboard or slow motion, and do not turn any miss or block in the reference into a hit. Generate no audio; the film keeps its own soundtrack. This request uses semantic motion reference, not a guarantee of identical frames.

## Output and retention boundary {#retention}

Availability: the source clip does not yet exist, and no input or output bytes are retained for this request. After export, add the clip's measured duration, frames, profile, bytes, SHA-256 and first/last-frame observations here, with the whole render's identity, keeping this planned epoch. A future submission becomes its own attributable attempt with the exact sent payload, job ID and retained outputs under [generation records](../../../.agents/skills/production/generation-records.md). Large files stay in ignored `media/automovie/kickboxing/videos/segments/` or `media/diffusion/videos/`; Git keeps these records, not the media.
