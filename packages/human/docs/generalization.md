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

## Open: the nose's base

A zigzag runs in a V from the nostrils about 14 mm up the wing of the nose, in clay as well as in appearance. The cause is not found. Doubling `head.lower`'s ring order left it unchanged at 13 MB of page. Shallowing the nostril's pocket from 8.8 to 2.5 mm left it too and broke the nostril into black fragments, since `AutoMovieHumanAperturePocket` builds that pocket and the cavity material moves whole triangles. The sections do not double back near the nose: the only reversals of z lie at the face's widest point, 60 mm behind it. It is not shading either. Of 465 edges whose shading normals jump by over 15 degrees at the wing, 8 have one end on the mesh normal and 450 jump in the mesh normals too, and letting the event rings average neighbours up to 70 degrees apart left the picture unchanged. The teeth stand about 1.5 mm apart on the wing's lower edge, where the skin turns nearly into the plane of the sections, and they sit among the vertices the nostril's opening derives. The refined rows of `AutoMovieHumanBodyApertures.refine` remain untested. Two candidates having failed on each side, the next step is a choice of structure for the nose's base, not another patch.

## Open: the hip's lower back

Measured against a fuller figure, the column's rear rises at about 0.15 over the 40 mm above the crotch ring where that figure rises at 0.7, and it stands 10 to 15 mm short at the crest. Fairing is not the cause: a fairing a quarter as wide moved it by a millimetre. The turn between the leg's rise and the column therefore shades as a soft line across the hip's back under raking light, and a fold of 15 degrees spans 32 mm there. The column's rear below the hip tape needs its own read.

At the wrist a fillet made things worse: the hand's first chain is 22 mm long, so the turn has no layers to spread over, and the notch grew and a curved band appeared. The wrist keeps its single span until that chain is rebuilt.

At the rear midline the bottom ring ends in a V about 6 mm wide and 10 mm deep. Its point shades across the cleft as a tab of 3 to 4 mm. It is not a shape error, the legs cross the midline by 0.4 mm at most, and underwear covers it.

## Rig

`AutoMovieHumanRig` gives the model a humanoid skeleton and every part a binding, and a pose moves the prepared skin without generating it again. A vertex's weights depend on its place alone, because a seam holds copies of one point in separately tessellated parts, and a binding read from the part would open that seam under any pose. Joints the shared vocabulary lacks fold into the bone that carries them: the toes are two grouped channels, so one toe cannot move alone.

- On one pose a linear blend thinned the bent thigh and the inside of the elbow, and a dual-quaternion blend kept their volume with a slight corner outside the deep bend. Dual quaternions are the default, so a display material swapped in must take the same skinning patch or the page shows a deformation the model does not have.
- The page's 256 MiB publication held 115 MB of construction tubes at seventeen digits. They now stop at a hundredth of a millimetre, which left room for every binding at 241.7 MB.

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
