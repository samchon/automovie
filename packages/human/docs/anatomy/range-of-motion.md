# Range of motion

Human admits only poses a living body can take (#2800), with limits from clinical norms by age and sex, and flexion limits that soft tissue sets derived from the person's own volumes. This file compares the sources with the engine's current `DEFAULT_HUMANOID_ROM` (`packages/engine/src/rom/constants/DEFAULT_HUMANOID_ROM.ts`).

## Measured norms

CDC normal joint ROM study (`../sources/soucie-2011.md`), more than 600 US people without joint conditions, goniometry, means in degrees; grade measured.

| Motion | 2–8 F / M | 9–19 F / M | 20–44 F / M | 45–69 F / M |
| --- | --- | --- | --- | --- |
| Hip flexion | 140.8 / 131.1 | 134.9 / 135.2 | 133.8 / 130.4 | 130.8 / 127.2 |
| Hip extension | 26.2 / 28.3 | 20.5 / 18.2 | 18.1 / 17.4 | 16.7 / 13.5 |
| Knee flexion | 152.6 / 147.8 | 142.3 / 142.2 | 141.9 / 137.7 | 137.8 / 132.9 |
| Knee hyperextension | 5.4 / 1.6 | 2.4 / 1.8 | 1.6 / 1.0 | 1.2 / 0.5 |
| Ankle dorsiflexion | 24.8 / 22.8 | 17.3 / 16.3 | 13.8 / 12.7 | 11.6 / 11.9 |
| Ankle plantar flexion | 67.1 / 55.8 | 57.3 / 52.8 | 62.1 / 54.6 | 56.5 / 49.4 |
| Shoulder flexion | 178.6 / 177.8 | 171.8 / 170.9 | 172.0 / 168.8 | 168.1 / 164.0 |
| Elbow flexion | 152.9 / 151.4 | 149.7 / 148.3 | 150.0 / 144.6 | 148.3 / 143.5 |
| Elbow hyperextension | 6.8 / 2.2 | 6.4 / 5.3 | 4.7 / 0.8 | 3.6 / -0.7 |
| Forearm pronation | 84.6 / 79.6 | 81.2 / 79.8 | 82.0 / 76.9 | 80.8 / 77.7 |
| Forearm supination | 93.7 / 86.4 | 90.0 / 87.8 | 90.6 / 85.0 | 87.2 / 82.4 |

Passive limits, men 30 to 40 (`../sources/roaas-andersson-1982.md`): hip flexion 120.3 +- 8.3, extension 9.4 +- 5.3 (prone), abduction 38.8 +- 7.0, adduction 30.5 +- 7.3, internal rotation 32.6 +- 8.2, external rotation 33.6 +- 6.8; knee flexion 143.8 +- 6.4; dorsiflexion 15.3 +- 5.8, plantar flexion 39.7 +- 7.5; eversion 27.6, inversion 27.7. Observed individual ranges: hip flexion 90 to 150, knee flexion 115 to 160.

AAOS convention (`../sources/hendriks-2020-aaos.md`): neck flexion and extension 45, rotation 60, lateral flexion 45; shoulder flexion and abduction 180, extension 60; elbow 0 to 150; wrist extension 70, flexion 80; hip flexion 120, extension 20, abduction 40, adduction 20; knee 0 to 135; ankle plantar flexion 50, dorsiflexion 20; toe MTP extension 70, flexion 45; finger MCP 80, PIP 90, DIP 65; thumb MCP 50, IP 80.

The references disagree by 10 to 20 deg for the same motion (hip extension: AAOS 28 against 9.4 passive prone and 17 to 18 in Soucie; ankle plantar flexion: AAOS 48 against 39.7 passive and 54 to 62 in Soucie), because of active versus passive measurement, body position and observer (Roaas and Andersson). Human states for every limit whether it is active or passive and which posture of the neighbouring joints it assumes.

## Engine table against the measurements

| Joint, axis | Engine `DEFAULT_HUMANOID_ROM` | Measured (adults 20–44 unless noted) | Finding |
| --- | --- | --- | --- |
| Knee flexion | 0 to 150 | 141.9 F / 137.7 M; passive 143.8; up to 146 to 156 in loaded deep squats and kneeling | Engine allows more than unloaded norms; soft tissue sets the end, see below |
| Knee extension | min 0 | hyperextension 1.0 to 1.6, up to 5.4 in girls 2–8 | Engine refuses normal hyperextension |
| Elbow flexion | 0 to 150 | 150.0 F / 144.6 M | Matches women, generous for men |
| Elbow extension | min 0 | hyperextension 4.7 F / 0.8 M, 6.8 in girls 2–8 | Engine refuses normal female hyperextension |
| Hip flexion | -30 to 120 (swing cone 120) | 133.8 F / 130.4 M; passive 120.3 | Engine too low for women and children |
| Hip extension | to -30 | 17 to 18 (Soucie), 9.4 passive prone | Engine too generous |
| Hip abduction | -30 to 45 | 38.8 +- 7.0 passive men | Plausible |
| Shoulder flexion | to 180 | 172.0 F / 168.8 M, 164 to 168 at 45–69 | Engine allows the convention, above measured means |
| Forearm twist | -90 to 90 | pronation 82.0 F / 76.9 M, supination 90.6 F / 85.0 M | Plausible; asymmetric in reality |
| Ankle | flexion -50 to 20 | dorsiflexion 12.7 to 13.8, plantar flexion 54.6 to 62.1 (Soucie), 39.7 passive | Dorsiflexion limit too generous for adults, right for children |
| Wrist | -80 to 70 | AAOS extension 70, flexion 80 | Matches convention |
| Fingers | one generic -20 to 100 for every phalanx | MCP 80, PIP 90, DIP 65; thumb MCP 50, IP 80 | Engine has no per-joint finger limits |

Every engine limit is one adult value for all ages and both sexes. The measurements show women exceed men in nearly every motion, children exceed adults, and ROM falls with age.

## Soft-tissue limits

- Knee: thigh-calf contact begins at no less than 126 deg (men) and 128 deg (women); men make contact earlier; deep squats reach 146.5 +- 8.2 deg and kneeling 149.4 +- 7.5 deg; a larger proximal calf girth lowers the contact angle by about 1.1 to 1.5 deg per cm, and later contact allows deeper flexion (`../sources/mcgillivary-2015.md`, measured on 30 young adults). Zelle et al. 2007, as reported there, found thigh and calf girth correlated with the contact angle (R -0.54 and -0.79).
- Elbow and hip: the same mechanism (arm-forearm and thigh-abdomen contact) sets the end of flexion, but no measured source was read.

Derivation the generator can do: pose the joined cage at increasing flexion and record the angle where the opposing surfaces first meet; that angle is the contact onset, and the limit is the angle where the compressed soft tissue reaches its maximum compression. The McGillivary values are the check for the knee: a lean young adult should first touch at about 126 to 135 deg and stop near 145 to 155 deg.

## Coupled limits

Per-axis limits cannot express two-joint muscles (hamstrings limit hip flexion when the knee is straight; the finger flexors and extensors couple wrist and finger flexion, as Bridgman notes that the fingers cannot close with the wrist fully flexed) or contact between non-adjacent segments (hand to trunk, thigh to thigh, arm across the chest). #2800 already reports non-adjacent contacts; the two-joint couplings need either a coupled constraint in `interface` or a Human-side check.

## Open questions

- Hip flexion with the knee extended (straight-leg raise) by age and sex: no source read; it is the main coupled limit.
- Elbow flexion end set by arm-forearm soft tissue and its dependence on arm girth: no measured source read.
- Spine segmental ranges (flexion, extension, lateral bend, rotation per region) and their distribution across `spine`, `chest`, `upperChest`: no source read; the engine's spine values are unsourced.
- Shoulder abduction, rotation and the scapulohumeral rhythm by age: not read (Kolz 2021 abstract only).
- Neck ranges by age: only the AAOS convention.
- Soucie's protocol (active or passive, positions) is in the unread 201-page methods document.
- The engine table mirrors magnitudes across sides and does not mirror the abduction sign per side (its own comment says so); Human-generated skeletons supply per-bone constraints, so this matters only for the fallback table.
