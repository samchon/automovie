# Human generalization

Evidence and options for replacing the calibration tables with one reusable construction. The [Human skill](../../../.agents/skills/human/SKILL.md) owns the goal, order and boundaries. Everything here is a starting point to test, and a better construction replaces it.

## Where the table numbers are

The seven calibration modules occupy 4,981,463 bytes. The torso, ear and foot regions hold 510,848 section numbers, coefficients and slopes together. The four head chains `head`, `head.lower`, `head.middle` and `head.upper` hold 55.9 percent of them, and `head` alone holds 188,416 in 184 layers, which is 61 percent of the torso region's numbers. The trunk, arm and leg chains have only 13 to 28 layers each. Chains named `right` hold 17.2 percent.

## Independent numbers in f1

Modes needed per chain, from a singular value decomposition of each chain's layer coefficients with each layer's mean removed. The residual is the RMS control-point distance in millimetres.

| Chain | Layers by controls | Modes within 1 mm | Modes within 0.5 mm |
| --- | --- | --- | --- |
| `trunk` | 28 by 256 | 6 | 8 |
| `leg.left` | 19 by 256 | 4 | 5 |
| `arm.left` | 24 by 128 | 6 | 8 |
| `foot.left` | 18 by 256 | 4 | 5 |
| `head.upper` | 28 by 256 | 3 | 4 |
| `head.middle` | 29 by 256 | 6 | 9 |
| `head`, every sixth layer | 31 by 256 | 7 | 10 |

The sampling can stay dense while the independent numbers shrink. RMS hides local features such as the nose, lips and auricles, slopes were left out, and the transverse harmonic count of the modes was not measured.

## What a centre-and-dimension law explains

Distance between f1 and each other person on the same vertices, normalized by stature and measured along f1's surface normal. Each cell is the RMS range in millimetres over f2, m1 and m2.

| Part | Stature only | Per-section centre and in-plane affine | With low harmonics |
| --- | --- | --- | --- |
| Leg | 2.4 to 4.6 | 0.8 to 1.2 | 0.37 to 0.56 |
| Head | 3.0 to 4.5 | 1.6 to 2.3 | 1.1 to 1.5 |
| Arm | 2.7 to 8.0 | 0.9 to 2.4 | 0.7 to 2.1 |
| Trunk | 6.3 to 20.5 | 2.5 to 5.9 | 1.5 to 3.0 |

Harmonics reach order 3 on limbs, 4 on the trunk and 6 on the head. Interpolating the section law between 12 evenly spaced anchors worsened vertex-distance RMS by at most 14 percent against fitting every section, so sparse dimensions can drive dense sections.

These are in-sample fits on a rough geometric part split, with coefficients fitted per person rather than predicted from public parameters. Hands, feet and ears were not compared. Four people from one source cannot separate human anatomy from that source's own low-rank deformation.

## Candidate construction

`S(s, theta; p) = C(s; p) + R(s; p) D(s; p) Q(s, theta; p)`, per part:

- `C` and `R` are centres and frames derived from the skeleton anchors.
- `D` holds width and depth, interpolated through named measurement anchors.
- `Q` is a normalized section built from a few shared longitudinal functions and transverse shapes, evaluated at any layer and control count.
- Reliefs carry named local features with their own location, axis, width and depth: breasts, buttocks, navel, nose, lips, auricles.

## Findings to reuse

These come from earlier candidates and were not rechecked here, so confirm one before depending on it.

- Key stations: use bind joints plus sites from published definitions (ISO 8559-1, ANSUR II, Farkas), locating an extreme site on the observed sections. Long spans still need their own sites: with only knee, calf and ankle keys the thigh lost its fullness.
- Frames: take each anchor from a joint's bind affine by polar decomposition, and name its axes from joints as the ISB coordinate systems do. Carry in-plane axes by rotation-minimising transport from one start, starting at a shared key's frame when the chain has one. A frame turned only at a shared key blends across the last interval: on f1 the arm's carried front lies 99.57 degrees from the palm's.
- Limbs build their own front: the trunk's forward carried onto the femur lies 8.32 degrees off the leg's hinge-normal front on f1.
- Caps: at a maximum terminal, start the cap where the section's equivalent radius `sqrt(A / pi)` reaches the pole's height over the section's plane. On f1's digits and toes the sides agree within 0.04 mm, while the last area maximum picks noise.
- Courses: bind waist and underbust to the same material sites through deformation. Reselecting them moved the two courses from 100 mm to 20 mm apart and made a sharp waist band.
- Placement: carry only attachment translation into a child's sizing. Mixing the parent's radial scale in made the shoulder shelf and first-inward flare.
- Sizing: solve scale against the actually scaled hull. An extent approximation with a 0.7 to 1.4 clip misreports girth.
- Maps: reflection reverses source phase, and an affine change of station rescales first and second derivatives by its first and second powers. Carry both through every consumer.
- Length laws: construct positive progress directly. Zero-jet interpolation of endpoint displacement can reverse a feasible contraction.
- Semantics: check what an existing landmark selects before reusing it. A menton selector that included front-neck points made a broad short collar.
- Capacity: f1's page publication is about 223 MB against a 256 MiB cap in `HumanImageProcess.publication`, and raising ring sampling to 329 MB stopped every whole-figure image.

## Disproven strategies

- A predetermined sparse polynomial or primitive family: boundaries and named measurements agreed while the head, trunk and limbs lost normal anatomy.
- Five keys on the head: the family converged into a cone despite exact selected boundary values.
- Three full profiles for the abdomen: the local navel disappeared, because full sections carry no independent feature location or depth.
- Extracting features as residuals against a coarse surface: a broad difference is not a feature, and the extractor produced deep flank and lumbar grooves.
- Square collocation at arbitrary phases: it amplified Foot section spans about 2,800 times, reaching a 148,836 mm control from ordinary anchors. Use a standard periodic interpolant, and keep mandatory contacts separate from shape observations.
- Forcing fine source derivatives across sparse keys: a 509 mm coefficient excursion appeared inside an 82 mm interval. Let a family generate its own derivatives.
- Choosing counts or smoothing by held-out rows of one mesh: the score keeps improving until the model reproduces the mesh.

## References to acquire

More renders of f1, f2, m1 and m2 add nothing to geometry, because their exact meshes already exist. New people add information. `registerReferencePerson.mts` accepts the 28 body controls, and `reference-model.json` costs about 6 MB per person with the shared vertex order, while Recovery curves cost about 50 MB and 140 photographs.

- Start with eight people at the extremes of height, fat, muscularity and masculine-feminine, and measure the cost per person.
- Then sweep one control at a time to both ends, 56 people at most, to read each control's response on the same vertices.
- Hold some people out of every fit, so the data judges the law instead of becoming a table to reproduce.
- Run acquisition separately; no slice waits for it.
