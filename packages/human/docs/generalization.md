# Human generalization

Evidence and options for replacing the calibration tables with one reusable construction. The [Human skill](../../../.agents/skills/human/SKILL.md) owns the goal, order and boundaries. Everything here is a starting point to test, and a better construction replaces it.

## Where the table numbers are

The seven calibration modules occupy 4,981,463 bytes. The torso, ear and foot regions hold 510,848 section numbers, coefficients and slopes together. The four head chains `head`, `head.lower`, `head.middle` and `head.upper` hold 55.9 percent of them, and `head` alone holds 188,416 in 184 layers, which is 62 percent of the torso region's numbers. The trunk, arm and leg chains have only 13 to 28 layers each. Chains named `right` hold 17.2 percent.

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
| Leg | 2.8 to 4.8 | 1.0 to 2.1 | 0.38 to 0.56 |
| Head | 2.7 to 8.4 | 1.6 to 2.8 | 0.51 to 0.75 |
| Arm | 3.3 to 9.8 | 0.8 to 1.8 | 0.28 to 0.72 |
| Trunk | 6.0 to 19.9 | 2.7 to 4.8 | 0.87 to 1.5 |

The score recomputed this table with every vertex labelled by the nearest f1 chain and sections of about 100 to 150 vertices. The stature column also removes each part's mean offset. Harmonics reach order 3 on limbs, 4 on the trunk and 6 on the head. Interpolating the section law between 12 evenly spaced anchors worsened vertex-distance RMS by at most 14 percent against fitting every section, so sparse dimensions can drive dense sections.

These are in-sample fits with coefficients fitted per person rather than predicted from public parameters, and the harmonic column depends on how many vertices a section holds. Hands, feet and ears were not compared. Four people from one source cannot separate human anatomy from that source's own low-rank deformation.

## Score baseline

The figure before any slice, from the [score](../../../.agents/skills/human/verification.md#score). RMS in millimetres along the reference normal, on the figure as generated. The Morph basis was refitted without the held-out person; f1 cannot be held out, because the tables are f1. The stature laws scale f1, or the mean of the other people, to the person's height.

| Part | f2 held out | m1 held out | m2 held out | Best stature law, f2, m1, m2 |
| --- | --- | --- | --- | --- |
| Leg | 6.6 | 8.9 | 8.5 | 4.6, 5.4, 4.8 |
| Foot | 3.9 | 4.5 | 5.8 | 2.7, 5.1, 5.4 |
| Arm | 6.9 | 11.1 | 33.4 | 9.0, 11.4, 16.2 |
| Hand | 6.8 | 30.0 | 44.6 | 10.3, 13.0, 19.9 |
| Trunk | 8.7 | 11.0 | 13.1 | 9.4, 9.5, 16.9 |
| Neck | 10.0 | 16.0 | 6.8 | 7.1, 8.2, 20.8 |
| Head | 5.4 | 11.4 | 9.4 | 4.1, 5.6, 9.3 |
| Ear | 11.8 | 22.0 | 21.7 | 5.5, 5.7, 11.1 |

The current law loses to height alone in 17 of these 24 cells, so the bar a candidate must clear is low; beating it does not prove the candidate good. On f1 in sample the figure sits 0.2 to 0.6 mm from its reference.

Across 151 points of the declared domain, no point produced a non-finite value or a collapsed section. Five masculine points fold the head and ears, and two tall extremes add open mesh edges. 40 of 69 public scalars move nothing, and 7 of those that do reach under 0.7 of the requested change at an end of their range: chest, underbust, waist, high hip, neck base, elbow and knee. The domain bounds live in the score and become the stated domain at the end of the campaign.

## Leg slice

Both legs now come from one construction and a reflection in `AutoMovieHumanLegConstruction`, with its constants in `AutoMovieHumanLegPrior`. The figure reads them from public parameters, and the morph and warp no longer touch the legs.

| Part | f1 held out | f2 held out | m1 held out | m2 held out |
| --- | --- | --- | --- | --- |
| Leg, generated | 2.03 | 4.62 | 4.98 | 5.11 |
| Leg, tables at the baseline | none | 6.6 | 8.9 | 8.5 |
| Best stature law | 3.35 | 4.63 | 5.40 | 4.76 |

The law beats height alone on three people and loses by 0.35 mm on m2. Section by section, m2 loses only at the top of the thigh, where the trunk's crotch ring leaves the section about 6 mm too wide. f1's row is held out of the leg prior only: its crotch and ankle rings are still its own tables, so read it as an upper bound on how well the leg law can do, not as a generalization result. All four rows inherit tables at both ends, so the distance is judged again once the foot and trunk are generated.

The calf, knee and thigh tapes are exact at the stations the law solves, but those stations are the law's own, so that proves the solver only. Measured at the body's own girth extremes, gain is 1.13 for the calf, 0.64 for the knee and 0.43 for the thigh, against 1.06, 0.57 and 0.76 for the tables. The thigh is worse because the largest girth sits by the crotch ring, which the trunk owns and the thigh tape does not move. It returns with the trunk.

Sections and joins passed an inspection round on f1, f2 and m2 under both raking lights. The groin band and the gap at the crotch shrank against the tables under the same camera and light. The kink behind the ankle is in the tables too, and belongs to the foot.

The chain carries the law: leg sections stay star-shaped across the people acquired, from height 1344 to 2193 mm, apart from 7 of 1,296 sections on two extreme people in the first 16 checked.

### What the candidates taught

Three structures were tried on the way, and the score rejected the first two. Structures were compared with every person in the table, reserved people included, so a reserved person did not judge the choice of form; they are reserved from the fitted numbers only.

- A fixed stance: an inner edge line below the knee and an outer edge line above it, with a handover between them, on the idea that the two edges stay put while mass grows. It explained four people in sample and failed held out, because the four people's sex and length are confounded. Leg centre placement was 6.2 mm of a 6.75 mm section error.
- An axis in leg lengths alone: leg length explained the four people, held out at 3.0 mm against 7.0 mm for a fixed axis, and then failed the extremes by up to 54 mm.
- The accepted axis is a line per station in the constant, leg length, hip tape and the masculine-feminine control: 3.63 mm over all people left out one at a time, 0.8 to 3.7 mm on the four specimens, and 5.4 and 4.0 mm on two people reserved from every fit. The stance is that line at the ankle.

Other findings:

- Four people cannot separate sex from length, and that hid the knee's sex difference. The extremes from the first acquisition separated them in one round.
- A crotch ring is tilted, so its horizontal projection is not a section. Using its centre and area directly threw the thigh about 8 mm back and 5 mm wide. The population's difference between the ring and the last section is three constants of the prior.
- Crotch height is a line in stature, inseam, thigh and the masculine-feminine control, 3.06 mm left out one at a time. Inseam alone is 20 mm.
- Fit population means on people inside the declared domain, and fit lines on all people: means over the extremes dilute the normal figure, while lines need the extremes for leverage.
- A level fitted across acquired people carries their shared starting body. Fit the slopes on everyone and the level on the domain: the ankle's forward place moved 2 mm against f2 otherwise.
- The neck and face stretches change the stature after the leg scale is chosen, so the crotch's share must count them. Leaving them out put f2's crotch 9.5 mm low, which an independent review traced from the numbers.
- Tape radii must be solved against the hull of the section they wrap.
- Ankle forward place is a line in fat and muscularity. Terms in stature, sex or ankle radius fit the extremes better and made m1 and m2 worse, so they stay out until more people separate them.

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
