# Touch into the first counter

Status: complete planned English prompt and unsubmitted payload template. Segment 1 of 12 in the [coverage table](source-bindings.md#coverage). The source clip has not been exported; no upload, provider task, paid job or generated take exists.

## Intended clip and request {#request}

| Field | Planned value |
| --- | --- |
| Local clip | `media/automovie/videos/segments/touch-into-the-first-counter.mp4`, pending export from the re-exported whole render |
| Whole-render global interval | [0, 15) seconds |
| Local interval | [0, 15) seconds |
| Global included frames at 30 fps | 0–449 |
| Local included frames | 0–449 |
| Intended profile | 1280×720, 16:9, 30 fps, H.264/yuv420p MP4, no audio track |
| Actual clip SHA-256, bytes and probe | Pending actual export; nothing here is a measurement |
| Whole render | `output/kickboxing.mp4`, pending re-export of the current source revision ([export state](source-bindings.md#export)) |
| Planned receiving model and mode | `dreamina-seedance-2-5-260628`, reference |
| Request budget | One 15-second video; 0 continuity videos, 0 images, 0 audio references |
| Upload | `{{SOURCE_CLIP_PUBLIC_URL}}`, unresolved; a local path is not a URL |
| Exact request | [payloads/touch-into-the-first-counter.json](payloads/touch-into-the-first-counter.json), 4821 bytes, raw LF SHA-256 `4d2213ec0128e7285cb7bdff8d45043feb7db75d95268940f5259b091a03bc32` |
| Exact prompt length | 791 English whitespace-delimited words |

The single 15-second video stays below the carried 30-second / 10-video aggregate, and its raster, rate and container follow the [carried contract](../../../docs/research/seedance-2-5-handoff-contract.md). The maximum generated-output duration is unknown there and must be confirmed before submission. Native audio is disabled. No first/last-frame role is mixed with reference mode.

## Creative source mapping {#sources}

[Source bindings](source-bindings.md#source-epoch) own the raw SHA-256 of every source read, and [shared bases](source-bindings.md#shared-bases) map the identity, ring, impact and exclusion paragraphs, identical in all twelve requests, and the camera paragraph. This request's action paragraph consumes [screenplay#ring-bout](../../body/screenplay/kickboxing.md#ring-bout), raw SHA-256 `e37d7a62cd9f2b33fd95ba955c58560030baffbd674d83889e7f7f521943f1c8`, under “0–15: Touch Into the First Counter”.

Literal basis: “The glove flattens as it sinks into the flesh and sweat sprays off his side.”

[BoutScript](../../../src/bout/BoutScript.ts), raw SHA-256 `860798c2df95b5ab6971aa87160bff6c23213c9af887d8914ea84c4314540ef7`, supplies the contact or closest-pass second of every exchange in the interval. Local seconds in the prompt are these values minus 0:

| Row id | Global s | Local s | Attacker, technique → answer |
| --- | ---: | ---: | --- |
| `x001-a-jab` | 2.5 | 2.5 | A, jab → parry |
| `x002-a-cross` | 2.85 | 2.85 | A, cross → cover |
| `x003-b-jab` | 3.3 | 3.3 | B, jab → slip |
| `x004-a-hook` | 4.35 | 4.35 | A, hook → weave |
| `x005-b-cross` | 4.95 | 4.95 | B, cross → slip |
| `x006-a-low-kick` | 6.5 | 6.5 | A, low-kick → check |
| `x007-b-jab` | 8 | 8 | B, jab → cover |
| `x008-b-cross` | 8.35 | 8.35 | B, cross → cover |
| `x009-a-jab` | 8.9 | 8.9 | A, jab → slip |
| `x010-b-hook` | 9.6 | 9.6 | B, hook → weave |
| `x011-a-cross` | 10.2 | 10.2 | A, cross → slip |
| `x012-a-body-cross` | 11.5 | 11.5 | A, body-cross → hit |

Clean landings in this clip, each with a camera jolt from [FilmPlan](../../../src/film/FilmPlan.ts): `x012-a-body-cross` at local 11.5 s. Body landings (`x012-a-body-cross`) sink in with a sweat spray and leave reddened skin. The opening sentence of the action paragraph states the skin marks accumulated from earlier landings, following the screenplay's “Every landed blow sinks into what it meets: gloves flatten against gloves, ribs and faces, sweat flies off struck skin, and skin stays reddened where it was hit.”

The opening bell and the referee's "Fight!" at 0.4 s ([referee cues](../../../src/bout/RefereeCues.ts)) stay in the deterministic soundtrack; the prompt asks only for the visible signal and mouth.

The text supplies live-action identities, ring, light, impact detail and finish; the reference clip supplies movement, contact, camera and timing. These roles are semantic guidance, not a tested generator result or exact-frame following.

## Exact planned English prompt {#prompt}

Turn @Video1, a coarse 3D motion render, into photorealistic live-action footage of a professional kickboxing bout, shot like a high-end sports documentary. Use @Video1 as the sole reference for motion, camera and timing: keep its three people, their positions and spacing, every strike, contact and miss, every defence and footstep, and its camera path, with no cuts. This 15-second clip is part 1 of 12 of one continuous 180-second take.

The performer in red gloves is fighter A: a 28-year-old man, 180 cm and 80 kg, with broad shoulders, a thick athletic trunk, developed arms and thighs, warm medium skin and short-cropped dark hair. He wears red boxing gloves over wrist wraps, red mid-thigh shorts with a pale waistband and a mouthguard; his chest and feet are bare. The performer in cyan gloves is fighter B: a 30-year-old man of the same height and competitive build, with dark cool-toned skin and a closely shaved head. He wears cyan gloves over wrist wraps, navy mid-thigh shorts with cyan side stripes and a mouthguard; his chest and feet are bare. The man in white is the referee: an adult of 178 cm with a regular athletic build and short dark hair, in a white long-sleeve shirt, black trousers and black shoes, with bare hands.

The setting is an indoor kickboxing ring at night: a pale matte canvas, four taut ropes on padded posts, two diagonally opposite light-padded neutral corners, one red and one cyan corner, a dark apron and darkness beyond the ropes. Broad neutral overhead light with soft frontal fill separates gloves, limbs and contact shadows.

The camera stands inside the ropes on A's left side of the fighting line, about 2.75 m from the pair at chest height, with a moderate wide lens of about 27 mm full-frame equivalent, and drifts slowly along that side. A stays screen-left, B screen-right and the referee behind their line; heads, gloves and bare feet stay in frame together.

Show the force of every landed blow. The glove or shin visibly sinks into the flesh it meets and the glove flattens against it; sweat sprays off the struck skin, less when a guard takes the blow. A clean blow to the face also throws a light spray of blood from the nose, mouth or cheek, and the struck man winces with his eyes squeezed shut and brows lowered for about half a second. Every clean landing jolts the camera with a brief damped vertical shake of about 0.3 s. Struck skin reddens and stays marked, darkening on the faces and struck rib sides as the round goes on, and both men's skin grows slick with sweat.

Both men begin with unmarked skin. The clip opens on the bell. The referee stands clear behind the fighters, raises his right palm beside his shoulder and sweeps it down as he calls the start; his mouth opens on the word. A and B advance, lead foot first, and touch left gloves at about 1.0 s while their right gloves guard their cheeks, then step back to striking distance. From 2.5 s they fight: A's jab is brushed aside by B's right glove and A's cross lands on B's raised left glove; B's counter jab misses as A slips outside it; A's left hook passes over B as he bends under it; B's cross misses A's slipping head. At 6.5 s A's right shin kicks low and B checks it with his raised left shin; both legs return to the canvas. At 8.0 s B's jab-cross hits A's closed guard; A's counter jab misses B's outside slip; B's hook passes over A's weave; A's right cross misses B's slip. At 11.5 s A lowers through his legs and drives a right straight into B's left ribs: the glove flattens as it sinks into the flesh, sweat sprays off B's side and the camera jolts. B's trunk gives, he exhales sharply and closes his elbow over the struck side, where the skin begins to redden. Both reset with separate steps to the end of the clip.

Between exchanges both men keep moving with separate small steps about 1.8 m apart, guards up and breathing hard; they step in for each attack and back out after it.

Keep realistic human anatomy, closed fists inside the gloves and the gloves on the hands. Keep the blood sports-realistic: light spray and small drops only, with no open wounds, cuts, pools of blood or gore. Add no other people, visible audience, cornermen, text, captions, logos, scoreboard or slow motion, and do not turn any miss or block in the reference into a hit. Generate no audio; the film keeps its own soundtrack. This request uses semantic motion reference, not a guarantee of identical frames.

## Output and retention boundary {#retention}

Availability: the source clip does not yet exist, and no input or output bytes are retained for this request. After export, add the clip's measured duration, frames, profile, bytes, SHA-256 and first/last-frame observations here, with the whole render's identity, keeping this planned epoch. A future submission becomes its own attributable attempt with the exact sent payload, job ID and retained outputs under [generation records](../../../.agents/skills/production/generation-records.md). Large files stay in ignored `media/automovie/videos/segments/` or `media/diffusion/videos/`; Git keeps these records, not the media.
