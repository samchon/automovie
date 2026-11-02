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
| Leg, generated | 2.18 | 5.02 | 4.62 | 5.42 |
| Leg, tables at the baseline | none | 6.6 | 8.9 | 8.5 |
| Best stature law | 3.35 | 4.63 | 5.40 | 4.76 |

The law beats height alone on f1 and m1, and on f2 and m2 it loses by 0.39 and 0.66 mm to the best of the two stature laws. Section by section, m2 loses only at the top of the thigh, where the trunk's crotch ring leaves the section about 6 mm too wide. f1's row is held out of the leg prior only: its crotch ring is still its own table, so read it as an upper bound on the leg law, not as a generalization result. All four rows inherit the trunk's table, so the distance is judged again once the trunk is generated.

Raising the crotch to its true height lifted everything above it, and f2's hand went from 7 to 25 mm, with its thin fingers now missing the rays. The arm owns that.

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

## Foot slice

Both feet now come from one construction and a reflection in `AutoMovieHumanFootConstruction`. The prior holds a mean foot as a sparse section field: harmonics per chain, carried between anchor stations by natural splines. The chains keep their section planes, and the map moves points off them through `lift`. The table's 540 KB became 30 KB.

| Part | f1 held out | f2 held out | m1 held out | m2 held out |
| --- | --- | --- | --- | --- |
| Foot, generated | 4.61 | 3.01 | 2.93 | 3.57 |
| Foot, tables at the baseline | none | 3.9 | 4.5 | 5.8 |
| Best stature law | 5.64 | 2.70 | 5.09 | 5.38 |

The law beats height alone on three people. On f2 it loses to f1 scaled by height, because f1 and f2 are nearly the same foot, and it beats the other people's mean at 4.51. f1's row keeps the section planes and toe poles f1 gave the prior; those are shared constants, and the mean foot itself leaves f1 out.

The two people reserved from every fit, generated from their public inputs, far outside the declared domain:

| Part | e3 | e6 | Best stature law, e3, e6 |
| --- | --- | --- | --- |
| Leg | 15.8 | 14.3 | 17.0, 12.3 |
| Foot | 5.5 | 15.1 | 10.5, 11.0 |

Foot length, breadth and ankle height reach gains of 0.99 to 1.00 at both ends. Seven folded cells remain on the second toe's root, where one chain takes two arcs of its parent's ring; the table had none. The skin there shows no mark under raking light, and they are recorded here rather than repaired.

- People share their foot closely under a separate toe and heel scale: 3.2 to 3.6 mm in three dimensions against the others' mean, where one length scale about the ankle gave 4.3 to 7.2 mm, because the ankle's place along the foot differs between people.
- `footLength` in the reference parameters was not the defined measure. It ran 1.33 to 1.40 times short of heel to toe, so the values are now measured from the meshes, in the fitter's own frame. `referenceHumanExtremityInputs.mts` still records the old partial extent. `footBreadth` was right within 1 percent. The ankle ring stands 1.46 times the ankle height input.
- The left and right tables had different chain trees. The right foot now mirrors the left, so `forefoot.right.3` is gone; no consumer named it.
- Rings bound to a shared mesh carry to any person without cutting. Bindings must be saved while the table still exists, because they need the table to be made.
- A square O(N^2) projection per section costs more than the whole foot field. A smooth field needs only the inverse of the knot filter, which is O(N).

## Trunk slice

The trunk and shoulders now come from one column in `AutoMovieHumanTrunkConstruction`: a closed-form section whose measures run from the crotch to the neck, with the arm's root as an ellipse joined across the shoulders. The prior is 9 KB, and the arms walk along two bones in `AutoMovieHumanArmConstruction`.

What the viewer taught, each from a figure that passed every curve rule at the time:

- A rule limit set just above the old figure's worst value licenses everything below it, and the worst values sit at the armpit and crotch. A band and a step across the chest passed at once. They needed a rule of their own: `ridge`, the median curvature round a ring. It reached 14.5 at the armpit joint on f1 and fell as the cause went.
- Start a settle above the shared ring, not at it. Pulling the column toward the neck from the armpit up cost 25 mm of chest depth at 1344 mm and put a ridge on the joint.
- Keep a layer's height when a ring settles. Pulling the height too bunched the last layers to 1.3 mm, and an end slope then had to turn inside that span.
- Do not carry a neighbour's tangent into a ring by a local bump. It printed a collar round the neck.
- An ellipse measured from an arc does not reach the torso. Keep its outer edge and run the inner edge into the torso, or the two stop crossing and the whole shoulder is lost.
- A shoulder's ring is convex. A deltopectoral valley running to the top of the shoulder read as a sleeve seam.
- Depth does not follow the tapes one to one. Measured over 67 people, width follows the tapes at about 0.8, and front depth from about 0.6 at the waist to 0.1 near the neck.
- Closing a girth through depth alone failed twice, in the first attempt on no ratio and in the second with ratios measured. Girth is insensitive to depth, so a small disagreement between a tape and a ring becomes a large change of depth, and the chest stood 18 mm proud. A shared scale of width and depth works, because a girth is linear in it.
- Carry the front and back as places, not depths from the widest point. That point wandered by 50 mm between layers, its depths cancelled it exactly, and smoothing one side printed the wander as stripes at the same heights on every person.
- A fitted station table can hide a slow step. `control()` read one JSON file per call, which took a fit past 32 minutes. Cached, and with the held-out fits behind `HELD_OUT=1`, one fit takes 11 s.

An end slope acts across the child's whole last interval: a slope m over a span h stands `4/27 m h` off the chord. At the crotch the trunk's 60-degree opening stood 7 mm off a thigh that arrives upright, so `AutoMovieHumanEventJoin` stops at a 4 mm lump.

Agreeing on a ring is not agreeing beside it. Normals matched to 0.1 degrees on the shared ring and parted by 20 to 30 degrees 4 mm either side of the arm's root, because a single end slope turned inside one short span. A fillet over one radius of the child's layers took that to 18 degrees at most on the open arc, under the same `4/27 m h` bound. `fold` reads the turn off the ring for that reason.

A crotch ring is not a section of the thigh. Pulling the last sections onto it kept the thigh tape exact at its own station and filled the fold under the buttock: at 40 mm under the ring the girth stood 1.17 of the tape, and the skin 18 mm further back than a measured body at 24 mm. The thigh now keeps its tape's correction on the prior's flare, and only a last interval of 8 percent of the leg reaches the ring. That removed a fitted ratio and put the thigh's top back on the thigh tape.

Three measurements misled on this work. A probe swept phases over one radian instead of a full turn and read a 57 mm step that does not exist. A comparison of the male figures against an older figure of another stature read as a shape error. A self-comparison of the skin against its surroundings stayed under 2 mm over a groove 12 degrees deep, since the groove is wider than the neighbourhood it reads: it finds spikes, not bands.

The people at the ends of the audit are whole people. A chest of 1300 mm over an underbust of 742 mm is no body, and a rule failing on it says nothing. The domain to state must bound the tape ratios as well as the tapes.

## Whole law

`AutoMovieHumanBodyLaw` no longer starts from a stored person. Every chain is generated in world millimetres, from the top down: the head's rise sets where the neck ends, the neck carries the shoulders, the column runs to the crotch's height, and the limbs start from the column. The difference basis, the measurement warp, the region merge, the five row repairs and the fitted section tables are gone. Human source fell from 4.2 MB to 1.2 MB; against master the score reads 4.98 MB of calibration deleted and 0.17 MB of source added.

Held-out distance, mm RMS, against the better of the two stature-only laws. f1's own stature law is f1 scaled onto itself, so its row reads against the others' mean.

| Part | f1 | f2 | m1 | m2 | Better than stature |
| --- | --- | --- | --- | --- | --- |
| Leg | 4.36 / 3.98 | 6.28 / 4.63 | 8.01 / 5.19 | 8.31 / 5.15 | none |
| Foot | 4.62 / 3.67 | 3.00 / 2.70 | 2.93 / 6.53 | 3.57 / 6.74 | m1, m2 |
| Arm | 8.67 / 11.34 | 10.75 / 9.02 | 9.33 / 12.78 | 10.76 / 17.27 | f1, m1, m2 |
| Hand | 17.31 / 14.62 | 14.82 / 9.52 | 33.45 / 14.94 | 25.39 / 21.43 | none |
| Trunk | 8.58 / 15.14 | 10.83 / 9.40 | 9.98 / 9.10 | 10.96 / 12.94 | f1, m2 |
| Neck | 3.53 / 10.85 | 13.20 / 7.07 | 4.80 / 6.68 | 2.60 / 17.58 | f1, m1, m2 |
| Head | 7.30 / 3.61 | 6.19 / 4.05 | 9.22 / 5.28 | 8.26 / 8.55 | m2 |
| Ear | 26.54 / 3.01 | 7.77 / 5.47 | 38.30 / 7.49 | 26.21 / 13.39 | none |

The issue's bar of beating stature in every part is not met, and the owner has ruled that error is evidence and not a target, so these stand as a record. Read two facts before trusting a row. Hand error differs by person under one prior, so it is the hand's place along the arm more than its shape; it worsened when the arm's root moved with the front interscye. Ear distance is rays missing a thin rim, not a measure of the ear. The reference people `e3` and `e6` sit far outside the domain below and judge nothing but finiteness.

Response of the score's definitions to a control pushed alone to each end, gain 1 being exact: height 1.00, hip 1.04, chest 1.18, inseam and the foot's dimensions about 1, upper and lower arm about 1.25. Weak: neck 0.15, wrist 0.30, thigh 0.25, elbow 0.54, hand circumference 0.19, high hip 0.19, underbust 0.09, and the head's widths 0.15 to 0.46. High hip and underbust read at the body's own extremum stations, where a lone tape does not reach, and the trunk closes them at their own stations. Of 69 controls only the two palpebral heights move no skin: they move the lid's opening. Over 151 points no value went non-finite and no section collapsed, while 56 points showed more crossed sections or folds than the centre, nearly all on the ear lobe, the helix and the neck.

### Achieved measurements

Error of the score's definitions against each person's input, percent, for the generated figure and the fitted tables before it. The definitions are conventions on a surface, so a large shared offset is a definition's, not a figure's: both figures read neck base about 100 percent over and upper arm length about 55 percent under.

| Measure | Generated, f1 f2 m1 m2 | Tables, f1 f2 m1 m2 |
| --- | --- | --- |
| Height | 0 0 0 0 | 0.2 0.2 0.2 0.2 |
| Foot length | 0 0 -0.2 -0.2 | 37.9 31.8 41.6 42.7 |
| Foot breadth | -0.6 -0.6 -0.6 -0.6 | -0.7 -4.8 2.6 0.4 |
| Ankle height | 0 0 0 0 | 2.2 -2.8 -5.9 -3.0 |
| Chest | 4.0 3.5 -11.2 -15.2 | 0.3 1.0 -8.1 -11.5 |
| Underbust | 6.0 9.8 -5.3 -9.4 | 2.3 3.0 -2.7 -6.3 |
| Waist | -2.7 -1.6 1.0 0.3 | 1.0 1.2 3.6 3.2 |
| High hip | 9.5 7.9 1.5 1.9 | 10.2 10.2 11.6 10.1 |
| Hip | 4.7 4.3 1.2 1.2 | 4.4 4.6 7.3 7.1 |
| Thigh | 21.7 21.8 11.6 19.4 | 9.2 9.6 10.9 13.6 |
| Knee | -0.1 -0.3 0 -0.5 | -0.9 -0.7 1.5 1.2 |
| Calf | 2.1 2.1 2.4 2.1 | 1.6 2.0 4.1 4.0 |
| Biceps | 7.1 4.1 5.0 5.3 | 12.9 13.2 15.7 15.2 |
| Elbow | 17.0 16.6 18.7 19.7 | 23.6 23.7 26.6 26.1 |
| Forearm | 20.7 21.0 21.1 21.5 | 32.9 33.5 37.3 36.8 |
| Wrist | 47.8 45.9 35.2 40.9 | 53.5 53.9 55.2 54.8 |
| Hand circumference | 28.2 28.3 16.9 17.8 | 23.3 23.6 26.5 26.0 |
| Inseam | 8.4 8.8 10.3 10.3 | 8.1 7.0 8.3 8.1 |
| Lower arm length | -2.9 -15.3 3.7 -0.1 | 8.7 7.0 11.6 11.0 |
| Head length | 8.8 6.8 9.0 7.8 | 8.1 8.4 11.2 10.5 |
| Face height | 44.4 40.4 63.3 58.4 | 53.1 50.2 58.4 57.4 |
| Face width | 17.5 11.6 15.0 17.2 | 16.7 17.2 19.4 17.6 |
| Mandibular width | -6.8 -10.3 19.9 30.9 | 2.4 1.3 10.1 23.3 |

The generated figure reads closer on most rows. It reads further on the thigh, the chest and underbust and the male jaw. The table's thigh row predates the thigh's top leaving the crotch ring and has not been read again. These stand as evidence, not as targets.

### Supported domain

| Input | Range, mm unless noted |
| --- | --- |
| Height | 1450 to 2000 |
| Hip | 800 to 1250 |
| Waist | 560 to 1100 |
| Chest | 720 to 1200, at or above the underbust |
| Masculine-feminine, fat, muscularity | -1 to 1 |

Tapes move together, as a body's do. Each curve test person is a whole person at an end of this range, and the rule set passes on all of them. A single tape pushed to its end alone, or a body past these bounds, stays finite and connected: over 151 points of the score's domain none produced a non-finite value or a collapsed section. Past them the armpit's fold deepens beyond its design limit and folds appear on the neck and the ear lobe, so those figures are out of the guarantee, not broken.

A tape is what it says on the trunk, through a shared scale of width and depth. The ratio of hull to tape is 0.98 to 1.03 across the domain, so tapes are hull girths. Girth responses that remain weak, by score gain, are the thigh, elbow, wrist, neck, hand circumference and the head's widths; the trunk's were read before the closure and need rereading.

## The nose's base

The zigzag up the wing was a crease, not a cut. The nose's soft maximum joined the tip and the wing in a valley of 0.75 mm radius under controls 1.6 mm apart, and the cells aliased it: softening the union on the same mesh removed the teeth, and doubling every count only halved their pitch. Doubling `head.lower` could not help, because the crease lay in `head.middle`. The base edge belongs under the nose alone; carried past the wing it cut the lobes into a ledge across the cheek. The base is now built from its anatomy: a surface rising from the lip at the columella's angle, the tip lobule reaching down to it, rounded alar lobules with their crease, and two teardrop nostrils split by the columella. Where that surface trims the thin tail at the alar base, a rounding proportional to size falls under the controls and aliases the same way, so every rounding needs a floor set by the sampling.

Pocket shading darkened skin behind a nostril along its axis, and the wing lies there once the nostril faces down. It now darkens only skin that faces into the pocket: retained skin darkened fell from 544 to 598 vertices to none on four people.

The ears' lower ends, where the middle head starts, lie 1.5 to 9.5 mm over the subnasale on the references, so the nose's base crosses the join of the lower and middle head. Only the middle's layers crowded about the base, and on the lower's even 1.3 mm a sill 2.8 mm over m2's lip turned 54 degrees in one layer. The lower head's layers crowd about the base as the middle's do, with the layers the crowding takes added back so the jaw's pitch is kept.

The nostrils' white, jagged fringe was the closure, not the skin. A meridian left the rim along the skin with a handle of a third of its chord, about 3 mm, longer than the nostril is half wide, so the wall ran on across the opening before it turned into the pocket within a millimetre; uniform steps of the cubic's parameter put that turn in one or two steps of 40 to 60 degrees; and the position cut left rim vertices 0.003 mm apart whose twin meridians shaded as streaks. The handle is now at most half the rim's distance from the opening's axis, a meridian is stepped evenly in its length plus its turning, and a vertex within 0.1 mm of a pocket's outline lies on it: the `pit` rule's edges over 30 degrees in the half of the pocket that shows fell from 367 to 553 per person to 14 to 125. The rest lie mid-depth, where meridians from the teardrop's narrow ends converge; sharing one meridian between rim vertices under 0.12 mm apart changed none of them, and neither did it change the lids' share of streaked columns, 10 to 12 percent. Snapping at 0.2 mm made more edges, and snapping an eye's or the mouth's cut broke them: a snapped vertex beside a lid band kept the mesh normal of both, and the mouth's cavity finds its rim within 0.02 mm of the outline. A trim loop on the base chain would remove the cut altogether, but every person's eyes straddle the middle and upper head's join and m1's nostrils straddle the lower and middle's, so no single chain holds the outline.

The neck's slit on the masculine end came from the ring's own vertices: a ray cast exactly along the midline passes through them, rounding can drop the crossing from both neighbouring edges, and the point falls to the polar origin. Rays keep a millionth of a radian off it. A width floor does not remove a body from a smooth union where its lateral term is zero, so the face shield enters with a weight that vanishes on the plain neck.

Without a mandible the head's sides at the jaw came from the back body handing over from neck to skull, so the turn under the jaw had a radius of 12 to 22 mm on everyone. A crisp border at the mandibular plane sliced the skin into a flange, because the tilted sections run within about 10 degrees of that plane. The jaw is now a volume joined to the head's two bodies along each ray by a smooth minimum: an arch in plan from the chin to gonions 20 mm ahead of the ears' line, the mandibular plane at 25 + 2.5 sex degrees, the gonial angle at 122.5 + 2.5 sex, and skin falling inward 22 degrees under the border. The turn under is elliptic, 6.2 mm over the bone's edge and 26 mm into the underside, since the layers cross the underside at about 18 degrees: a 6 mm circle turned 34 degrees a layer there, 326 and 344 edges over 15 degrees on f1 and m2 by the `facet` rule. 33 mm ran past the 24 to 30 mm of underside a thick neck leaves before the throat and rounded m1's and m2's borders into it; 20 mm brought the facets back on f2 and narrow.

Where the skin under the jaw meets the neck, the blend widens from 6 to 18 mm, deeper than a soft-tissue round inside the arch only. At 6 mm that hollow fell between two layers on f2, whose face recedes most under the jaw, and shaded as 203 facets; ungated, the wide blend swelled the chin's sides, where the jaw and the face meet nearly flush, and rounded the border away. The roundings grow with fat as `exp(0.5 fat)`. Two hand-offs of the lower face's sides to the jaw failed. A weight on the face shield's share of the union below the border folded the sections under the chin, because a weight shrinks the whole shield toward its centre. Narrowing only the shield's lateral term over the jaw cleared m2's chin side but put facets of up to 25 degrees on f2's and did not clear wide's, whose thick neck fills the hollow under the border. The jaw rule reads shares of the jaw's own half-width; read at shares of the head's, it read narrow's cheek outside its jaw.

The `jaw` and `chinSide` hollows were fitted before the head had a mandible, to carve a jaw line into a bag; over the mandible `chinSide`, at half the face's half-width 10 mm over the menton, cut the crease where the jaw met the chin on the men. Both are gone. On f2, whose jaw is as wide as her face is narrow, the angle stands 6 to 8 mm out of the neck as a knob under a hollow. Raising the ramus to the condyle at the ear's centre changed nothing in the view, since the condyle stands only 16 mm over the jaw's own top there; steepening the skin under the angle to 70 degrees cut a sawtooth ridge behind it and facets of up to 46 degrees along the angle. Neither is the cause.

A wall facing a nostril's axis at depth h of a tube w half wide sees out about as much as 1 - h / hypot(h, 2w), half of open skin's at the rim. Shaded only from a quarter of the pocket's depth, the walls inside the rim kept the skin's sheen and read pale from the front; the shadow now sets in at the rim by that law. The `pit` rule's remaining edges, mid-depth at the teardrop's narrow ends, change neither when twin meridians share one nor when every meridian is stepped at one common parameter.

## The lower face

From the front the jaw made the lower face a box: its arch was a superellipse of power 3 about the gonions, whose front is flat, so the chin stood 70 mm wide 7 mm behind its front, and its sides were vertical walls that met the cheek above the angle in a corner. The arch is now the hull of the chin's turn and an ellipse about the gonions, with straight sides tangent to both: the mandible's base runs nearly straight from each angle to the chin. The chin turns with the curvature of the parabola through the chin's front and both gonions, `W² / 2a` for half-width W and reach a, 20 to 33 mm on the references, since parabolic and catenary curves describe the mandibular arch. Over the border the arch widens across in proportion to the height, so the jaw's side leans in from the cheek at the zygomatic arch, read off the head's own section at the ears' centres, down to the input's gonion, as the masseter runs: 9 to 22 degrees on the references. Its front, whose skin faces forward, stays where the chin is. No constant was added; the arch's exponent left the prior. From the front f2's face now tapers from the cheekbones to a chin narrower than the mouth; the knob behind her angle and the hollow over it went with the vertical wall and the `buccal` hollow, which had been fitted to carve a jaw line before the mandible existed and fell on her ramus. `submental`, a quarter millimetre, went with it; `mental` is the chin's profile and stays.

The skin under the jaw falls inward by the arch's distance, so the arch's interior shapes the underside. The exact distance to a hull creases where two pieces are equally near: along the midline and at the chin's centre. That printed a turn of 32 to 74 degrees in the rings under the chin by the `alias` rule, and rounding the creases piece by piece left steps that turned them by up to 135. The distance is now read along rays from a point on the midline behind the gonions, the outline's own smoothness carried inward; from a point halfway to the chin the rays' common point stood under the jaw and turned a ring by 145 degrees.

The neck ring handed over to the head under a weight `(1 - t / 0.95)²`, whose slope at the ring met the neck's throat rising forward at 0.44 mm per mm, while the law under it receded at 0.64: a ridge round the front of the neck at the neck chain's top, which read from the side as a notch. The ring's difference from the law is now a cubic Hermite span from the ring's own place and slope to nothing. A straight extrapolation of the slope under a flat weight overshot the sides, where the neck narrows at 2 mm per mm, into a dent with facets of 24 to 72 degrees behind the angle.

The `jaw` rule reads the sagittal profile at 0.5, 0.65 and 0.8 of the jaw's half-width. On an arch whose sides run obliquely and lean in from the cheek, that plane crosses the border on the slant and the side reads as a slope rolling into the underside: 13.7 to 19.6 mm against a limit of about 10 on all nine people, where the flat-fronted box passed everywhere but m2 and wide. A profile across the border, from the border's direction in two neighbouring sagittal profiles, read garbage where the turn under is found on a nearly level underside; the rule stands red and unchanged.

A nostril's pocket closed on meridians whose last controls lay at half each rim vertex's offset from the axis, so every depth was the rim's teardrop shrunk whole. A homothety keeps angles, so the narrow ends turned as sharply between two meridians mid-depth as the rim does at the skin. The last controls now lie on a circle at half the rim's mean offset, at each vertex's share of the rim's length: the `pit` rule's edges fell from 13 to 109 per person to 0 to 97, gone on short and nearly gone on m2 and wide. Pointing the first handles toward the circle as well raised them to 101 to 206, because the meridians then leave the rim across the skin's own inward direction.

The lid band's columns start at the cut's vertices, 0.003 to 1 mm apart. Columns at even phases of the margin, joined to the cut by one strip zipped in phase order, raised the upper lid's edges over 35 degrees from 327 to 402 on f1 and from 299 to 349 on m2, so the vertices' spacing is not what turns the upper band, and the band keeps its columns.

## The ear's correspondence

The ear's sawtooth was never a shape error. Its sections were resampled by arclength, so as a section's length changed every phase slid, and the rim moved 1.3 rad round its ring while `head.middle` held it still. Keeping the uniform indices `path` already samples fixed the folds with no new numbers: 35 to 83 reversed cells became none on all nine people. The join also moved any child point within 3 mm of the parent's ring, including a closing chord on no parent arc, and printed waves along the lobe; it now fades with distance as the slopes do. "Five masculine points fold the head and ears" was one body counted five times, since fat and muscularity do not reach the head, and the folds were on every person.

## The hip and the groin

Under the buttock's crest the rear falls as the square of the height, over 52 people: the fall over 100 mm stands 2.78 times the fall over 60 mm, which is (100/60)². That and the crest's place as a share of the hip tape shape the rear; the heights of the crest and the lumbar take no line in the inputs and stay population means. Three lines on the torso were construction: a waist moved by two straight runs met at a corner, three-point station slopes left a corner in curvature at every row, and one breast's bump, mirrored, folded into a stripe down the sternum.

A section sampled by its own angle crowds its points at the crotch's tip, and sampled by the super-ellipse's rational parameter it slides them round the ring on the widest people. Holding the front midline, the widest point and the rear midline at fixed phases, with points spaced by arclength along the outline drawn without its grooves, fixed both.

At the crotch the front is flat across and drops at a fold that moves out about as fast as it rises. A rounded core made a trough whose wall faced the midline and shaded as a dark lobe; a crisp fold narrower than the ring's control pitch printed teeth. The fold's softness now comes from the sampling, 1.25 times the larger of the ring's pitch and the row spacing where it runs, with rows about 4 mm apart through the groin.

The line across the thighs at the crotch ring is not one wrong table. Without the join's slope the thigh arrives rising 4 to 8 degrees forward and the trunk leaves receding 12 to 14, where a measured body stays within 0 to −3 on both sides, and correcting either trunk term moves the mismatch from one plane to another. The two chains need to share a direction where they meet, which belongs to rebuilding the leg on its own bone.

## Webs

A web floor cannot be a straight chord across the parent's section: at every finger web on f1 the chord leaves its pinch 83 to 88 degrees out of the parent's tangent plane, so skin holding it meets the parent at a right angle. Giving the span shared vertices removed the fans but not the corner, and starting each child a few millimetres in does not help, since a digit's sections keep the root's corners through its 12 to 16 mm handover. Four builds of columns hanging from each child's arc failed. A web is a saddle: above its crest the two children are one sheet, the parent continued, and below it two walls leave sideways.

The ball of the foot is one padded surface the chains cannot own: each pinch lifted plantar skin into a groove 8 mm wide and 5 mm deep. The plantar skin near each web now follows one pad. That an older figure had the same grooves only showed the defect was old. A toe's dome laid on a tapering ring left it at the angle of the taper and read as a disc with a rim; each toe closes by its own tangent cap, and fingertip domes take as many rings as their turn needs.

## The hand

The hand's faults came from its representation: horizontal sections crossing the digits at up to 40 degrees, and pinches held in truncated Fourier series that stayed 3.6 to 6.9 mm open. It is rebuilt in its own axes: one star surface for the palm, digits as tubes cut across their own axis, and a thenar section from which the thumb leaves, joined by a soft maximum along each point's own ray. Morphing a heel into a fixed ring flattens its slope, so the target travels. The elbow's kink came from a turn of fixed length, which pinches harder on a thicker arm; it now scales with the elbow's radius.

The arm and digits now loft in their own bone frames: sections square to each bone, frames carried by least rotation, each child starting from a round section that clears its arc and its web's crest along its real outward direction. A web is meshed as a saddle, even in `w = sqrt(z)` about its crest, with level rows and a translational chart near the pinches; a crest centred in the slot made crumple worse. What a tape measures must be what holds at its site. The wrist read as a mitten because the tube handed over to the heel's skin across the crease (a = −75 to −30 against a crease at −37), so the crease girth was the heel's (1.27 times the tape on f1); handing over only from the crease to the branch puts the least girth at the crease (1.05 times the tape). The tube's long axis at the wrist came from world x turned by a fitted angle and lay 36 degrees off the hand's breadth, so the wrist was round (thickness over breadth 0.95); laid on the hand's breadth it is 0.76. A shoulder ring is a level cut of an arm that leaves it at an angle, so taken as a square section it inflated the arm's root by about 12 percent and read as a deltoid cap on a woman; the root's square section comes from the ring's area times the cosine of the bone's tilt. A ratio that maps an input to a fitted measure hides a broken definition: `breadthRatio` 1.43 matched population means while the examples' breadths were 23 to 30 percent below their own circumferences by ANSUR II, so the scale across the hand is now solved for the breadth on the section through knuckles II and V, as the anatomy test reads it. Deriving the knuckle grooves from the heads' gap gives web margins of 1.5 to 3.4 form units, tighter than the hand-set valley's, and the palm's sampling does not yet resolve them (edges past 30 degrees about 3 times the hand-set valley's on the same inputs, crumples up to 78 against 20), so the hand-set valley stays until the palm and the webs are sampled for them; the palm side of the web junction stays ragged with either groove, so the web construction itself is the open cause.

## Rig

`AutoMovieHumanRig` gives the model a humanoid skeleton and every part a binding, and a pose moves the prepared skin without generating it again. A vertex's weights depend on its place alone, because a seam holds copies of one point in separately tessellated parts, and a binding read from the part would open that seam under any pose. Joints the shared vocabulary lacks fold into the bone that carries them: the toes are two grouped channels, so one toe cannot move alone.

- On one pose a linear blend thinned the bent thigh and the inside of the elbow, and a dual-quaternion blend kept their volume with a slight corner outside the deep bend. Dual quaternions are the default, so a display material swapped in must take the same skinning patch or the page shows a deformation the model does not have.
- The page's 256 MiB publication held 115 MB of construction tubes at seventeen digits. They now stop at a hundredth of a millimetre, which left room for every binding at 241.7 MB.
- Skin passes down the skeleton as a tree of cuts: each joint holds a plane and a compact ramp as wide as the skin is deep there. Comparing capsules along a limb carried the thigh's shell 62 mm past the knee, and the gap between two capsules grows with the square of the distance from the joint, so skin stood at an even share and then turned at once. Eyes carry no skin, the head is a ball from chin to crown, a raised arm brings its girdle at Inman's 2:1, and forearm twist is shared by elbow and wrist.
- Pose zero is anatomical neutral, not the generated posture. The generated A-pose stays the skin's bind, and one rotation per bone, derived from the generated skeleton, reaches neutral: arms down, elbows and fingers straight, forearm thumb-forward, legs plumb with the foot's own heading. The wrist sat 45 to 50 mm inside the palm at the arm's last ring; it is now at the crease.

## The mouth

A rig binds skin by place alone, so a mouth sealed in one sheet can only stretch when the jaw opens: the jaw's cut was a level plane at an estimated mouth height, ramped over 7 mm, and the lips hung on both bones. The skin is now cut along the lips' contact line like the nostrils, and the jaw's share is read by a point's side of that line: over the middle half of the mouth the upper side is the head's and the lower the jaw's whole; toward the cheilia up to half crosses the line, fading over half the lower face's height, so both sides hold half at a cheilion, the skin past it is continuous, and a parted mouth narrows to its corners. Two hand-overs centred on the line, narrow within the slit and widening past it to the jaw's 7 mm ramp or to the cheek's height, put the jaw's whole turn across a few millimetres round each commissure and stretched that skin more than three times under a 20 mm opening on all nine people; read by side, no edge stretches that far. The cut is a stadium one 0.5 mm station tall on each side of the contact line. An ellipse thinned toward the cheilia below the station height, the skin's edges stepped over it whole, and on f2 the rim fell into three loops. A slit carrying the head's rest gap, or the lining left open behind it, showed a dark line and the teeth at neutral; the lining's inner faces now meet across the slit, so the lips meet at rest.

Behind the slit the lining runs, by one centripetal Catmull-Rom meridian per rim vertex, through the pressed faces, a vestibule wall outside the front teeth, a section over the first molars and under the palate, to a pole at the pharynx over the gonia. The teeth keep the standard crown table and stand side by side on a beta arch whose width puts the first molars' cusps 53.5 mm apart; their place comes from the head: the incisors' labial faces a lip's thickness behind the upper lip, their edges the rest display below it, the occlusal plane at Downs' cant. The arch is not scaled with the head, since adult crowns vary little; that it fits is read, not assumed: on all nine people every tooth, gum and tongue point lies more than 1 mm under the skin, on f1 13 to 25 mm. The resulting intercanine cusp width is about 32 mm on f1, a little under the 33 to 35 mm norms.

Speech reads `IAutoMovieHumanExpression`'s mouth: FACS lip units per side, tongue tip and dorsum controls, and fifteen visemes, each mapped to units, tongue and a jaw opening by its place of articulation. The jaw stays the pose's; the expression only asks for an opening. Lips and cheeks move by handles at the cheilia and the lips' middle and mid-lateral points spread by a Catmull-Rom across the lip, upper and lower apart, so the field may part only where the skin is open. Only the lip corner puller has measured magnitudes (a posed smile's 3D displacements); the others are shares of the person's own width and vermilion heights and are conventions. The tongue's tip and dorsum travel to the ridge and palate turned back by the jaw's opening, so a contact holds at any opening. The generated model carries no shape per expression: at 259 MB against the 256 MiB page cap a single morph target over the 100 000 vertices near the lips does not fit, so the page writes the field into the bind buffers of its own instance.

A lining drawn to one point at the pharynx cut through a third of the resting tongue; it now closes behind an oropharyngeal section that is the tongue's base with a lining's thickness round it. The dorsum rose to the palate's apex wherever it stood and left through the roof behind the molars for /k/; it now rises to the roof over each point, read from the lining's sections.

Open, and why the mouth is out of the shared generation: under a 14 mm opening for /a/ the lining's sides round the tongue's base hold a blended share of the jaw while the tongue holds all of it, and on f1 18 of 770 tongue points pass through the stretched lining (3 for /k/). The aperture is therefore not in the head's openings, the skin stays sealed and the rig keeps its level cut, until the mouth test passes on all nine people. Also open: the lips' inner edges are flat where the lining leaves the rim along a chord, so a parted lip reads as a cut plate from the side; the corners show small dark gaps where the lining meets the cheilion; the instance admission refuses a mouth record and jaw units; and no measured magnitude has been read for the units other than the smile.

## Tapes

No construction solves a tape at its published site. `AutoMovieHumanBodyGirth` feeds only the score. The trunk closes each tape at a fixed station of its column, with a fitted ratio between 0.98 and 1.03, and then smooths the closure over a tenth of the column. The leg solves at fixed leg fractions, and the arm solves at fixed shares of its walk, with ratios from 0.93 to 1.05. Each tape is therefore exact only where the construction put it. On f1 the skin's least girth stands 28 mm above the waist station. The knee is solved at the shank's narrowest point, 66 mm below the joint, and reads 359 at mid-patella against 327. The thigh is solved 96 mm under the crotch, and the leg then flares to the trunk's crotch ring, 636 against 557: no tape reads that ring, and the trunk is wider at the crotch than at the hip. The forearm has no belly, because the elbow's radius key stands above the forearm's. On m1 the abdomen stands 18 to 25 mm ahead of the chest, so the bust point the test seeks falls at the bottom of its band. The arm skin itself answers the elbow tape (222 against 220 on f1, cut on the arm's own triangles), but the anatomy test's region of 90 mm about the shoulder-to-knuckle chord cuts the bent bind elbow open. It reads a 171 mm fragment, and on m1 it reports the joint 45 mm outside, so that site needs a wider region before it can judge any construction. The plan is to locate each site on the part's own sections by its published definition, solve the hull there with no ratio, and key the crotch ring to the thigh tape.

## Reference people

69 people now share the vertex order: f1, f2, m1, m2 and 65 geometry-only people. `b0` is a centre at height 1750 mm, `e1` to `e8` a half fraction of the corners of height, fat, muscularity and masculine-feminine, and the rest pin one control at an end of `b0`'s range. `e3` and `e6` are reserved from every fitted number.

A geometry-only person costs 107 s and 24.7 MB. 7 people came out with their vertices renumbered although the count matched, so a shared count proves nothing about a shared order, and they were realigned by position and topology. Their heads carry no head fitting, so head scores cannot use them. Fit against the achieved value of a control: an end can fall far short of the request, and `neckToWaist`'s minimum reached 11 percent of it.

What the people taught across slices: one preset's people pull a fitted level toward that preset, so take the slopes from everyone and the level from the people in the domain.

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
