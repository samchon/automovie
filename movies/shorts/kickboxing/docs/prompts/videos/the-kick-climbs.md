# The kick climbs

Status: complete planned English prompt and unsubmitted payload template. Segment 10 of 12 in the [coverage table](source-bindings.md#coverage). The source clip has not been exported; no upload, provider task, paid job or generated take exists.

## Intended clip and request {#request}

| Field | Planned value |
| --- | --- |
| Local clip | `output/segments/the-kick-climbs.mp4`, pending export from the re-exported whole render |
| Whole-render global interval | [135, 147) seconds |
| Local interval | [0, 12) seconds |
| Global included frames at 30 fps | 4050–4409 |
| Local included frames | 0–359 |
| Intended profile | 1280×720, 16:9, 30 fps, H.264/yuv420p MP4, no audio track |
| Actual clip SHA-256, bytes and probe | Pending actual export; nothing here is a measurement |
| Whole render | `output/kickboxing.mp4`, pending re-export of the current source revision ([export state](source-bindings.md#export)) |
| Planned receiving model and mode | `dreamina-seedance-2-5-260628`, reference |
| Request budget | One 12-second video; 0 continuity videos, 0 images, 0 audio references |
| Upload | `{{SOURCE_CLIP_PUBLIC_URL}}`, unresolved; a local path is not a URL |
| Exact request | [payloads/the-kick-climbs.json](payloads/the-kick-climbs.json), 4645 bytes, raw LF SHA-256 `8d889af088c416bbbfa67e505c7ca0ac1f0c25f7549386bb2159bc537fe56f47` |
| Exact prompt length | 763 English whitespace-delimited words |

The single 12-second video stays below the carried 30-second / 10-video aggregate, and its raster, rate and container follow the [carried contract](../../../docs/research/seedance-2-5-handoff-contract.md). The maximum generated-output duration is unknown there and must be confirmed before submission. Native audio is disabled. No first/last-frame role is mixed with reference mode.

## Creative source mapping {#sources}

[Source bindings](source-bindings.md#source-epoch) own the raw SHA-256 of every source read, and [shared bases](source-bindings.md#shared-bases) map the identity, ring, impact and exclusion paragraphs, identical in all twelve requests, and the camera paragraph. This request's action paragraph consumes [screenplay#ring-bout](../../body/screenplay/kickboxing.md#ring-bout), raw SHA-256 `e37d7a62cd9f2b33fd95ba955c58560030baffbd674d83889e7f7f521943f1c8`, under “135–150: The Kick Climbs”.

Literal basis: “the glove flattens against it and blood sprays from B's nose” “Both men are flushed now; B's cheeks and left ribs are darkest where the blows have landed.”

[BoutScript](../../../src/bout/BoutScript.ts), raw SHA-256 `860798c2df95b5ab6971aa87160bff6c23213c9af887d8914ea84c4314540ef7`, supplies the contact or closest-pass second of every exchange in the interval. Local seconds in the prompt are these values minus 135:

| Row id | Global s | Local s | Attacker, technique → answer |
| --- | ---: | ---: | --- |
| `x103-b-jab` | 137 | 2 | B, jab → cover |
| `x104-b-cross` | 137.35 | 2.35 | B, cross → cover |
| `x105-a-jab` | 137.85 | 2.85 | A, jab → slip |
| `x106-b-hook` | 138.7 | 3.7 | B, hook → weave |
| `x107-a-cross` | 139.3 | 4.3 | A, cross → hit |
| `x108-b-low-kick` | 141 | 6 | B, low-kick → check |
| `x109-a-body-cross` | 142.3 | 7.3 | A, body-cross → hit |
| `x110-b-jab` | 142.9 | 7.9 | B, jab → slip |

Clean landings in this clip, each with a camera jolt from [FilmPlan](../../../src/film/FilmPlan.ts): `x107-a-cross` at local 4.3 s, `x109-a-body-cross` at local 7.3 s. Face landings (`x107-a-cross`) add the screenplay's blood spray and the hint's half-second wince from [Reaction](../../../src/bout/Reaction.ts). Body landings (`x109-a-body-cross`) sink in with a sweat spray and leave reddened skin. The opening sentence of the action paragraph states the skin marks accumulated from earlier landings, following the screenplay's “Every landed blow sinks into what it meets: gloves flatten against gloves, ribs and faces, sweat flies off struck skin, and skin stays reddened where it was hit.”

[FilmPlan](../../../src/film/FilmPlan.ts) begins the eight-second camera ease toward the aftermath's side-on view at 143 s, local 8 s.

The text supplies live-action identities, ring, light, impact detail and finish; the reference clip supplies movement, contact, camera and timing. These roles are semantic guidance, not a tested generator result or exact-frame following.

## Exact planned English prompt {#prompt}

Turn @Video1, a coarse 3D motion render, into photorealistic live-action footage of a professional kickboxing bout, shot like a high-end sports documentary. Use @Video1 as the sole reference for motion, camera and timing: keep its three people, their positions and spacing, every strike, contact and miss, every defence and footstep, and its camera path, with no cuts. This 12-second clip is part 10 of 12 of one continuous 180-second take.

The performer in red gloves is fighter A: a 28-year-old man, 180 cm and 80 kg, with broad shoulders, a thick athletic trunk, developed arms and thighs, warm medium skin and short-cropped dark hair. He wears red boxing gloves over wrist wraps, red mid-thigh shorts with a pale waistband and a mouthguard; his chest and feet are bare. The performer in cyan gloves is fighter B: a 30-year-old man of the same height and competitive build, with dark cool-toned skin and a closely shaved head. He wears cyan gloves over wrist wraps, navy mid-thigh shorts with cyan side stripes and a mouthguard; his chest and feet are bare. The man in white is the referee: an adult of 178 cm with a regular athletic build and short dark hair, in a white long-sleeve shirt, black trousers and black shoes, with bare hands.

The setting is an indoor kickboxing ring at night: a pale matte canvas, four taut ropes on padded posts, two diagonally opposite light-padded neutral corners, one red and one cyan corner, a dark apron and darkness beyond the ropes. Broad neutral overhead light with soft frontal fill separates gloves, limbs and contact shadows.

The camera stands inside the ropes on A's left side of the fighting line, about 2.75 m from the pair at chest height, with a moderate wide lens of about 27 mm full-frame equivalent, and drifts slowly along that side. A stays screen-left, B screen-right and the referee behind their line; heads, gloves and bare feet stay in frame together.

Show the force of every landed blow. The glove or shin visibly sinks into the flesh it meets and the glove flattens against it; sweat sprays off the struck skin, less when a guard takes the blow. A clean blow to the face also throws a light spray of blood from the nose, mouth or cheek, and the struck man winces with his eyes squeezed shut and brows lowered for about half a second. Every clean landing jolts the camera with a brief damped vertical shake of about 0.3 s. Struck skin reddens and stays marked, darkening on the faces and struck rib sides as the round goes on, and both men's skin grows slick with sweat.

Both men are flushed and slick with sweat; B's cheeks and left ribs are the darkest marks. At 2.0 s B comes forward with a jab-cross into A's head guard; A's jab misses B's slip. At 3.7 s B's left hook passes over A's shallow weave. At 4.3 s A rises and lands a right cross flush on B's face: the glove flattens against it, blood sprays from B's nose, the camera jolts and B's head snaps back along the punch. His trunk follows, he winces with eyes squeezed shut and his guard opens for a moment as he staggers a short step, then he resets. At 6.0 s B's right low kick meets A's left shin check and both replant. At 7.3 s A lowers a right straight into B's left body side, sinking it in with a spray of sweat and a jolt; B's breath catches and he closes the elbow. At 7.9 s B's jab misses A's slip. From 8.0 s the camera begins a slow, smooth move: it rises and pulls back while its view widens, keeping both fighters, their feet and the referee in frame. The clip ends with both men at striking distance and A's weight settling for his next attack.

Between exchanges both men keep moving with separate small steps about 1.8 m apart, guards up and breathing hard; they step in for each attack and back out after it.

Keep realistic human anatomy, closed fists inside the gloves and the gloves on the hands. Keep the blood sports-realistic: light spray and small drops only, with no open wounds, cuts, pools of blood or gore. Add no other people, visible audience, cornermen, text, captions, logos, scoreboard or slow motion, and do not turn any miss or block in the reference into a hit. Generate no audio; the film keeps its own soundtrack. This request uses semantic motion reference, not a guarantee of identical frames.

## Output and retention boundary {#retention}

Availability: the source clip does not yet exist, and no input or output bytes are retained for this request. After export, add the clip's measured duration, frames, profile, bytes, SHA-256 and first/last-frame observations here, with the whole render's identity, keeping this planned epoch. A future submission becomes its own attributable attempt with the exact sent payload, job ID and retained outputs under [generation records](../../../.agents/skills/production/generation-records.md). Large files stay in ignored `output/segments/` or `media/generated/`; Git keeps these records, not the media.
