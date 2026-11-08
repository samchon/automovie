# Kickboxing acceptance

The film's delivery checklist and the results observed on the actual Viewer, headless stills and render on 2026-11-08 at source revision ca0e61e6c and later. Logic units run separately (`pnpm --filter kickboxing test`, 15 units, all passing, the slowest the whole-round schedule unit at about 0.5 s); nothing here is a unit test.

## Viewer {#viewer}

| Check | Method | Result |
| --- | --- | --- |
| The film mounts and reports no legality violation | `http://127.0.0.1:5199/?rig=1`, `window.__afReport().violations` | Mounted; 0 violations |
| Every decided contact is made by the displayed colliders | `window.__afReport().findings`: the outcome audit against the measured contacts of all touching strikes | 0 findings, down from 21 and then 9 in the earlier rounds of this session (the earlier movie refused 35 of 99) |
| The soundtrack comes from the same preparation | `window.__afSoundtrack().cues` | 555 cues from the schedule and the measured receipts |

## Stills {#stills}

Headless stills through the same Viewer (`pnpm --filter kickboxing render --film kickboxing --at … "http://127.0.0.1:5199/?rig=1"`), retained locally under `media/automovie/kickboxing/frames/` (ignored media).

| Round | Seconds | Observation | Cause and repair |
| --- | --- | --- | --- |
| 1 | 1, 14.65, 38.1, 61.2, 149.6–150, 151.6, 158, 168.5 | Gloves floated off the hands; both fighters faced the same way; the finish camera rose overhead and lost A; the Brazilian kick toppled A horizontal | The glove offset was rotated twice; the engine's axis-angle takes degrees and the roots were given radians; wide framing used the vertical field of view; the fit's support knee let the body topple. All repaired by cause. |
| 2 | 149.7, 149.85, 150, 152, 158, 168.5 | B sat upright instead of lying; the Brazilian kick stayed at waist height | The same degrees cause (roll, pitch and yaw near zero). Repaired; the next mount audits 0 findings including the finish contact. |
| 3 | Frames 1, 30, 62.6, 79.9, 149.85, 150, 151.6, 160, 168.5 and 175 decoded from the delivered `film.mp4` | Both fighters face each other in guard; B lies on his right side through the count with the referee beside him and A in the far neutral corner facing the centre; at 168.5 the referee signals across his body and A celebrates with both gloves overhead. Open: at 150.0 the finish view looks from behind B, so the descending kick is hidden by B's body although the audit measures its contact; from the knockout the referee stands over B's torso rather than a step off it. | Recorded as open items for the next round: the finish bearing should frame A's kicking side, and the referee's knockdown point should clear the fallen body's extent. |

## Measured targets on the resolved round {#targets}

Measured on the resolved schedule and tracks (the same computations the units assert), 0–150 s unless stated:

| Target (research) | Threshold | Measured |
| --- | --- | --- |
| Strikes thrown in combinations ([exchanges](../research/kickboxing/exchanges.md#targets)) | ≥ 75% | 85.1% of 141 strikes |
| Strikes per fighter-minute of action | 20–40 | A 26.0, B 26.4 |
| Kicks prepare or finish a combination | every round kick | legality rule holds (0 violations) |
| Lateral share of footwork ([ring generalship](../research/kickboxing/ring-generalship.md#targets)) | ≥ 30% | 49.8% |
| Turn of the fighters' line | ≥ 1 revolution | 3.5 revolutions |
| Time on the ropes | > 0 and ≤ 25% | 17.1% |
| Referee side view ([referee](../research/officiating/referee.md#targets)) | ≥ 90% | 90.8%; never between the fighters |
| Camera moving ([coverage](../research/cinematography/fight-coverage.md#targets)) | ≥ 60% | 90.6% of the film |
| Mean interval between size changes | 2–8 s | 2.69 s |

## Full render {#render}

| Check | Method | Result |
| --- | --- | --- |
| 1280x720, 30 fps, 5400 frames, 180 s, with audio | `pnpm --filter kickboxing render --film kickboxing http://127.0.0.1:5199/`, then the command's complete decode | Pending |
| Listening: bell, referee commands and count, contact sounds only on contacts | Listening to `media/automovie/kickboxing/videos/film.mp4` | Pending |
