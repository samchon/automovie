# Joint range and the stickman skeleton

`IAutoMovieHumanPose` names every movable joint top to bottom and gives each degree of freedom one optional value in clinical units. `AutoMovieHumanSkeleton` derives a stickman skeleton from the generated body by rule and applies that pose to it, clamped to the ranges below. The ranges are preview clamps; measured means and handbook norms are not individual anatomical limits.

## Conventions

- Angles are clinical degrees from the anatomical neutral (upright, arms at the sides, palms forward, feet flat). The field name is the positive motion; the opposite motion is negative. The jaw is in millimetres at the incisors.
- Left and right are the person's own. Lateral flexion and rotation are positive toward the left.
- An omitted field keeps the generated body's rest posture, an A-pose with relaxed hands, not the anatomical neutral.
- Within a joint the degrees of freedom run sagittal, frontal, then transverse.

## Source grades

| Grade | Source |
| --- | --- |
| measured | [Soucie 2011](../sources/soucie-2011.md), adults 20 to 44, female and male means averaged (the generator has no sex input); [Verkouteren 2022](../sources/verkouteren-2022-mandible-rom-children.md) for the mandible |
| AAOS | AAOS normal values as transcribed by [Hendriks 2020](../sources/hendriks-2020-aaos.md) |
| recalled | Greene and Heckman 1994 (AAOS handbook), White and Panjabi 1990 (spinal segments) and Neumann 2017 (shoulder girdle), recalled and not reread at the relevant pages; they count as cited only once a source note exists |
| convention | no source read; a modelling choice |

A measured value can replace a clamp only when its measurement frame, loading and active or passive protocol agree with the pose field.

## Ranges (top to bottom)

| Field | Range | Grade |
| --- | --- | --- |
| `head.eyes.*.vertical` / `horizontal` | -30 to 30 / -45 to 45 | convention (engine eye baseline) |
| `head.jaw.opening` | 0 to 52.9 mm | measured (18-year model) |
| `head.jaw.protrusion` | 0 to 8.5 mm | measured (6 to 18 mean) |
| `head.jaw.lateralExcursion` | -10.35 to 10.35 mm | measured (18-year model) |
| `neck.atlantoOccipital.flexion` / `lateralFlexion` | -15 to 10 / -5 to 5 | recalled (White and Panjabi) |
| `neck.atlantoAxial.rotation` | -40 to 40 | recalled (White and Panjabi) |
| `neck.cervical.flexion` / `lateralFlexion` / `rotation` | -30 to 35 / -40 to 40 / -20 to 20 | AAOS cervical totals less the two joints above |
| `arms.*.shoulderGirdle.elevation` / `upwardRotation` / `protraction` | -10 to 45 / -10 to 60 / -15 to 15 | recalled (Neumann) |
| `arms.*.shoulder.flexion` | -60 to 170.4 | measured flexion, AAOS extension |
| `arms.*.shoulder.abduction` / `rotation` | -40 to 180 / -70 to 90 | AAOS / recalled |
| `arms.*.elbow.flexion` | -2.75 to 147.3 | measured |
| `arms.*.forearm.pronation` | -87.8 to 79.45 | measured |
| `arms.*.wrist.flexion` / `radialDeviation` | -70 to 80 / -30 to 20 | AAOS / recalled |
| `arms.*.hand.thumb.cmcFlexion` / `cmcAbduction` / `cmcOpposition` | -20 to 15 / 0 to 60 / 0 to 45 | recalled / AAOS / convention |
| `arms.*.hand.thumb.mcpFlexion` / `ipFlexion` | 0 to 50 / 0 to 80 | AAOS |
| `arms.*.hand.<finger>.mcpFlexion` / `mcpAbduction` | 0 to 80 / -20 to 20 | AAOS / convention |
| `arms.*.hand.<finger>.pipFlexion` / `dipFlexion` | 0 to 90 / 0 to 65 | AAOS |
| `spine.thoracic.flexion` / `lateralFlexion` / `rotation` | -10 to 30 / -15 to 15 / -40 to 40 | recalled thoracolumbar totals, convention split |
| `spine.lumbar.flexion` / `lateralFlexion` / `rotation` | -15 to 50 / -20 to 20 / -5 to 5 | recalled thoracolumbar totals, convention split |
| `pelvis.tilt` / `obliquity` / `rotation` | -90 to 90 / -90 to 90 / -180 to 180 | convention (root orientation, not a joint) |
| `legs.*.hip.flexion` | -17.75 to 132.1 | measured |
| `legs.*.hip.abduction` / `rotation` | -20 to 40 / -45 to 45 | AAOS / recalled |
| `legs.*.knee.flexion` | -1.3 to 139.8 | measured |
| `legs.*.knee.rotation` | -25 to 35, scaled by flexion / 90 | convention |
| `legs.*.ankle.dorsiflexion` | -58.35 to 13.25 | measured |
| `legs.*.foot.subtalarInversion` / `midfootSupination` | -5 to 5 / -15 to 35 | recalled (hindfoot, forefoot) |
| `legs.*.foot.hallux.mtpFlexion` / `mtpAbduction` / `ipFlexion` | -70 to 45 / -15 to 15 / 0 to 90 | AAOS / convention / recalled |
| `legs.*.foot.<toe>.mtpFlexion` / `mtpAbduction` / `pipFlexion` / `dipFlexion` | -40 to 40 / -10 to 10 / 0 to 35 / 0 to 60 | recalled / convention / recalled / recalled |

The shoulder ranges are clinical shoulder-complex values that include the girdle's share, so a girdle field added on top can exceed what a person reaches. In the AAOS transcription, shoulder adduction and thumb CMC abduction were added by Hendriks and colleagues rather than supplied by AAOS; the source note keeps this distinction.

Thoracic and lumbar subdivision and the knee-rotation scaling are modelling choices. A source for a total arc does not fix a subdivision or a flexion-dependent interpolation.

## Primary-source checks

These studies qualify recalled values without changing the ranges.

| Fields | Evidence and limitation |
| --- | --- |
| Atlanto-occipital flexion and lateral flexion; atlanto-axial rotation | [Panjabi 1988](../sources/panjabi-1988-upper-cervical-motion.md) reports cadaveric motion under pure moments. Its atlanto-occipital flexion/extension endpoints differ from the -15 to 10 degree range; atlanto-axial rotation is close to 40 degrees. It does not verify the recalled handbook values or the cervical residual obtained by subtraction. |
| Thumb CMC flexion and abduction | [White 2018](../sources/white-2018-thumb-cmc-rom.md) measures passive dominant-hand motion. Its mean flexion, extension and abduction differ from the clamp endpoints, so neither range becomes measured by association; the abstract does not establish opposition. |
| Shoulder-girdle elevation, upward rotation and protraction | [Ludewig 2009](../sources/ludewig-2009-shoulder-complex.md) distinguishes sternoclavicular, acromioclavicular, scapulothoracic and glenohumeral frames during active arm elevation. These coupled trajectories do not supply independent maximum clamps. Scapulothoracic upward rotation is not the scapula's rotation relative to the clavicle. |

## Stickman joint centres

Rules read the chain tree, eye globes and stature S, never a person-indexed table. Stature fractions are the ANSUR II joint-centre means of [skeleton](skeleton.md), sexes averaged.

| Bone | Rule | Grade |
| --- | --- | --- |
| `hips` | midway between the hip centres: the thigh axis chord (knee to crotch) extended to 0.518 S | derived |
| `spine` (lumbar), `chest` (thoracic) | trunk axis at the omphalion (0.245) and xiphion (0.617) fractions of the mid-hip to cervicale span, cervicale at mid-hip + 0.3425 S | derived (de Leva) |
| `neck` (C2 to C7) | axis at the neck/shoulder branch event | derived |
| `head` (atlanto-occipital) | midway between the ear-lobe chains' lower ends | convention |
| `atlas` (atlanto-axial) | 0.85 of the way from the neck base to the atlanto-occipital point | convention |
| `jaw` | temporomandibular point 0.006 S forward and 0.008 S above the atlanto-occipital point; chin 0.068 S below the eye centres | convention |
| `leftEye`, `rightEye` | calibrated eye globe centres | measured |
| `*Shoulder` (sternoclavicular) | at the shoulder height, one neck girth radius from the midline | convention |
| `*Scapula`, `*UpperArm` (glenohumeral) | at 0.80 S, the shoulder section's lateral extremity moved medially by the axillary arm girth radius | derived |
| `*LowerArm` (elbow) | along the arm axis at 0.162 / (0.162 + 0.151) of shoulder-to-wrist | derived (ANSUR II) |
| `*Hand` (wrist) | arm axis at the thumb branch event | derived |
| thumb | CMC halfway from wrist to the thumb branch, MCP at the branch, IP halfway to the tip | convention |
| fingers, lesser toes | 2:1:1 phalanx split, web halfway along the proximal phalanx | convention |
| hallux | two equal phalanges, web halfway along the proximal | convention |
| `*UpperLeg`, `*LowerLeg`, `*Foot` | hip centre; leg axis at 0.2865 S; leg axis end lowered to 0.0405 S | derived |
| `*Subtalar`, `*Midfoot` | at the ankle; 0.4 of the way from the ankle to the mean MTP | convention |

Bones use the engine humanoid names where they exist. `atlas`, `*Scapula`, `*Subtalar`, `*Midfoot`, `*HalluxProximal/Distal` and `*Toe2..5Proximal/Intermediate/Distal` are the Human's own, because the shared `AutoMovieHumanoidBone` vocabulary lacks them. The stickman runs its own forward kinematics instead of the engine's humanoid player, so the shared interface is unchanged.

Each bone's axes come from its rest direction. The rest posture's own clinical angles (arm and thigh from the vertical, hinge angles between adjacent segments, the ankle from the shank's lean) are subtracted, so a field's value is the clinical angle whatever the rest posture.

## Open items

- The recalled handbook pages, and frames and protocols compatible with each pose field.
- The spine joints sit on section centroids rather than the vertebral bodies.
- Finger and toe abduction, thumb opposition, tibial rotation and the pelvis bounds have no read source.
- Condylar gliding of the jaw and the coupled scapulohumeral rhythm are not modelled.
