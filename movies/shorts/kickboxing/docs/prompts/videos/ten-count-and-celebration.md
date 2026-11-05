# Ten count and celebration

Status: complete planned English prompt and unsubmitted payload template. Segment 12 of 12 in the [coverage table](source-bindings.md#coverage). The source clip has not been exported; no upload, provider task, paid job or generated take exists.

## Intended clip and request {#request}

| Field | Planned value |
| --- | --- |
| Local clip | `media/automovie/videos/segments/ten-count-and-celebration.mp4`, pending export from the re-exported whole render |
| Whole-render global interval | [157, 180) seconds |
| Local interval | [0, 23) seconds |
| Global included frames at 30 fps | 4710–5399 |
| Local included frames | 0–689 |
| Intended profile | 1280×720, 16:9, 30 fps, H.264/yuv420p MP4, no audio track |
| Actual clip SHA-256, bytes and probe | Pending actual export; nothing here is a measurement |
| Whole render | `output/kickboxing.mp4`, pending re-export of the current source revision ([export state](source-bindings.md#export)) |
| Planned receiving model and mode | `dreamina-seedance-2-5-260628`, reference |
| Request budget | One 23-second video; 0 continuity videos, 0 images, 0 audio references |
| Upload | `{{SOURCE_CLIP_PUBLIC_URL}}`, unresolved; a local path is not a URL |
| Exact request | [payloads/ten-count-and-celebration.json](payloads/ten-count-and-celebration.json), 5036 bytes, raw LF SHA-256 `2d33d6e8a130c35b02d579aa5cd534446b5d5e20c0fb36d7c1a60f50ee5eb257` |
| Exact prompt length | 850 English whitespace-delimited words |

The single 23-second video stays below the carried 30-second / 10-video aggregate, and its raster, rate and container follow the [carried contract](../../../docs/research/seedance-2-5-handoff-contract.md). The maximum generated-output duration is unknown there and must be confirmed before submission. Native audio is disabled. No first/last-frame role is mixed with reference mode.

## Creative source mapping {#sources}

[Source bindings](source-bindings.md#source-epoch) own the raw SHA-256 of every source read, and [shared bases](source-bindings.md#shared-bases) map the identity, ring, impact and exclusion paragraphs, identical in all twelve requests, and the camera paragraph. This request's action paragraph consumes [screenplay#ring-bout](../../body/screenplay/kickboxing.md#ring-bout), raw SHA-256 `e37d7a62cd9f2b33fd95ba955c58560030baffbd674d83889e7f7f521943f1c8`, under “150–165: Down and the Count” and “165–180: Ten, Then the Celebration”.

Literal basis: “Drops of blood mark the canvas beside his face.” “B is still down.”

[BoutScript](../../../src/bout/BoutScript.ts), raw SHA-256 `860798c2df95b5ab6971aa87160bff6c23213c9af887d8914ea84c4314540ef7`, supplies the contact or closest-pass second of every exchange in the interval. Local seconds in the prompt are these values minus 157:

This segment contains no exchange row.

This clip contains no clean landing and no camera jolt; it carries the accumulated skin marks and canvas blood drops. The opening sentence of the action paragraph states the skin marks accumulated from earlier landings, following the screenplay's “Every landed blow sinks into what it meets: gloves flatten against gloves, ribs and faces, sweat flies off struck skin, and skin stays reddened where it was hit.”

Non-exchange timing comes from [FilmPlan](../../../src/film/FilmPlan.ts) (count 157–167 s, decision 167.6 s, celebration 168.1 s, end bell 170.1 s) and [referee cues](../../../src/bout/RefereeCues.ts) (counts at 158–167 s, crouch from 169 s). The bell and spoken words stay in the deterministic soundtrack; the prompt asks only for visible mouth and hand performance. The canvas drops persist from the knockout, as the screenplay's “Drops of blood mark the canvas beside his face.” requires.

The text supplies live-action identities, ring, light, impact detail and finish; the reference clip supplies movement, contact, camera and timing. These roles are semantic guidance, not a tested generator result or exact-frame following.

## Exact planned English prompt {#prompt}

Turn @Video1, a coarse 3D motion render, into photorealistic live-action footage of a professional kickboxing bout, shot like a high-end sports documentary. Use @Video1 as the sole reference for motion, camera and timing: keep its three people, their positions and spacing, every strike, contact and miss, every defence and footstep, and its camera path, with no cuts. This 23-second clip is part 12 of 12 of one continuous 180-second take.

The performer in red gloves is fighter A: a 28-year-old man, 180 cm and 80 kg, with broad shoulders, a thick athletic trunk, developed arms and thighs, warm medium skin and short-cropped dark hair. He wears red boxing gloves over wrist wraps, red mid-thigh shorts with a pale waistband and a mouthguard; his chest and feet are bare. The performer in cyan gloves is fighter B: a 30-year-old man of the same height and competitive build, with dark cool-toned skin and a closely shaved head. He wears cyan gloves over wrist wraps, navy mid-thigh shorts with cyan side stripes and a mouthguard; his chest and feet are bare. The man in white is the referee: an adult of 178 cm with a regular athletic build and short dark hair, in a white long-sleeve shirt, black trousers and black shoes, with bare hands.

The setting is an indoor kickboxing ring at night: a pale matte canvas, four taut ropes on padded posts, two diagonally opposite light-padded neutral corners, one red and one cyan corner, a dark apron and darkness beyond the ropes. Broad neutral overhead light with soft frontal fill separates gloves, limbs and contact shadows.

The higher side-on wide view, about 2.4 m up with a lens of about 20 mm full-frame equivalent, holds without a cut for the whole clip: A in the light-padded neutral corner at screen left, B down on his side right of center and the referee beside B. Nothing lands in this clip, so the camera does not jolt.

Show the force of every landed blow. The glove or shin visibly sinks into the flesh it meets and the glove flattens against it; sweat sprays off the struck skin, less when a guard takes the blow. A clean blow to the face also throws a light spray of blood from the nose, mouth or cheek, and the struck man winces with his eyes squeezed shut and brows lowered for about half a second. Every clean landing jolts the camera with a brief damped vertical shake of about 0.3 s. Struck skin reddens and stays marked, darkening on the faces and struck rib sides as the round goes on, and both men's skin grows slick with sweat.

Small dark drops of blood stay on the canvas beside B's face for the whole clip. Both men remain flushed and sweating, with B's cheeks and left ribs darkest and A's face and left ribs reddened. At 0.0 s the referee raises his counting hand and counts aloud one number per second, from one at 1.0 s to ten at 10.0 s; his mouth opens on each number, his fingers change with it and his gaze moves between A's corner and B. B tries and fails to rise: at 1 s he lifts his head a little and brings his left forearm to the canvas; at 2 s he braces his left glove and forearm before his chest and draws the left knee in; at 3 s he pushes through the arm and his chest rises while his right hip stays down; at 4 s the arm trembles and he cannot get his feet under him; at 5 s his chest lowers again; at 6 s his head settles and the forearm relaxes, and he keeps breathing. A stays in the corner, watching. At 8 s the referee assesses B; at 9 s B makes a small movement but cannot lift himself; at 10 s B is still down. At 10.6 s the referee sweeps both hands across the front of his body to end the contest, then points to A as he announces the result. At 11.1 s A throws both red gloves overhead, opens his chest and breathes excitedly, then takes quick supported victory steps along his own side of the ring, turns toward the unseen audience, pumps one glove and raises both again, always clear of B. From 12.0 s the referee lowers into a shallow supported crouch beside B, watching his face. Hold all three men to the end: B breathing on his side with a small forearm movement beside the blood drops, the attentive referee and A's raised red gloves.

Keep realistic human anatomy, closed fists inside the gloves and the gloves on the hands. Keep the blood sports-realistic: light spray and small drops only, with no open wounds, cuts, pools of blood or gore. Add no other people, visible audience, cornermen, text, captions, logos, scoreboard or slow motion, and do not turn any miss or block in the reference into a hit. Generate no audio; the film keeps its own soundtrack. This request uses semantic motion reference, not a guarantee of identical frames.

## Output and retention boundary {#retention}

Availability: the source clip does not yet exist, and no input or output bytes are retained for this request. After export, add the clip's measured duration, frames, profile, bytes, SHA-256 and first/last-frame observations here, with the whole render's identity, keeping this planned epoch. A future submission becomes its own attributable attempt with the exact sent payload, job ID and retained outputs under [generation records](../../../.agents/skills/production/generation-records.md). Large files stay in ignored `media/automovie/videos/segments/` or `media/diffusion/videos/`; Git keeps these records, not the media.
