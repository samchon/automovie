# High-kick knockout and neutral corner

Status: complete planned English prompt and unsubmitted payload template. Segment 11 of 12 in the [coverage table](source-bindings.md#coverage). The source clip has not been exported; no upload, provider task, paid job or generated take exists.

## Intended clip and request {#request}

| Field | Planned value |
| --- | --- |
| Local clip | `media/automovie/videos/segments/high-kick-knockout-and-neutral-corner.mp4`, pending export from the re-exported whole render |
| Whole-render global interval | [147, 157) seconds |
| Local interval | [0, 10) seconds |
| Global included frames at 30 fps | 4410–4709 |
| Local included frames | 0–299 |
| Intended profile | 1280×720, 16:9, 30 fps, H.264/yuv420p MP4, no audio track |
| Actual clip SHA-256, bytes and probe | Pending actual export; nothing here is a measurement |
| Whole render | `output/kickboxing.mp4`, pending re-export of the current source revision ([export state](source-bindings.md#export)) |
| Planned receiving model and mode | `dreamina-seedance-2-5-260628`, reference |
| Request budget | One 10-second video; 0 continuity videos, 0 images, 0 audio references |
| Upload | `{{SOURCE_CLIP_PUBLIC_URL}}`, unresolved; a local path is not a URL |
| Exact request | [payloads/high-kick-knockout-and-neutral-corner.json](payloads/high-kick-knockout-and-neutral-corner.json), 4987 bytes, raw LF SHA-256 `06f72fa9bc8a7f3e10b0d72ccc36174ef8a6d588d8640a46b6ac325783b32712` |
| Exact prompt length | 830 English whitespace-delimited words |

The single 10-second video stays below the carried 30-second / 10-video aggregate, and its raster, rate and container follow the [carried contract](../../../docs/research/seedance-2-5-handoff-contract.md). The maximum generated-output duration is unknown there and must be confirmed before submission. Native audio is disabled. No first/last-frame role is mixed with reference mode.

## Creative source mapping {#sources}

[Source bindings](source-bindings.md#source-epoch) own the raw SHA-256 of every source read, and [shared bases](source-bindings.md#shared-bases) map the identity, ring, impact and exclusion paragraphs, identical in all twelve requests, and the camera paragraph. This request's action paragraph consumes [screenplay#ring-bout](../../body/screenplay/kickboxing.md#ring-bout), raw SHA-256 `e37d7a62cd9f2b33fd95ba955c58560030baffbd674d83889e7f7f521943f1c8`, under “135–150: The Kick Climbs” and “150–165: Down and the Count”.

Literal basis: “At 150.000, A's lower left shin strikes the right side of B's jaw and head.” “The shin sinks into B's face; sweat and blood burst from it and spatter the canvas.” “Drops of blood mark the canvas beside his face.”

[BoutScript](../../../src/bout/BoutScript.ts), raw SHA-256 `860798c2df95b5ab6971aa87160bff6c23213c9af887d8914ea84c4314540ef7`, supplies the contact or closest-pass second of every exchange in the interval. Local seconds in the prompt are these values minus 147:

| Row id | Global s | Local s | Attacker, technique → answer |
| --- | ---: | ---: | --- |
| `x111-a-body-hook` | 148.9 | 1.9 | A, body-hook → catch |
| `x112-a-high-kick` | 150 | 3 | A, high-kick → hit |

Clean landings in this clip, each with a camera jolt from [FilmPlan](../../../src/film/FilmPlan.ts): `x112-a-high-kick` at local 3 s. Face landings (`x112-a-high-kick`) add the screenplay's blood spray and the hint's half-second wince from [Reaction](../../../src/bout/Reaction.ts). The opening sentence of the action paragraph states the skin marks accumulated from earlier landings, following the screenplay's “Every landed blow sinks into what it meets: gloves flatten against gloves, ribs and faces, sweat flies off struck skin, and skin stays reddened where it was hit.”

Non-exchange timing comes from [Aftermath](../../../src/bout/Aftermath.ts) (corner walk 152.3–156.8 s, kick recovery and the side-on wide view) and [referee cues](../../../src/bout/RefereeCues.ts) ("down" at 150.55 s, "neutral" at 152.0 s); the screenplay places B's hip, shoulder and settled side at about 151.0, 151.25 and 151.6 s. FilmPlan gives the knockout the strongest jolt (power 2.5 against 1.4 for other kicks).

The text supplies live-action identities, ring, light, impact detail and finish; the reference clip supplies movement, contact, camera and timing. These roles are semantic guidance, not a tested generator result or exact-frame following.

## Exact planned English prompt {#prompt}

Turn @Video1, a coarse 3D motion render, into photorealistic live-action footage of a professional kickboxing bout, shot like a high-end sports documentary. Use @Video1 as the sole reference for motion, camera and timing: keep its three people, their positions and spacing, every strike, contact and miss, every defence and footstep, and its camera path, with no cuts. This 10-second clip is part 11 of 12 of one continuous 180-second take.

The performer in red gloves is fighter A: a 28-year-old man, 180 cm and 80 kg, with broad shoulders, a thick athletic trunk, developed arms and thighs, warm medium skin and short-cropped dark hair. He wears red boxing gloves over wrist wraps, red mid-thigh shorts with a pale waistband and a mouthguard; his chest and feet are bare. The performer in cyan gloves is fighter B: a 30-year-old man of the same height and competitive build, with dark cool-toned skin and a closely shaved head. He wears cyan gloves over wrist wraps, navy mid-thigh shorts with cyan side stripes and a mouthguard; his chest and feet are bare. The man in white is the referee: an adult of 178 cm with a regular athletic build and short dark hair, in a white long-sleeve shirt, black trousers and black shoes, with bare hands.

The setting is an indoor kickboxing ring at night: a pale matte canvas, four taut ropes on padded posts, two diagonally opposite light-padded neutral corners, one red and one cyan corner, a dark apron and darkness beyond the ropes. Broad neutral overhead light with soft frontal fill separates gloves, limbs and contact shadows.

The camera continues the reference's smooth rising and widening move from the previous clip and settles by about 4 s into a higher side-on wide view, about 2.4 m up and looking down across the canvas with a wider lens of about 20 mm full-frame equivalent; it then holds without a cut. The kick, the whole fall, both men's feet and the referee stay in frame.

Show the force of every landed blow. The glove or shin visibly sinks into the flesh it meets and the glove flattens against it; sweat sprays off the struck skin, less when a guard takes the blow. A clean blow to the face also throws a light spray of blood from the nose, mouth or cheek, and the struck man winces with his eyes squeezed shut and brows lowered for about half a second. Every clean landing jolts the camera with a brief damped vertical shake of about 0.3 s. Struck skin reddens and stays marked, darkening on the faces and struck rib sides as the round goes on, and both men's skin grows slick with sweat.

Both men are flushed and slick with sweat; B's cheeks and left ribs are darkest. At 1.9 s A turns a left body hook into B's low right guard; the guard catches it and stays low. A sets both feet, loads his right leg and turns on the right forefoot with the heel free while his left knee rises above B's lowered guard; his right glove protects his cheek. At exactly 3.0 s A's lower left shin strikes the right side of B's jaw and head and sinks into his face: sweat and blood burst from it and spatter the canvas, and the camera gives its strongest jolt of the film. B's head turns, then his neck and chest follow; his right knee folds and his pelvis drops to his right side. His right hip and side reach the canvas at about 4.0 s, his right shoulder just after, and his head settles last; by 4.6 s he lies on his side with knees and arms bent, breathing, and small drops of blood mark the canvas beside his face. A withdraws the shin clear of B, lowers the foot under himself and drops his hands; he makes no further attack. The referee steps in outside the falling body's path, calls the knockdown at 3.6 s and marks it with his hand, then at 5.0 s points to the neutral corner farthest from B as he calls again. From about 5.3 s A walks diagonally in short, supported steps along a route that bends away from B, keeping B in view, and at 9.8 s he stands inside the light-padded neutral corner and turns his head toward ring center. The referee moves toward B while watching A's route. The clip ends as the referee is ready to begin counting.

Keep realistic human anatomy, closed fists inside the gloves and the gloves on the hands. Keep the blood sports-realistic: light spray and small drops only, with no open wounds, cuts, pools of blood or gore. Add no other people, visible audience, cornermen, text, captions, logos, scoreboard or slow motion, and do not turn any miss or block in the reference into a hit. Generate no audio; the film keeps its own soundtrack. This request uses semantic motion reference, not a guarantee of identical frames.

## Output and retention boundary {#retention}

Availability: the source clip does not yet exist, and no input or output bytes are retained for this request. After export, add the clip's measured duration, frames, profile, bytes, SHA-256 and first/last-frame observations here, with the whole render's identity, keeping this planned epoch. A future submission becomes its own attributable attempt with the exact sent payload, job ID and retained outputs under [generation records](../../../.agents/skills/production/generation-records.md). Large files stay in ignored `media/automovie/videos/segments/` or `media/diffusion/videos/`; Git keeps these records, not the media.
