# Kickboxing acceptance

The film's delivery checklist and the results observed on the actual Viewer, the delivered render and its complete decode on 2026-11-08 at source revision 30bde73ee. Logic units run separately (`pnpm --filter kickboxing test`: 21 units, all passing, the slowest the whole-round schedule unit at about 1.0 s, every other one under 0.3 s); nothing here is a unit test.

## Viewer {#viewer}

| Check | Method | Result |
| --- | --- | --- |
| The film mounts and reports no legality violation | `http://127.0.0.1:5199/?film=kickboxing`, `window.__afReport().violations` | Mounted; 0 violations |
| Every decided contact is made by the displayed colliders | `window.__afReport().findings`: the outcome audit against the measured contacts of all touching strikes, under the film seed's variation | 0 findings. The first mount of this round found 7 landed blows 0.000–0.052 m off their regions: the drawn contact offset had left the region's surface; it is now projected back onto the region's collider |
| The finish is unoccluded from the delivered camera | `window.__afReport().measures["finish-clearance"]`: the least separation, on the displayed colliders through the engine's contact query, of the sightlines from the delivered lens at 150.000 to the instep and lower shin at every frame of the descent (149.900–150.000) and to the jaw–neck region, each sightline stopping a head radius short of its point | +0.075 m, no finding; the watched points lie inside the delivered frame by a margin of 0.396 (`finish-in-frame`), from the open side's side-on view |
| The page reuses Human calibrations and publishes a frame digest | `.cache/artifacts` entries after the first mount; `window.__afFrameDigest(150)` twice and at 10 s | Two calibration entries (fighters, referee) stored and read on later mounts; the digest is a 64-hex SHA-256, identical for one second and different between seconds |
| The soundtrack comes from the same preparation | `window.__afSoundtrack().cues` | 616 cues from the schedule and the measured receipts; the count words at 158.000 … 167.000, the decision at 167.600 and the bell at 170.100 exactly |

## Stills {#stills}

Rounds 1–3 and 5 are stills decoded from the delivered `film.mp4`; round 4 is targeted Viewer stills (`render --at`), iterated on the finish alone. All are retained locally under `media/automovie/kickboxing/frames/` (ignored media).

| Round | Seconds | Observation | Cause and repair |
| --- | --- | --- | --- |
| 1 | 1, 14.65, 38.1, 61.2, 149.6–150, 151.6, 158, 168.5 | Gloves floated off the hands; both fighters faced the same way; the finish camera rose overhead and lost A; the Brazilian kick toppled A horizontal | The glove offset was rotated twice; the engine's axis-angle takes degrees and the roots were given radians; wide framing used the vertical field of view; the fit's support knee let the body topple. All repaired by cause. |
| 2 | 149.7, 149.85, 150, 152, 158, 168.5 | B sat upright instead of lying; the Brazilian kick stayed at waist height | The same degrees cause (roll, pitch and yaw near zero). Repaired; the next mount audits 0 findings including the finish contact. |
| 3 | 1, 30, 62.6, 79.9, 149.85, 150, 151.6, 160, 168.5, 175 | The finish view looked from behind B, so his body hid the kick; from the knockout the referee stood over B's torso | Repaired in round 4 by the visibility law and the referee's knockdown clearance. |
| 4 | 149.4–150.2, 151.6, 158, 168.5 (`finish-1` … `finish-6`) | The finish read as a clinch, then as a body kick: chest to chest, the kicking knee at B's chest, the shin meeting B at chest height on a horizontal line, A laid back with his head hidden; B popped up at the contact frame; the chamber knee stayed at hip height | Overlapping layers were averaged, halving the kick thrown while the body hook recovered; round-kick goals stated in the guard's frame were read in the body's turned frame; the turnover rolled the whole body about the stance origin, lowering the hips, and asked for an unreachable knee; the fit's imposed downward arrival turned the body over its support; the instep weapon sat on the foot's top; B's fall began from the guard and the settle lifted him by his planted feet's depth; the chamber was eased twice. All repaired by cause: additive layers, turned goals, the `TurnoverShape` law (hike, posterior tilt, highest reachable knee, apex, range), the instep at the ankle's front, the elbow block's sink with the glove under the shoulder line, the fall from the caught posture, and a single chamber blend. Accepted at `finish-8`, after the first full decode showed A out of frame at the count and the celebration: the visibility law had fallen back to a view behind A whose lens the ropes clamp in the corner; it now also requires the delivered hold to keep all three men in frame |
| 5 | 149.8, 149.95, 150, 151.6, 158, 168.5 | Side-on from the kick's open side: at 149.95 A's foot is over B's head from a knee above B's shoulder line; at 150.000 A's shin and instep come down onto B's neck behind his left ear over the lowered left arm, A leaning back with his face toward B; B lies on his right side from 151.6; at 158 the referee counts over B with A in the neutral corner, and at 168.5 A celebrates with both gloves overhead, all three in frame | — |

## Measured targets on the resolved round {#targets}

Measured on the resolved schedule and tracks (the same computations the units assert), 0–150 s unless stated. Seeded variation leaves every stance origin, timing and outcome unchanged (a step-in's angle bows its path, not its landing), so the round-3 figures stand; the targets unit passes on the current schedule. The Brazilian kick's range now follows its turnover geometry (0.62 m between stance origins at the contact for these bodies), and the finish-sight unit asserts it with a knee over B's sunk shoulder line and the instep on the region.

| Target (research) | Threshold | Measured |
| --- | --- | --- |
| Strikes thrown in combinations ([exchanges](../research/kickboxing/exchanges.md#targets)) | ≥ 75% | 85.1% of 141 strikes |
| Strikes per fighter-minute of action | 20–40 | A 26.0, B 26.4 |
| Kicks prepare or finish a combination | every round kick | legality rule holds (0 violations) |
| Lateral share of footwork ([ring generalship](../research/kickboxing/ring-generalship.md#targets)) | ≥ 30% | 49.8% |
| Turn of the fighters' line | ≥ 1 revolution | 3.5 revolutions |
| Time on the ropes | > 0 and ≤ 25% | 17.1% |
| Referee side view ([referee](../research/officiating/referee.md#targets)) | ≥ 90% | unit passes (90.8% in round 3); never between the fighters |
| Referee after the knockdown | never closer than a step to the lying body; A within 60° of his facing from 157 s | unit passes on every frame 150–180 s |
| Camera moving ([coverage](../research/cinematography/fight-coverage.md#targets)) | ≥ 60% | 90.6% of the film |
| Mean interval between size changes | 2–8 s | 2.69 s |
| Finish unoccluded from the delivered camera | clearance > 0 | +0.075 m on the displayed colliders |
| All three men in the finish view | A, B and the referee inside the delivered frame at the contact and every second to 180 s | The finish-sight unit asserts it on the resolved track; decoded stills at 158 and 168.5 show all three (the referee at the left edge) |
| Brazilian kick on its turnover | knee over the receiver's sunk shoulder line; instep on the region; foot descending into the contact | Displayed bodies: knee 1.37 m over B's left shoulder line at 1.28 m; instep at B's jaw–neck point (1.44 m); foot apex 1.6–1.75 m at 149.95, the shank rising about 8° into the region at contact, where Human's hip limits (flexion 132.1°, adduction 20°, rotation 45°) bind |
| Seeded variation | outcome classes and anchors invariant | identical starts, contacts, ends and outcomes under the film seed and two other seeds; one seed resolves identically twice |

## Audio {#audio}

Each cue is placed at its event by `SoundCues` and mixed by the render from the page's own cues; the alignment unit checks every cue against its event at 30 fps. The delivered audio was then measured on the complete decode.

| Check | Method | Result |
| --- | --- | --- |
| Every cue starts within one frame of its event | Unit `test_cue_alignment`: bell, words, impacts, steps, canvas landings, breaths and air against the schedule and receipts | Worst offset ≤ 1 frame (impacts sit on the measured contact frame, at most one frame from the scheduled contact; the canvas landings fall within half a frame of the fall's frames; every other cue at 0 offset) |
| Asset lead-in | First sample at −40 dB of each asset's peak | 0.5–9.4 ms for every asset (under a third of a frame) |
| Count voice | Audible onset in the decoded film audio, 5 ms RMS rising over the floor of the preceding 180 ms, relative to 158.000 … 167.000 | Under the crowd bed (floor −21 to −27 dBFS) a 12 dB rise is found for six of the ten words, +40 to +340 ms; a 9 dB rise for all ten, +20 to +325 ms. The words are placed on their seconds exactly (the cue list); the measured lag is each word's soft attack against the bed |
| Bell | The same measure relative to 170.100 | +5 ms at a 12 dB rise |
| No clipping | Peak of the pre-encode mix and of the decoded audio; samples at full scale | Pre-encode peak 0.809, decoded peak 0.811; 0 samples at full scale |

## Full render {#render}

| Check | Method | Result |
| --- | --- | --- |
| 1280x720, 30 fps, 5400 frames, 180 s, with audio | `pnpm --filter kickboxing render --film kickboxing http://127.0.0.1:5199/`, then the command's complete decode | Rendered in 22 min with the frame cache (`.cache/frames/kickboxing`: 5400 computed, 0 reused, 0 mismatched; the digest carries the production's source digest, so the previous run's frames were all invalidated by the camera fix and removed); decode: H.264 High 1280x720 yuv420p, 5400 frames at 30/1 over 180.000 s with no repeated image, AAC stereo 48 kHz over 180.000 s (8 640 512 samples per channel decoded), 44 491 664 bytes |
| Delivered file | SHA-256 of `media/automovie/kickboxing/videos/film.mp4` | `3bc1af508048cb4252a7e73e4cf2a43c1b2eb6503a272bb1a3daf0b563248053` |
