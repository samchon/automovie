# Video prompt source bindings

These are planned, unsubmitted video-diffusion requests prepared on 2026-11-05 KST under the [prompt-preparation commission](../../../PROJECT.md#video-generation-prompts) and the [generation-record procedure](../../../.agents/skills/production/generation-records.md). Each request restyles one segment of the deterministic 3D render into live-action footage while the render carries motion, contact, camera and timing. No segment has been exported, uploaded or submitted, and no generated take exists.

## Segment coverage {#coverage}

| # | Record | Global seconds | Global frames at 30 fps | Seconds | Screenplay H3 | Prompt words | Payload raw SHA-256 |
| ---: | --- | --- | --- | ---: | --- | ---: | --- |
| 1 | [Touch into the first counter](touch-into-the-first-counter.md) | [0, 15) | 0–449 | 15 | 0–15: Touch Into the First Counter | 791 | `4d2213ec0128e7285cb7bdff8d45043feb7db75d95268940f5259b091a03bc32` |
| 2 | [A finds the body](a-finds-the-body.md) | [15, 30) | 450–899 | 15 | 15–30: A Finds the Body | 803 | `f466e87371dcdb6d52c666b2d32a37d28af20e31b823be39a769a8dffa139ae5` |
| 3 | [B answers below the guard](b-answers-below-the-guard.md) | [30, 45) | 900–1349 | 15 | 30–45: B Answers Below the Guard | 783 | `fca23a926340393277351da334f7b4bfc7dea9aee7ef5c0b07725f5afec5adde` |
| 4 | [Pressure changes hands](pressure-changes-hands.md) | [45, 60) | 1350–1799 | 15 | 45–60: Pressure Changes Hands | 783 | `b58beeac486497623591c8e59494041eec46eed4cb3bcbe3b31e8363c2625553` |
| 5 | [The body kick returns](the-body-kick-returns.md) | [60, 75) | 1800–2249 | 15 | 60–75: The Body Kick Returns | 748 | `5cac7d3e13adb7d35716c93603d96137132847f9797dc47399bc49e36b4334e2` |
| 6 | [Counters between the hands](counters-between-the-hands.md) | [75, 90) | 2250–2699 | 15 | 75–90: Counters Between the Hands | 727 | `d7dc3338ed3d721988d0360a1383e2a65fe4c03e8560158598abb29fc4a87308` |
| 7 | [Fighting for the center](fighting-for-the-center.md) | [90, 105) | 2700–3149 | 15 | 90–105: Fighting for the Center | 742 | `8c6029f4630bbd9870ce21e2c5aeaf1cdefbc6fe67c13ed8e79595c3bf10c042` |
| 8 | [B drives A back](b-drives-a-back.md) | [105, 120) | 3150–3599 | 15 | 105–120: B Drives A Back | 749 | `1c541b5be9917149971e2ae7f98a8370055c01347aa2cd2ff8de2ce23e7bea5f` |
| 9 | [A turns back into range](a-turns-back-into-range.md) | [120, 135) | 3600–4049 | 15 | 120–135: A Turns Back Into Range | 753 | `058dbca9260a73200c5779413fef9fa1e92efd867a3d8a15b7636b41a28bcd94` |
| 10 | [The kick climbs](the-kick-climbs.md) | [135, 147) | 4050–4409 | 12 | 135–150: The Kick Climbs | 763 | `8d889af088c416bbbfa67e505c7ca0ac1f0c25f7549386bb2159bc537fe56f47` |
| 11 | [High-kick knockout and neutral corner](high-kick-knockout-and-neutral-corner.md) | [147, 157) | 4410–4709 | 10 | 135–150: The Kick Climbs / 150–165: Down and the Count | 830 | `06f72fa9bc8a7f3e10b0d72ccc36174ef8a6d588d8640a46b6ac325783b32712` |
| 12 | [Ten count and celebration](ten-count-and-celebration.md) | [157, 180) | 4710–5399 | 23 | 150–165: Down and the Count / 165–180: Ten, Then the Celebration | 850 | `2d33d6e8a130c35b02d579aa5cd534446b5d5e20c0fb36d7c1a60f50ee5eb257` |

The twelve segments cover [0, 180) seconds, all 5400 frames, with no gap and no overlap; each of the 112 BoutScript exchange rows falls inside exactly one segment. From 0 to 135 seconds the boundaries are the screenplay's fifteen-second H3 groups, which fall in quiet footwork at least one second from the nearest exchange row. The commission requires the decisive kick and the fall without a cut, so 150 seconds is not a boundary. The boundary at 147 seconds lies between B's missed jab at 142.9 and A's body hook at 148.9 that flows into the kick. The boundary at 157 seconds is where the referee opens the count after A reaches the neutral corner at 156.8, so the whole count stays in one clip. Whole-second durations fit the payload's duration field and the carried 4–30-second clip budget.

No overlap or previous-clip continuity video is used, so every request spends only its own clip against the 30-second aggregate. Adjacent clips cut from one whole render share their boundary states. Independently generated clips can still drift in identity, light, lens or accumulated skin marks at the joins. The identity, ring, impact and closing paragraphs are therefore word-for-word identical in all twelve requests, and each action paragraph opens by restating the marks accumulated so far. No reference image exists that could tighten identity further.

## Current source epoch {#source-epoch}

Raw SHA-256 over the LF working-tree bytes read for this preparation (the repository's `.gitattributes` normalizes text to LF). The working tree is branch `feat/kickboxing-motion` over HEAD `e016b4c945869b8554b42a153912210912dc1bfa`, including the uncommitted revision with seven clean face landings, impact sweat, blood and skin marks, the wince and the camera jolt. These identities describe the sources read for the planned text; they are not inputs observed by a generator.

| Source and precise owner | Raw SHA-256 |
| --- | --- |
| [Project, video-generation prompts](../../../PROJECT.md#video-generation-prompts) | `6356abd80c83478255d35ac57c9a4fa60f53ecf3b3a237de72b28e6a16ac2c7c` |
| [Commission](../../instructions/commission.md#presentation) | `7cb07d850ee33c027e4c3a2f37151c9f940237cb0c75623a5077d81c15e2fb47` |
| [Fighter A](../../body/settings/fighter-a.md#identity) | `7eb4e57abb7d86ccce9360bc750654e0cc637d014b67a3ab283c45b0ee6812a2` |
| [Fighter B](../../body/settings/fighter-b.md#identity) | `b9c9a8b3b3e0e66a7bf8e3410519f954bf935266b6ed7e4929f9994cce3cef17` |
| [Referee](../../body/settings/referee.md#identity) | `b4b722a515d1d2d5b3e88b24ca9e80fe494e1a3f4b98121ddd7993e3a8caec40` |
| [Ring](../../body/settings/ring.md#space) | `dd257f0c7a983b0b668cf5c9f5cde2ee461e39b594825efc752693b9fa8734ff` |
| [Screenplay, ring bout](../../body/screenplay/kickboxing.md#ring-bout) | `e37d7a62cd9f2b33fd95ba955c58560030baffbd674d83889e7f7f521943f1c8` |
| [BoutScript exchange table](../../../src/bout/BoutScript.ts) | `860798c2df95b5ab6971aa87160bff6c23213c9af887d8914ea84c4314540ef7` |
| [FilmPlan clock, camera and impact jolt](../../../src/film/FilmPlan.ts) | `4d87ccf5e5bdca98860c345e6014d1f4eed5518e3c8d8dffb2b5d9f9e30518b5` |
| [Aftermath wide camera and corner route](../../../src/bout/Aftermath.ts) | `bd4ee57910f422f65459077c515777fa637565b3c6c64fb31a25869c2f62270b` |
| [Referee cues](../../../src/bout/RefereeCues.ts) | `74f312dbf7b8b141d5af17b20b60d6115fc8646b12f6b834dbaf647d20fb938b` |
| [Received-blow reaction and wince](../../../src/bout/Reaction.ts) | `33a8c8f7a8f7247a423927dfd5957f229849c6fab80bd92beb08de2f8d395d57` |
| [Face channels (wince)](../../../src/bout/FighterBody.ts) | `01958134ec3ddaf5427251e1b8a6844638caf3b49aeee1d295cd54ee625b7587` |
| [Receiver contract](../../../docs/research/seedance-2-5-handoff-contract.md) | `5e0961b22d0e836e9936b294fdf757d79b276b53349a7f1f7dc4726999066ebc` |

## Shared bases {#shared-bases}

| Request paragraph | Source and literal basis | Transformation or production choice |
| --- | --- | --- |
| Opening: restyle, reference role, part n of 12 | [Project](../../../PROJECT.md#video-generation-prompts): “The render is the motion, camera, contact and timing reference” | Photorealistic live-action documentary finish is a delegated production choice. It serves Project's “requested optional real-man appearance must share the same proportions, rig, contacts and motion”. |
| Fighter A | [Fighter A](../../body/settings/fighter-a.md#identity): “28-year-old adult man, 180 cm tall and 80 kg”, “red gloves, red mid-thigh shorts with a pale waistband, a mouthguard and wrist wraps”, “Warm medium skin” | Short-cropped dark hair is a new incidental choice: settings name no hair, and twelve independent requests need one stable cue. |
| Fighter B | [Fighter B](../../body/settings/fighter-b.md#identity): “30-year-old adult man, 180 cm tall and 80 kg”, “Cyan gloves, navy mid-thigh shorts with cyan side stripes, and dark cool skin” | Closely shaved head is a new incidental choice for the same reason. |
| Referee | [Referee](../../body/settings/referee.md#identity): “178 cm tall and 76 kg”, “A white long-sleeve shirt, black trousers, black shoes and bare hands” | Short dark hair is a new incidental choice. His spoken words stay in the soundtrack; prompts ask for visible mouth, hand and gaze performance. |
| Ring and light | [Ring](../../body/settings/ring.md#space): “Two diagonally opposite light-padded corners are neutral; the other corners are red and cyan”; [light](../../body/settings/ring.md#light): “Broad neutral overhead light and soft frontal fill”, “The surrounding audience stays outside the image” | Restated as the setting; the audience line becomes “no visible audience”. |
| Bout camera | [FilmPlan](../../../src/film/FilmPlan.ts) `camera()`: side offset 2.75 m on A's left of the axis, height 1.55 m, target height 1.0 m, vertical field of view 48°, drift 0.35 sin(t/17) m | 48° vertical on a 24 mm-high full frame is 12 / tan 24° ≈ 27 mm. Inspected render stills show A screen-left, B screen-right and the referee behind them. |
| Aftermath camera | [Aftermath](../../../src/bout/Aftermath.ts) `wideCamera`: 3 m beside a focus at 0.75 m height, camera 1.7 m above it; FilmPlan eases into it over 143–151 s and widens to 62° | 62° vertical is 12 / tan 31° ≈ 20 mm; “about 2.4 m up” rounds 2.45 m. |
| Impact: compression and sweat | [Screenplay](../../body/screenplay/kickboxing.md#ring-bout): “Every landed blow sinks into what it meets: gloves flatten against gloves, ribs and faces, sweat flies off struck skin, and skin stays reddened where it was hit.”; [Fighter A](../../body/settings/fighter-a.md#limits) and [Fighter B](../../body/settings/fighter-b.md#response): “Each clean blow sinks into his skin and throws sweat off it; a clean face blow also draws blood from his nose or mouth.” | Owner direction: visible glove and shin compression into flesh, glove flattening, and a realistic sweat spray on every landed blow, lighter on guarded contacts. |
| Impact: blood spray | Same owners; per-landing screenplay sentences such as “sweat and a thin spray of blood leave his nose and mouth” and “The shin sinks into B's face; sweat and blood burst from it and spatter the canvas.” | Owner direction: a light blood spray from nose, mouth or cheek on the seven clean face blows and the knockout. Kept sports-realistic: no wounds, cuts, pools or gore. |
| Impact: skin marks | [Fighter A](../../body/settings/fighter-a.md#limits) and [Fighter B](../../body/settings/fighter-b.md#response): “Struck skin reddens and stays marked for the rest of the bout.”; screenplay: “Both men are flushed now; B's cheeks and left ribs are darkest where the blows have landed.” | Progressive reddening and bruising on faces and struck rib sides; each action paragraph opens with the marks accumulated so far. |
| Impact: canvas blood drops | Screenplay: “Drops of blood mark the canvas beside his face.” | Small dark drops beside B's face from the knockout through the count and celebration (segments 11 and 12). |
| Impact: camera jolt | [FilmPlan](../../../src/film/FilmPlan.ts): “Every clean landing jolts the view with a damped shake of at most a few centimetres for 0.3 s.” | Each clean landing is named with a jolt in its action paragraph. FilmPlan scales jabs at 0.5, other punches 1, kicks 1.4 and the knockout 2.5, which the prompt calls its strongest jolt. |
| Head landings and wince | Screenplay: “head snaps back, his eyes squeeze shut and his guard opens”, “A's head whips back, his mouth opens and he rocks onto his rear foot”; [FighterBody](../../../src/bout/FighterBody.ts): “Pain wince in [0, 1]: eyes squeezed shut and brows lowered.” | Each of the seven clean face landings (23.10, 37.95, 53.85, 96.85, 113.30, 128.85 and 139.30 s) uses the head-snap reaction (head along the punch, trunk following, short stagger, open mouth) and the hint's wince of about 0.5 s from [Reaction](../../../src/bout/Reaction.ts). |
| Rhythm between exchanges | [BoutScript](../../../src/bout/BoutScript.ts) `neutralRange = 1.82`; screenplay: “neither man waits in a shared idle pose” | “about 1.8 m apart”, stepping in and out for each attack. |
| Closing exclusions | [Commission](../../instructions/commission.md#presentation): “No replay, time compression or commentary”; [Fighter B](../../body/settings/fighter-b.md#response): “neither a head impact nor the visible result establishes a particular injury mechanism” | No slow motion and no added people or text; misses and blocks stay misses and blocks. Blood stays light spray and small drops with no wound, cut, pool or gore, so the image asserts no injury mechanism. Audio generation is off because the film's bells, referee voice, contacts and breaths come from the deterministic soundtrack. |

## Receiving contract and reference roles {#receiving-contract}

The [carried Seedance 2.5 contract](../../../docs/research/seedance-2-5-handoff-contract.md) owns the documented model, mode and input limits. This production did not reopen the official pages, so every limit needs a fresh check before submission. Each payload plans `dreamina-seedance-2-5-260628` in reference mode, one `reference_video`, `ratio` 16:9, `duration` equal to the clip seconds and `generate_audio: false`. No `watermark` field is supplied, and the provider default is unverified. No image or audio reference is attached: no reference image of A, B or the referee exists, and face-input permission is unverified. The provider's content policy for blood in generated video is also unverified.

The prompts map performers by the render's visible cues: red gloves and red shorts are A, cyan gloves and navy shorts are B, and the white shirt is the referee. The polygon hint carries the head snap, wince and camera jolt, and draws sweat and blood as small droplets, blood stains on the canvas and a whole-part skin flush; the text still sets their realistic look, because the hint draws them as simple shapes and colours. Following is semantic, not frame-exact. Upload, account activation, the maximum output duration and the output frame rate remain unknown. Finishing must conform any generated take to the 30 fps film timeline and lay the deterministic soundtrack back at the segment's global offset.

## Segment export and media state {#export}

The local whole render `output/kickboxing.mp4` (43373664 bytes, raw SHA-256 `a2734d644188dc389333f6d80c0f2fbf0b8e0ff50bd622112dd22bcd12dd6124`, 1280×720, 30 fps, 180 s, H.264 with AAC) was last written 2026-11-05T04:49:59.505Z. It predates the current source revision (`src/film/FilmPlan.ts` last written 2026-11-05T06:26:16.949Z), so it is not the source of these segments. Re-export the whole film from the revision committed with these records using the [README render command](../../../README.md#check-and-export). Then cut each segment with this planned, unexecuted command:

```powershell
ffmpeg -i media/automovie/videos/kickboxing.mp4 -ss <start> -t <seconds> -an -c:v libx264 -pix_fmt yuv420p -r 30 media/automovie/videos/segments/<record-name>.mp4
```

Seeking after the input keeps the cut frame-accurate. Each clip must decode to exactly 30 × seconds frames. Record its bytes, SHA-256, probe, first/last-frame check and the whole render's identity in its request record before any upload.

Availability: the whole render is retained only locally, in ignored `output/`, with no durable archive. No segment clip or generated output exists. Another checkout restores the render by re-exporting from source and comparing it with the export's `.framemd5` receipt; differing bytes are a new render, not a restoration.
