# Every joint in one shot

The investigation that precedes one implementation batch for every joint and connection of the f1 figure. [Joint logic](joint-logic.md) holds each joint's anatomy, published centres, kind and pose behaviour, and this note does not repeat them. It adds, for every connection in `AutoMovieHumanF1.constructionFrom`: today's construction as the code declares it, the measured state against the reference, the hypothesis as a function of centres and frames, every premise the operators admit on with today's value, and what the kernel lacks. It closes with the complete lists of kernel pieces and family changes.

**State of this note.** Nothing here is implemented. Every hypothesis below names the measurement it rests on; what is still not measured is said where it stands and collected under [Risks](#risks).

How each statement was obtained:

| Mark | Meaning |
| --- | --- |
| code | Read by the author in the named file |
| tool | A number printed by a tracked tool under `test/src/reference-conics`, with the output file |
| frame | A render opened by the author beside the reference, with the round and the pixel region |
| record | Taken from the campaign's supervision record of 2026-11-17 (another worker's measurement, not repeated by the author) |

Rounds named below: `08-45-34` is `packages/human/.shots/family-conic-figure/2026-11-17T08-45-34.287Z/case-f1` (f1 as it stands, 1 diagnostic: `cut.axilla`).

## Every joint side by side

One row per joint or connection, the same columns for all. Frames are `<region>.<view>.<pass>.png` of round `08-45-34`; each row's generated frame stands beside its `reference` pass of the same name.

| Joint | Kind | Whose skin each side is today | Where each family starts against the joint's centre | How the loop or end is obtained | Defect seen (frame) | Premise refused or strained | Cause | Capability that answers it |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Shoulder, armscye | Continuation over the cap, sheets with folds | Trunk: a net that reads the arm's skin 25 mm past the cut. Arm: fitted skin from the armscye plane. Between: a band 1.5 to 10 mm into the arm, an oval about 180 by 300 px on the shoulder's front | Arm: its course never passes the glenohumeral centre; it leaves through two thorax datums and its face starts on the armscye plane (station 32) | Recorded loop on the trunk's chart; recorded 24-phase rail; re-levelled for a person | Shoulder-front crease px 590-640 x 280-340 of `armpit.front.clay`; fold groove absent, blotched hollow px 380-540 x 540-700 | Band columns 103 to 105 run backward on both sides (preflight); a person's level solve refused by the sign of a 0.07 degree tilt | One skin fitted twice; the visible joint is strip; the loop is a table | Shared-loop join (exists, unused); the arm on the humerus's course from inside the thorax |
| Axilla | Fold between two walls | A cutter family digs a slit out of the band | The cutter's course is four recorded points | Recorded cutter, recorded seed | Fringes px 410-470 x 650-720 of `armpit.front.clay`; the cutter's own faces at the twin's apex only, px 435-475 x 705-760 of `armpit.twin.front.owners` | f1's one diagnostic: `unfolded blend` at t 5.0396 | The fold is cut out of a strip instead of being two walls meeting | The same join's fold arc; no cutter |
| Finger row and webs | Branch node, four children | Hand: fitted to 595 mm, past the knuckles. Fingers: fitted from the web. Between: a band from the hand's end ring to 3 mm into each finger, a slab px 300-575 x 370-490 of `hand.roots.front.owners`; fork discs faired in mesh space | Fingers' faces start 16 to 24 mm distal of the metacarpal heads' centres (little 16, index 18, middle 21, ring 24) | Seam phases from `fanSeams`; web depths read every 2 mm off the reference; chords recorded | Flat shelf and collar px 315-360 x 400-490 of `hand.roots.front.clay`; root notches px 510-530 x 570-590 of `hand.left.clay`; no knuckle | None refused; the rule's forks stand 3.5 to 14 mm behind the end ring (record) | The knuckle is strip; the children start outside the joint; the seams are tables | Composed end of ray territories (exists, unused); the fingers refitted from their heads' centres and the hand ended at the heads |
| Thumb base and first web | Branch node, two children | Hand: fitted. Thumb: a capsule closed 10 mm behind its first joint. Between: a 0.5 mm blend and 14 mm of mesh fairing | The thumb's face starts 43 mm along its course, at its second joint; its metacarpal lies inside the hand's family | Traced intersection | Wrinkled faceted patch px 440-600 x 380-520 of `hand.web.front.clay`, a fin px 583-592 x 462-476; saw-toothed owner border | None refused; chord held at 0.5 mm because 1 mm folds | A capsule's merge needs a crossing all round, and the thenar runs on into the palm | A split at the carpus into the thumb's ray and the palm (composed end); a split whose host is a split's child (missing) |
| Wrist | Continuation between two layouts | Arm to 445 mm, hand from 448; a band 13 mm long | The hand's face starts 58 mm proximal of the wrist's centre, inside the forearm | The arm's end ring and one station of the hand | None seen in `hand.left.clay` (band px 200-360 x 140-300 of `.owners`) | None | - | The band goes with the carpus split: the arm's family runs through the wrist |
| Toe row and webs | Branch node, five children | As the finger row; bands 16 to 26 mm | Toes' faces start 20 to 25 mm distal of the metatarsal heads' centres | As the finger row, every millimetre | Small marks between toes px 130-160 x 395-420 of `toes.high-oblique.clay`; on the twin, hatched facets on the big toe's root px 170-270 x 400-470 of `toes.twin.front.clay`; the little toe's root px 600-640 x 600-625 of `foot.left.clay`; a pointed small toe (record) | None refused; bands turn 20 to 40 degrees (record) | As the finger row | As the finger row |
| Crotch, groin, gluteal fold | Branch node, two children; a fold behind | Trunk: fitted to its end at 808 mm, with nets at the crotch. Legs: fitted from station 104. Between: bands 6 mm into each leg | The leg's face starts 104 mm distal of the hip's centre, at the trunk's end | Seam `[0, pi]`; six depths read off the reference's midline | None seen in `hip.back.clay`, `hip.front.clay` | None refused; as a composed end today the thighs do not cross (tool) | The trunk's end ring stands in the web (39 rays of 360 fold); the seam is a table | Composed end of the two thighs' territories from the hip centres; the trunk ended 40 to 60 mm higher |
| Breast | Mound with a fold | Trunk: fitted with the breast left out. Breast: fitted from 11 mm along its course. Between: a band 1 mm into the breast; a mesh fill at the fan point | The breast's face starts 11 mm from its root datum, at the wall | Recorded loop | No fold line: a soft smear and a spot px 680-740 x 570-610 of `fold.left.clay`, where the reference has a crease arc with a roll under it | None refused | The fold is strip; the upper pole is tangent (record), which a traced join cannot follow | Shared-loop join; the mound's family from inside the wall |
| Nose and alae | Mound with a fold; shells | Face: fitted with the nose left out. Nose: one family from 5.5 mm. Between: a band on a recorded 32-phase rail with four recorded depth profiles | The nose's face starts 5.5 mm from its root datum; the alae have no family | Recorded loop, rail and profiles | Straight flank, no alar wing, no alar groove (reference px 760-800 x 400-560 of `nose.low-oblique`) | None refused; the nose's own sections at 10.5 to 13.5 mm are not star-shaped (record) | One family cannot hold the wing that curls under; the groove is a band's depth profile | Alae as families; shared-loop join |
| Nostrils | Cut | A cutter drawn in by its rim | The cutter starts at its mouth | Traced intersection | A ledge px 410-580 x 455-580 of `nose.low-oblique.clay` | 128 columns refused by the triangulation; 48 held | The rim's roll is a blend of fixed chord on 48 columns | The cut stays a traced `diff`; its rim a fold width of the rim's radius |
| Ear root | Mound with a fold | Head: fitted with the ear left out. Plate: closed at both ends. Between: a 0.5 mm blend and 4 mm of mesh fairing | The plate starts 5.5 mm from its root, 6 mm inside the head | Traced intersection | Large: lobule saw-toothed px 520-640 x 740-820 of `ear.left.clay` | None refused | A 0.5 mm blend with mesh fairing stands for the sulcus, which turns 80 to 110 degrees | The same join with a fold width in place of the fairing |
| Ear ridges and bowl | Template features | Tubes merged on the plate; a cutter | Each tube starts 2 to 3 mm from its buried end | Traced intersections | Helix a free tube with a hook in the air px 520-560 x 260-390; antihelix in shards px 350-440 x 350-520; concha a dark box | None refused | Round tubes on a plate are not the auricle's folded sheet; its lateral face is one height over its plane (tool) | The plate as one sheet family with height nets for the rim, the scapha, the antihelix, the bowl, the tragus and the antitragus |
| Elbow | Hinge continuation | One family | The arm's course turns at the elbow's centre | - | None seen in `elbow.back.clay` | None; turn margin above 1.11 (record) | - | None at f1's pose |
| Knee, ankle, ball | Hinge continuation | One family | The leg's course turns at each centre | - | None seen in `knee.front.clay`, `foot.left.clay` | None at f1; a changed foot length or breadth is refused | A distal twist reaches the root through a roll that is one natural cubic along the whole course (read in code) | A chart roll with local support (missing, Human) |
| Interphalangeal | Hinge continuation | One family a digit | Each digit's course turns at its joints | - | None seen at the hand's and the toes' scale | None | - | None at f1's pose |
| Neck base, jaw and neck | Continuation with sheets; a fold under the jaw | One trunk family, level sections, nets | The trunk's course is a vertical line that passes neither the thorax's nor the head's origin as a joint | - | Sternocleidomastoid faint and level banding px 200-280 x 300-420 of `neck.left.clay`; silhouette close | A trunk length other than f1's is refused by name | Level sections cannot stretch an oblique neck; one level station folds at the jaw's floor | A neck family on its own course with two shared rings |

### Read down the columns

Four causes repeat, and each has one construction that answers it everywhere it occurs. Stated from the rows above.

| Repeated cause | Rows | One answer |
| --- | --- | --- |
| A part's family starts at or outside the joint, so nothing of the part exists where the joint is | Arm (starts on the armscye plane, off the humerus), fingers (16 to 24 mm past the centres), toes (20 to 25), thumb (43, at its second joint), leg (104), breast, nose, ear plate (at the wall). The one family that starts inside its neighbour, the hand (58 mm inside the forearm), shows no defect at its joint | Every part's family starts at its joint's centre or proximal of it, inside its neighbour, on the bone's course ([Centres and courses](centres-and-courses.md)) |
| The visible joint is interpolating strip between two rings that are not the same curve | Armscye band, finger and toe bands, breast band, nose band; every frame failure but the ear's lies on a strip or a blend | Both parts carry fitted skin up to one shared curve, and the operator only joins them along it: the shared-loop join for a part on a host's side, the composed end for parts on a host's end |
| The curve the parts meet on is recorded or read off the reference, so it holds for one person in one pose | Armscye loop and rail, breast loop, nose loop, rail and profiles, web depths and chords, crotch depths, cutters and their seeds | The curve is derived: a skin cut by a surface fixed in a frame, or the parts' own crossing |
| One side's skin is fitted to the other's, or a fold is dug by a cutter or shaped by a band's profile | Trunk's side net over the arm; axilla cutter; nose band's alar profile; breast fill | A fold is two walls meeting with a stated radius; each wall is fitted to its own skin and carried on beneath the other |

The joints one family runs across read close to the reference at f1's pose in every frame opened. What they owe is not a rest-pose defect but what a rig and a changed person need (bone-end features fixed in each bone's frame, the hinge's own axis), which the hinge rows below state.

## The tree today

Read in `AutoMovieHumanF1.ts`, `constructionFrom` (lines 2264 to 3129). The figure is one tree; every operator node is listed, in the order it is built.

| # | Node | Operator | Host | Part | Per side |
| --- | --- | --- | --- | --- | --- |
| 1 | `web.<thumb>` | `join` `merge`, traced | hand | thumb as a capsule closed 10 mm behind its first joint | yes |
| 2 | `fan.hand` | `split`, three `outer` seams | hand's open end (`top`) | index, middle, ring, little finger, each with a band | yes |
| 3 | `wrist.<arm>` | `continue` with a band | arm's open end at `ARM_TO_MM` | the hand subtree | yes |
| 4 | `fan.leg` | `split`, four `outer` seams | leg's open end | five toes, each with a band | yes |
| 5 | `crotch` | `split`, one seam | trunk's bottom end | both leg subtrees | no |
| 6 | `armscye.<arm>` | `port` | trunk | the arm subtree | yes |
| 7 | `cut.<axilla>` | `join` `diff`, traced | the arm's band | the slit cutter family | yes |
| 8 | `root.<ear>` | `join` `merge`, traced | trunk (head) | the auricle's plate | yes |
| 9 | `ridge.helix`, `ridge.antihelix` | `join` `merge`, traced | plate | a tube each | yes |
| 10 | `cut.<concha>` | `join` `diff`, traced | trunk (head) | the bowl cutter | yes |
| 11 | `mammary.<breast>` | `port` | trunk | the breast family | yes |
| 12 | `nostril.nose` | `port` with depth profiles | trunk (face) | the nose family | no |
| 13 | `cut.<nostril>` | `join` `diff`, traced | nose | the nostril cutter, drawn in and spread | yes |
| 14 | `fills` | mesh-space disc | the drawn skin at `breastFan` | none | yes |

Connections that are no operator, because one family runs across them:

| Connection | Family | How it is carried |
| --- | --- | --- |
| Elbow | arm | A turn of the `jointed` course, a hollow relief |
| Knee, ankle, ball of the foot | leg | Turns of the `jointed` course, hollow reliefs |
| Knuckle turn | hand | A turn of the course at the middle finger's first joint, toward the four fingers' mean direction |
| Interphalangeal joints | each digit | Turns of the digit's course |
| Neck base, jaw and neck, face | trunk | Level sections of one `bilateral` family on a straight course from the floor to the crown; twenty height nets (`trunk.collar`, `trunk.chin`, `trunk.face`, `trunk.mouth`, `trunk.eyes`, `trunk.head`, ...) |
| Groin, gluteal fold | trunk and leg | The trunk's `trunk.crotch` and `trunk.fold` nets, the crotch's bands |
| Lips, lids | trunk | Height nets |

So the figure has fourteen operator connections per the first table (twenty-five node instances with both sides) and seven kinds of connection inside families.

### Today's numbers, by node

Read in `AutoMovieHumanF1.ts` (constants at lines 660 to 1300).

| Node | Curve it starts from | Rail | Columns by rows | Widths, fairing, fills |
| --- | --- | --- | --- | --- |
| `web.<thumb>` | Traced; seed searched on the thumb's phase 0 over shares 0 to 0.7 | - | 48 by 4 | Chord 0.5 mm both sides; mesh fairing over 14 mm |
| `fan.hand` | Seam phases from `fanSeams`; three webs of 4, 9 and 9 knots read every 2 mm off the reference, scaled by recorded chords 18.3, 21.8, 23.5 mm | 3 mm into each finger | 192 by 24 | Corner 0.6 rad, ribbon reach 0.5, square; fork discs faired over 0.5 (palm) and 0.7 (back) of each chord |
| `wrist.<arm>` | The arm's end ring at `ARM_TO_MM` | 10 mm into the hand | 256 by 12 | Matched by length |
| `fan.leg` | Four webs of 9, 17, 25 and 22 knots read every millimetre; chords 19.7, 23.4, 26.5, 28.8 mm | 3 mm into each toe | 192 by 24 | Corner 0.75, reach 0.25, square; fairing 0.5 and 0.7 |
| `crotch` | Seam `[0, pi]`; six depths read off the reference's midline | 6 mm into each leg | 288 by 8 | Corner 0.6; fairing 0.35 |
| `armscye.<arm>` | Recorded loop on the trunk's chart, re-levelled per clock for a person | A 24-phase curve, 1.5 to 10 mm | 192 by 24 | Ribbons per column |
| `cut.<axilla>` | Traced; seed at a recorded station and phase (60.5 mm, 4.6173 rad) | - | 192 by 4 | Curvature width, share 0.5, cap 0.25 mm |
| `root.<ear>` | Traced; seed on eight station lines | - | 256 by 4 | Chord 0.5 mm; fairing 4 mm |
| `ridge.helix`, `ridge.antihelix` | Traced | - | 192 by 4 | Chord 0.25 mm; fairing 1 mm |
| `cut.<concha>` | Traced | - | 192 by 4 | Curvature width, share 0.5, cap 0.25 mm |
| `mammary.<breast>` | Recorded loop | 1 mm | 192 by 8 | A mesh fill of 4 mm radius at `breastFan` |
| `nostril.nose` | Recorded loop | A 32-phase curve read off the reference | 192 by 8 | Four depth profiles read off the reference; matched by length |
| `cut.<nostril>` | Traced; the cutter drawn in 1.5 mm and spread 2 mm past its mouth | - | 48 by 4 | Chord 1.5 mm |
## What the kernel offers today

Read in `packages/interface/src/construction` (each interface's admission paragraph) and the engine files named. This corrects [Joint logic](joint-logic.md), whose list of missing capabilities was written before three of them were built on 2026-11-17.

| Capability | Where | Used by the figure |
| --- | --- | --- |
| A split's end composed of its children's own sections in one declared plane: forks, seam planes, seam valleys and rails all derived (`IAutoMovieConstructionSplit.compose`) | `AutoMovieConstructionComposedEnd`, `SplitCompose`, `SplitEdge` | No. Seams are authored phases and knots read on the reference; rails are one station |
| A child's rail as its skin cut by planes fixed in a named frame, with a rounded wedge (`IChild.cut`, `ICut`) | `AutoMovieConstructionSkinCut` | No |
| A join on a declared shared loop, tangent on some arcs and crossing on others, with the fold width `hypot(reach, R tan(beta / 2))`, a radius table round the loop, exact ball contact on curved walls, `cleft` refusal (`IAutoMovieConstructionJoin.loop`, `IAutoMovieConstructionFoldWidth`) | `AutoMovieConstructionSharedLoop`, `AutoMovieSolidSharedCurve`, `AutoMovieSolidFoldContact`, `AutoMovieConstructionWidths` | No |
| A width bounded by the normal and the geodesic curvature (`IAutoMovieConstructionCurvatureWidth`) | `AutoMovieConstructionWidths` | Yes: both cutters with a closed end |
| A port band whose start edge is the port curve itself between columns | `AutoMovieConstructionPortCurve`, `PortBand` | Yes |
| A known port record (a band pulled back from both neighbours' fields) | `AutoMovieConstructionKnownPort` | Declared in the interface; not a node of the tree |

## Premises, by operator

Taken from each interface's admission paragraph and the engine's refusals. A joint's own table below gives today's value against each.

| Operator | Premise | Refusal name or text |
| --- | --- | --- |
| `port` | Loop: finite centre, positive semi-axes, phase semi-axis under pi, `count` positive shares | admission |
| `port` | The loop and the rail each turn once about the rail's centroid (`angle`), or are matched by length | `the <what> turns ... rad round the child's rail centroid, not once` |
| `port` | The band reads host and part inside their domains on the kept sides | `the band reads the host past its domain ...`, `... the part past its domain ...` |
| `port` | One ribbon scale (or a smooth field of them) keeps every column monotone along its chord | `no ribbon scale keeps every column monotone along its chord` |
| `port` | The rail inside the part's domain | `the part face ...'s rail at stations ... leaves its domain` |
| `split` | Host end open (no pole, not cut); `a < b < a + 2 pi`; `count` a multiple of 4; rail positive | admission |
| `split` | A profile's knots inside the chord; corner under pi / 2 | admission, realization |
| `split` | The seam plane does not hold the direction toward the band's arc | `the seam plane holds the direction toward the band's arc` |
| `split` | Ribbon scale as the port's | as the port's |
| `split` with `compose` | Each child's skin crosses the end plane all round inside its domain | `the child face ...'s section is not admitted in the end plane` |
| `split` with `compose` | Neighbouring sections cross exactly twice; others do not overlap | `... cross N times in the end plane, not twice`, `... which are not neighbours, overlap` |
| `split` with `compose` | The bisector of two children's axes not along their forks' chord | `the bisector ... runs along the chord between their forks` |
| `split` with `compose` | Each seam plane crosses the host's end ring exactly twice, enclosing the seam before | realization |
| `split` with `compose` | The host's end ring no farther from the composed outline than the shortest `rail` | realization, with the greatest and mean distance |
| `ICut` rail | At every child phase the skin enters the kept region inside the domain, is not inside at the end, and is not tangent | realization, naming child and phase |
| `continue` | Equal-order ends share a ring; otherwise a band with a rail inside the part | `both chains must carry spline sections`, admission |
| `join`, traced | A closed loop near the seed; transversal all round (`grazing`); the two surfaces within `tolerance` at traced points | `transversal contact` |
| `join` | Each rail placed, not crossing itself | `rails` |
| `join` | The blend's normal never reverses between neighbouring columns or rows | `unfolded blend` |
| `join` with `loop` | Every loop point within `tolerance` of the part's face | `shared loop` |
| `join` with `loop` | The part's kept side the same all round | `one kept side` |
| `join` with `loop` | Each width positive; the fold radius under both surfaces' radii toward the fold; the ball inside the cap | `width`, `fold radius`, `cleft` |
| `diff` | The part is a view part (only the cutter's wall inside the host is kept) | admission |

## What was measured for all joints at once

Instruments, all tracked under `test/src/reference-conics`; outputs under `packages/human/.shots/joints-one-shot-20261117` unless said.

| Instrument | Reads | Output |
| --- | --- | --- |
| `FamilyConicJoints.ts --starts` | Every family's course centres, first and last knot and the course points there | `starts.txt` |
| `FamilyConicJoints.ts --wedge` | A fold on the reference in a plane: the sharpest turn of the cut inside a box, as the wedge of air and the skin's turn at 3, 6 and 12 mm | `wedge-*.txt` |
| `FamilyConicJoints.ts --end` | The reference in a branch node's end plane moved along its normal: chains, which children each holds, gaps, star-shape about each child's course | `end-*.txt` |
| `FamilyConicJoints.ts --compose` | A split of the figure's own tree alone, declared as a composed end and realized: the premise that refuses | `compose-*.txt` |
| `FamilyConicArmscyeJoin.ts --contact --part=<family>` | Where any stored part's station lines cross the trunk's skin, at what turn, and how far from the reference | `contact-*.txt`, `armscye-join-precheck-20261117/contact-*.txt` |
| `FamilyConicArmscyeJoin.ts --realize` | The armscye alone as a shared-loop join | `armscye-join-precheck-20261117/realize-*.txt` |
| `FamilyConicStar.ts` | Star-shape of the reference's sections about a trial course | `neck-star.txt` |
| `test_construction_operator_mixed_join_cases`, scenario 3b | A made turn of 2.8 rad joined by the shared-loop join | `test-armpit-turn.log` |

### Every fold's turn on the reference

The skin's turn across each fold, `180 - wedge`, at 3, 6 and 12 mm from the fold's floor. The reference's mesh edges are 3 to 8 mm, so a floor's own radius under about 3 mm is not resolved.

| Fold | Planes | Turn, degrees |
| --- | --- | --- |
| Armpit's apex | Frontal, 30 and 40 mm behind the crease; floor at z 149 to 150, y 1278 to 1282 | 158, 161 to 163, 160 to 163 (air wedge 17 to 22 degrees) |
| Armpit 20 and 10 mm behind the crease, and at it | Frontal | 138, 151, 156; 98, 124, 141; 75, 89, 112 |
| Posterior axillary fold | Level 1285 | 146, 138, 120 |
| Anterior axillary fold | Level 1295 and 1305, oblique to the fold | 70 to 75, 69 to 81, 75 to 98 |
| Alar groove | Level 1552, at x 110.9, z 18.6 | 65, 77, 71 |
| Behind the ear | Level 1560 to 1590, mixed with the rim | 48 to 101, 80 to 111, 52 to 111 |
| Finger webs | Level 920 to 935, oblique to the fingers | 29 to 71, 51 to 82, 75 to 97 |
| Jaw to neck | Sagittal 0, 15, 30 | 30 to 40, 44 to 59, 60 to 73 |
| Under the breast | Sagittal z 40 to 100 | 19 to 34, 21 to 34, 28 to 49 |
| Gluteal fold | Sagittal z 70, 90 | 14 to 25, 13 to 20, 7 to 17 |
| Neck base, groin, elbow, back of the knee | - | Under 30 |

One fold of f1 is near a cleft (the armpit's apex). The shared-loop join's operator test admits a made turn of 2.4 rad and, added for this note, of 2.8 rad (160 degrees: a cone leaning over its wall, radius 3 mm, cap 20 mm, reach 0.5 mm) with both rails on the wedge's closed-form points `hypot(0.5, 3 tan(1.4))` and no diagnostic; it refuses 3.0 rad as `cleft`. So the present blend turns every fold of f1 between plain walls.

### Every branch node's end plane on the reference

Planes are given against today's host end ring, positive out of the host.

| Plane | Hand, four fingers | Foot, five toes | Crotch, two thighs | Thumb and palm (plane square to the bisector of the first metacarpal and the palm, from the midpoint of the wrist's centre and the thumb's first joint) |
| --- | --- | --- | --- | --- |
| Well inside | 20 mm in: one envelope, 0 to 3 rays of 360 fold about any finger's course | 20 mm in: one envelope, 0 rays | 40 to 97 mm in: one envelope, 0 to 1 rays | 0 and 10 mm: one envelope, 0 rays about either course |
| Nearer | 10 mm in: 0 to 3 rays | 10 mm in: 0 rays | 20 mm in: 7 rays | 20 mm: 2 rays about the thumb; 30 mm: 6 |
| At today's end ring | Notched by the webs: 20 to 43 rays | 6 to 50 rays | 39 rays | 40 and 50 mm: 11 and 16 rays (the first web opens) |
| Outside | 10 mm out: four loops, gaps 4.8, 5.5, 7.7 mm; 15 mm: 6.4, 6.6, 8.7 | 10 mm: the little toe apart by 1.3 mm; 20 mm: gaps 1.4, 2.4, 3.6 | 20 mm: two loops 21.2 mm apart | - |

The same at every node: proximal of the webs the children share one envelope that is star-shaped about each child's own course; today's end rings (595 mm on the hand, 975 on the leg, the trunk's foot at 808) all stand in the webs, where the envelope is notched; distal of the forks the children stand apart at once by the web floor's width.

The figure's own splits, declared as composed ends on the instrument, refuse the same way at all three: with today's sources `the child face ...'s section is not admitted in the end plane: ... the skin is already inside the cut` (the children start outside the plane), and with each child carried back along its end tangents `the sections of ... cross 0 times in the end plane, not twice` (a bare tube carried back does not hold its ray's share of the envelope).

### The auricle along its plane normal

`FamilyConicJoints.ts --ear` (`ear-normal.txt`): in nineteen planes square to the ear frame's long axis, sixty-nine lines a plane parallel to the auricle's plane normal. Every line crosses the reference's cut once (skin on the head) or three times (a free sheet: its lateral face, its cranial face, the head behind), except eight lines at the rim's top, 36 and 40 mm above tragion, where a sheet 0.6 to 2.2 mm thick stands over 0.3 to 2.5 mm of air. The auricle's lateral face is one height over its plane everywhere but that curl.

### Mounds against the trunk

| Part | Reading |
| --- | --- |
| Breast, carried 10 mm | Over the upper pole and both sides the two skins weave within 1 to 2 mm at 0.4 to 5 degrees; under the breast one leaving at stations 5 to 10 with turns of 6 to 27 degrees |
| Nose, carried 5 mm | One leaving at every phase but two, within 0.8 mm of the reference, at 18 to 86 degrees: wings 60 to 86, dorsum 18 to 48, under the columella 21 to 31 |
| Arm on the humerus's course | Under the arm and at both fold feet one leaving, within 0.7 mm of the reference, at 16 to 85 degrees; over the cap the two skins weave |

### Neck

Level sections of the reference between 1,415 and 1,475 mm have their middles on a line that leans 0.31 mm forward a millimetre of height. Read by `FamilyConicStar.ts` in a box from 1,400 to 1,500 mm: level sections about the vertical course are star-shaped at every station that holds the whole neck except one, 1,480 mm, where the jaw's floor enters (30 folded rays); sections square to the course from the neck's base centre to the bitragion midpoint have no folded station. The stations marked `outside` in that output are the box cutting the shoulders and the head, not the neck.

### Foot cases

A changed foot length or breadth is refused with `root skin and bone require the same finite oriented section planes` (`AutoMovieHumanNativeControlLaw.root`, which asks the two courses' `u` and `v` to agree within 64 machine epsilons between the rail and the release). Measured by `FamilyConicJoints.ts --roll` (`roll-leg.txt`): a foot 0.9 times as long moves the leg's last two centres, the placement gives the chart a roll of twenty knots whose values are zero to 1e-19 rad along the thigh and up to 3.3e-3 past the ankle, and the section axis at station 104 then differs from f1's by 7.7e6 machine epsilons, at 154 by 9.6e7. A roll is one cubic through all its knots, which is not zero between zero knots. A thigh 0.9 times as long gives no roll and 0.06 epsilons.

## The hypotheses, decided

One construction per kind, each stated as a function of centres and frames. Every row of the matrix takes one of them.

### A part on a host's side: the shared-loop join

For the armscye with the axilla, the breast, the nose with each ala, and the ear's root.

1. **Each wall is its own.** The host's wall is fitted to the host's skin and runs on beneath the part as the host's own surface; it does not read the part's skin. The part's family starts inside the host, at its joint's centre or its root datum, on its own course, and is fitted to the part's skin from the loop outward.
2. **The loop is derived, and no skin is fitted twice.** One surface fixed in the host's frame divides the skin: the host is fitted to the skin on its side and the part to the skin on the other, each closing beyond it by a closure that is no observation (the fit tool's `opening` with `around`). The two fitted surfaces then overlap only in their closures and cross once, at that surface; the loop is their crossing on the host's chart. Where the skin runs on smoothly across it (the shoulder's cap, the breast's upper pole) the crossing is shallow and the join's strip there is `reach` wide.
3. **One `merge` with `loop` joins them**, each rail by the fold's law `hypot(reach, R tan(beta / 2))`. A fold is the two walls meeting with radius `R`; nothing digs it and no band's profile shapes it.
4. **The radius is a prior in the host's frame**, stated per fold with its basis; the reach is the half width of the strip over a tangent arc.

No either-or remains for the breast: a height net over the thorax cannot hold a lower pole that overhangs its fold, which a changed person's does, so the breast is a mound family and not a relief.

### Parts on a host's end: the composed end of ray territories

For the finger row, the toe row, the thumb's base and the crotch.

1. **Each child's family is its ray's territory from its joint's centre.** Proximal of the fork it carries its share of the one envelope: fitted to the skin on its outer arcs, and closed beneath its neighbours across the parting planes.
2. **Every dividing surface is declared once** (`test/src/reference-conics/FamilyConicDivide.ts`) and read by both neighbours with opposite signs. A parting plane holds the bisector of the two rays' first segments and the palm's or the sole's normal, through the midpoint of their joint centres (the median plane for the thighs). `FamilyConicBody.ts --divides` counts, on the reference's vertices beside each surface, the skin no part of the joint keeps and the skin more than one keeps: both are 0 on all fifteen surfaces (the check's first run found 42 vertices kept by the thumb and the index finger both, and the thumb's plane now parts it from the four fingers as well as the palm).
3. **The parent ends on one of its own sections, proximal of the webs.** A split's forks stand on the host's end ring, where each seam plane crosses it (pinned by `test_construction_split_compose`, scenario 12), so the plane the children part from the parent by must be a section plane of the parent, and its ring must lie near the composed outline. The planes are therefore the parent's section planes at its course's stations for the third metacarpal's head (584.8 mm on the hand), for the ball of the foot, and nearest the midpoint of the wrist's centre and the thumb's first joint (the carpus, 515.44 mm); for the thighs, the trunk's level section midway between the hip centres' height and its foot. Measured on planes within a few degrees of these, the envelope there is star-shaped about every child's course.
4. **`compose` joins them as it stands**: the neighbours overlap and cross twice by construction, the forks and the seam valleys are their own crossing, and each rail is the child's skin cut by the end plane and its parting planes moved by `rail`.
5. **The web's floor is the fillet between two walls**: `rail` is half the web floor's width, a prior as a share of the digit's breadth (measured on f1: fingers 2.4 to 4.4 mm, toes 0.7 to 1.8 mm, thighs 10.6 mm).

The alternative, a composed outline that admits separated tubes joined by a web arc, is not taken: it leaves the children starting outside the joint and asks for a new surface no part's skin owns. The measurement behind the choice is the star-shape row above; the sources agree with it (Wang's patches meet on shared curves at the crotch; Blender's Skin modifier hulls separated frames and loses the web).

The wrist stays the continuation it is, where the stored arm and hand meet (445 and 448 mm): its frames show no defect on either side, and the hand is the one family that starts inside its neighbour. The carpus split lies inside the hand's own stretch: the stored hand from 448 mm to the carpus plane is the split's host, and the palm (from the carpus plane to the heads' plane) and the thumb's ray are its children; the palm is in turn the host of the four fingers. A composed split whose host is a composed split's child realizes on a made case (scenario 12 of the same test).

A child's fitted face starts one fitting step past the first station at which its own course point lies on its own side of its surfaces (`--from=kept`), is seeded on its stored wall from that wall's first knot and stays on that wall's layout, and is then spliced onto it, so nothing of a digit distal of its stored first knot changes.

### A joint one family runs across: the hinge

For the elbow, the wrist, the knee, the ankle, the ball of the foot and the interphalangeal joints. One family across the joint stays right at rest, and the frames show no defect. What each family owes a rig and a changed person:

| Joint | The family carries | Still missing |
| --- | --- | --- |
| Elbow | The turn at the centre with its half length by the turn rule; the hollow as a relief | The olecranon and the two epicondyles as features fixed in the humerus's and the ulna's frames; the flexion axis apart from the course |
| Wrist | The turn at the wrist's centre, inside the arm's family once the arm runs to the carpus | The ulnar head and the styloids as features in the forearm's frame; pronation as a roll along the forearm |
| Knee | The turn; the hollow behind | The patella tied to the tibia; the tuberosity and the fibular head |
| Ankle, ball | The turns | The malleoli on the oblique axis; a roll with local support (see the foot cases) |
| Interphalangeal | The turns | The heads as features; creases as inflection lines |

Curves' step 5 (both parts' fields extended past the centre) holds for a hinge inside one family by construction: the family's fields run through the centre. A bone-end feature is a relief window placed in its bone's frame, so it rides its bone when the joint turns; that is a change of the reliefs' placing frames, not of the kernel. None of this is needed for f1's rest figure to pass its frames, and it is listed so that it is not discovered later.

### Neck and jaw

The neck is its own family on the course from the neck's base centre (the midpoint of suprasternale and the back's skin at that height) to the head's origin, with sections square to that course; the torso below and the head above keep theirs. Basis: a trunk length is refused today for three measured reasons ([Centres and courses](centres-and-courses.md)), and on that course no station folds where a level section folds at the jaw's floor. The neck's two ends are continuations on shared rings: at the base, the torso's skin cut by the plane square to the neck's course through the base centre; under the jaw, the head's skin cut likewise 74 mm below the head's origin, the last station whose section is the neck's alone (a plane through the head's origin leaves the head through the upper lip and the occiput).

### Each new declaration's premises against today's values

| Joint | Premise | Value today | What makes it hold |
| --- | --- | --- | --- |
| Armscye | `shared loop` within a numerical tolerance | The two fields stand 4.9 to 7.0 mm apart on the loop: two fits of one skin | Complementary clips: the trunk fitted on its side of the armscye's surface, the arm on the other, so the two cross once at it |
| Armscye | `one kept side` | Refused at the anterior fold's foot with the stored arm; passes with the arm on the humerus's course | That arm |
| Armscye | `fold radius` | Refused at 6 mm: the trunk's own net turns on 4.06 mm beside the loop | The trunk's wall run on as a wall |
| Armscye | `rails`, `unfolded blend` | Refused at the apex on the stored trunk; admitted at 6, 3 and 1 mm with the side net left off, and at a made 2.8 rad | The same |
| Armscye | `cleft` | Not reached; the apex turns 2.8 rad and the refusal stands at 3.0 for a 3 mm ball under a 20 mm cap | - |
| Breast | `shared loop`, `one kept side` | Not read on the instrument: the stored breast starts at the wall and has no wall inside it to carry (11 mm) | The breast's family from its root datum |
| Breast | Fold arc | Turns of 6 to 27 degrees at the walls' crossing, 19 to 49 on the reference; under every tested turn | - |
| Nose | `transversal contact` or `shared loop` | A crossing at every phase but two, at 18 to 86 degrees | The two phases beside the dorsum's top, where the carried wall starts outside by 1.1 and 2.7 mm, need the nose's root 5 mm deeper |
| Finger row, toe row, crotch | Each child's section admitted in the end plane | Refused: every child starts outside the plane | Each child from its joint's centre |
| The same | Neighbours cross exactly twice | Refused once carried in: bare tubes do not overlap | Ray territories |
| The same | The host's end ring within `rail` of the composed outline | Not reached | The host ended where its section is the envelope the territories compose |
| Thumb | The same three, at the carpus | Not readable: the tree has no split there | The carpus split; a split whose host is a split's child |
| Neck | Equal-order ends share a ring | Not read | The torso's and the head's last rows are the neck's skin cuts |
## The inventory, closed

| Connection | In or out | Reason |
| --- | --- | --- |
| The fourteen operator nodes and the joints inside families listed under [The tree today](#the-tree-today) | In | - |
| Lids and eye socket | Out | Height nets of the trunk; no operator; a face template's work |
| Mouth corner, lips | Out | The same |
| Jaw's angle to the ear's root | In, with the ear's root | The plate's loop crosses it |
| Navel | Out | One net, `trunk.navel`; no defect seen |
| Nipple and areola | Out | Not modelled as a form |
| Nail folds, nail plates | Out: owned by the nail worker | It depends on each digit's distal phalanx frame and skin only |
| Heel and sole | Out | The leg's own wall; no connection |
| Scalp line | Out | Hair's work |
| Gluteal cleft | In, with the crotch | The median seam's back half |

The batch does not change any digit's distal knots or tip: each digit is refitted only proximal of its present first knot and spliced there. The fingertip's own form (a flatter pad, the nail bed's plane) is not in this batch.

## Family changes

Centres are those of `AutoMovieHumanF1Joints` and `AutoMovieHumanF1Centres`. Every fit is one heavy run; the queue runs one at a time. Costs are estimates from the one fit timed for this note, the arm on the humerus's course: 318 sections, 28 minutes.

| Family | Course starts at | Stretch it owns | What it publishes | Tool command | Cost |
| --- | --- | --- | --- | --- | --- |
| Trunk, side and shoulder nets | Unchanged | The thorax's wall, running on under the arm; it stops reading the arm's skin | The wall the armscye's loop lies on | `FamilyConicBody.cjs trunk --wall=stored --refit-reliefs=trunk.chest.side,trunk.shoulder`, the side window without `uncut` | Two nets; 10 to 30 min |
| Trunk, foot | Unchanged | Ends 40 to 60 mm above 808 mm | An end section star-shaped about both thighs' courses | `trunk --wall=stored` with the domain's foot raised, the crotch nets refitted | 10 to 30 min |
| Arm | 60 mm proximal of the glenohumeral centre, on the humerus's line; from the elbow on the stored course (stations offset by 64.55) | From the armscye's loop to the carpus plane | The loop, as its crossing with the trunk; an end section at the carpus | `FamilyConicBody.cjs arm` for the root, spliced at the elbow onto the stored arm; then the stretch from 445 mm to the carpus | Root fitted once (28 min, candidate `armscye-refit-20261117/arm-isb-2`); forearm end 10 min |
| Palm (today's hand) | The wrist's centre | From the carpus plane to the heads' plane, with its closure toward the thumb | Its end section at the heads' plane | `FamilyConicBody.cjs hand` with the new domain and `opening` | 15 min |
| Thumb | Its first joint (the carpometacarpal) | From the carpus plane out; its metacarpal with the thenar | Its root section in the carpus plane | The digit's part with `domain` from 0, `opening` the palm's side, `around` | 5 to 10 min |
| Four fingers | Each metacarpal head's centre | From the heads' plane to the stored first knot, spliced there | Its root section in the heads' plane | The same, with one or two parting planes | 4 runs, 5 to 10 min each |
| Leg, end | Unchanged | Ends at the metatarsal heads' plane, about 20 mm before 975 mm | Its end section | `FamilyConicBody.cjs leg` window splice at the end | 15 min |
| Leg, root | The hip's centre | From the hip's centre to the stored first knot at 104 mm, its closure across the median plane and beneath the pelvis | Its root section in the trunk's end plane | The leg's part with `domain` from 0, `opening` the trunk | 15 min |
| Five toes | Each metatarsal head's centre | From the heads' plane to the stored first knot | Its root section | As the fingers | 5 runs, 5 min each |
| Breast | Its root datum inside the wall | From the loop out, on its side of the footprint's surface | The loop | The breast's part with `domain` from 0 | 10 min |
| Nose | Unchanged | Unchanged | The loop | None | - |
| Alae | A new course each, from the alar base inside the cheek round the wing | The wing's shell | Its loop on the nose and the cheek | A new part in the fit tool | 2 runs, 10 min each |
| Neck | The neck's base centre | From the base plane to the plane under the skull | Both end rings | A new part; the torso and the head refitted at their new ends | 3 runs, 20 to 40 min each |
| Ear | Unchanged: the plate's course | The whole auricle as one sheet; its lateral face's nets along the plane normal, in the ear's frame | Its root loop on the head | `FamilyConicBody.cjs plate` with its lateral nets | 20 min |
| Helix, antihelix, concha cutter, axilla cutter, nose band's tables | - | Deleted | - | - | - |

About three to four hours of fits, one at a time, before the batch's code can be seen on a figure. Each fit's admission is the composed end's or the shared loop's premise read on the instrument for its joint alone, before any whole-figure run.

### Who fits what

This batch owns how parts meet: each dividing surface, loop, end and join, each family's existence and course, and each family's root stretch proximal of its joint. One other work fits families at the same time: the form of every part of the body but the head, between its joints (the neck's surface, the trunk, the breast's mound law, the limbs' shafts, the palm, the digits' shafts and tip pads, the foot, the root height law; [Every part in one shot](parts-one-shot.md)). The interlock is per family; on the trunk it is per net:

| Of the trunk | This batch | The trunk's work |
| --- | --- | --- |
| Nets refitted here | `trunk.chest.side` and its twin, `trunk.shoulder` and its twin (where the trunk meets the arm); `trunk.crotch` and its twin and `trunk.low` (when the foot is raised); `trunk.collar` (when the neck is split off) | Every other net: `trunk.chest.front`, `trunk.chest.back`, `trunk.fold`, `trunk.navel`, and the head's and the face's nets while they stay on the trunk |
| Wall | Its foot raised 40 to 60 mm above 808 mm; its top cut at the neck's base ring | The wall's own sections, knots and layout between those two ends |
| Dividing surfaces | The armscye's surface, the breasts' footprints, the neck's base plane, the median plane at the crotch | - |

For the other families this batch creates or changes, it does the existence, the course, the root stretch, the join and a first fit to the reference. The form laws of the body's families are the parts' work; the head's (the alae, the auricle) have no other owner and stay at their first fit:

| Family | This batch |
| --- | --- |
| Neck | Its existence, its course, its two end rings and their continuations, a first fit of its wall |
| Alae | Their existence, courses, a first fit, their joins on the nose and the cheek |
| Auricle | The plate as one sheet with its root join; the tubes and the cutter removed; a first fit of the lateral face's height nets |
| Breast | Its family from its root datum, its dividing surface and its join |
| Arm, palm, digits, leg | Each root stretch proximal of its joint, and the ends at the carpus and the heads |

The head is a third work's ([The face in one shot](face-one-shot.md)): every face part's form and how the face's parts meet each other. It has taken over the nose (one family on the nasion to subnasale course, with no alar families), the nose's join, the nostrils' cuts, the auricle's lateral nets, the lids, the lips and every net of the head and the face; the trunk's family ends at the neck's base ring. This batch keeps the neck's family with both its rings and their continuations, the plate as one sheet with the ear's root join, and `trunk.collar`. The rows and pass forms above for the nose and the ear's ridges stand as this note's finding for that work; its rows for alar families are superseded.

The neck's upper ring stands 74 mm below the head's origin on the neck's course, the last station whose section is the neck's alone: read on that course, the section's length is 325 to 326 mm from 91.6 to 75.6 mm below the origin, 328.2 at 73.6 and 347.5 at 71.6, where the jaw's front has entered (`neck-star-2.txt`). The head's wall starts at that ring.

A family is fitted by one worker at a time: every run of this batch's fit queue is named in the progress log before it starts, and no other fit of a listed family or net starts until it is stored.
### The body's wiring and fit requests

[The body in one shot](body-one-shot.md) ends with ten wiring requests (W1 to W10) and five fit-tool requests (F1 to F5). They go into the same batch and the same whole-figure round as the joints. Who edits which file, so that no file has two writers at once:

| Request | File | Applied by | When |
| --- | --- | --- | --- |
| W1 standing root, W3 tip dome starts | `AutoMovieHumanF1.ts` (`nativeFrom`, `DIGITS`, `rounded`) | This batch | In its declaration step, with the joints' new tree. W3 changes each digit's cap start, which the nail work reads |
| W2, W6, W7 | `AutoMovieHumanF1NativeBuild.ts` | The body's work | Now: this batch does not edit that file again |
| W5 | `AutoMovieHumanF1NativeFieldTypes.ts` | The body's work | Now |
| W4, W6 | `AutoMovieHumanF1NativeCalibration.ts`, `AutoMovieHumanF1NativeSites.ts` | The body's work | Now |
| W8 | `AutoMovieHumanNativeFamily.ts` | The body's work | Now |
| W9 mound law | The breast's family and `AutoMovieHumanF1NativeTape` | The body's work, on the breast family this batch refits from its root datum | After that family is stored |
| W10 | `AutoMovieHumanF1NativeBuild.trunkFeature` | The body's work | Now |
| W11 the digit's caliper site | `AutoMovieHumanF1NativeCalibration.readReference` | The body's work | With this batch's declarations: the site is the station of the digit's proximal joint centre on its course, which is the `from` each digit's leaf is declared with (fingers 16 to 24 mm, toes 20 to 25, thumb 43). A digit's first knot is now inside the palm's or the foot's envelope, where its section is a ray territory with a closure, and is no site |
| W12 the wrist's site | `AutoMovieHumanF1NativeSites.evaluate` | The body's work | With this batch's declarations: 504.88 mm lies on the wrist's stub, the part of the hand's course from the arm's end to the carpus plane at 515.44, proximal of the palm's first knot (519.5). The hand's site (579.37) stays on the palm |
| F7 the spliced digits' tip records | `FamilyConicBody.ts` (`--splice`) | This batch | Done: a tail splice keeps the tail's far end record as stored, moved by the splice's shift; a root piece's own record is not emitted for a spliced family |
| F6 a groove ending between two knots | Every net or line ended inside a family | Both | This batch ends no relief inside a family it refits: `trunk.chest.side` and `trunk.shoulder` keep their stored windows, and each root stretch is wall alone. A fold of a join is the join's blend, not a net |
| F1 to F5 | `FamilyConicBody.ts` | The body's work | After this batch's fit queue is stored: until then the file is this batch's. The trunk's whole refit on the skin (F2) follows this batch's last refit on the stored wall (`trunk.chest.side`, `trunk.shoulder`), and its foot and its two armscye clips come from `FamilyConicDivide` |

This batch keeps to itself until the round: `AutoMovieHumanF1.ts`, `AutoMovieHumanF1Armscye.ts`, `AutoMovieHumanF1NativeRoots.ts`, `AutoMovieHumanF1NativeRootLaw.ts`, `AutoMovieHumanF1NativeRootLevel.ts`, `AutoMovieHumanF1RootControls.ts`, `AutoMovieHumanF1RootRails.ts`, `FamilyConicDivide.ts`, `FamilyConicJoints.ts`, `FamilyConicArmscyeJoin.ts`.
### The nails' and the face's wiring

Both notes end with edits they ask for in files this batch holds. Each goes into this batch's declaration step and the same round.

| Request | File | Applied by | Order |
| --- | --- | --- | --- |
| [Nails](nails.md), "Wiring", statements 1 to 3: the nails made from the digits, the digits bedded, the folds and plates attached | `AutoMovieHumanF1.ts` (`constructionFrom`) | This batch | Statement 1 stands after `DIGITS`, `rounded` and the body's tip dome (W3) have given each digit its tip, and before the composed splits read `placed.digits`; statement 3 after the last cut. A digit's root stretch and its `from` lie proximal of the bed and do not move it |
| [Face](face-one-shot.md), "Wiring": the head's landmark points, their constants, the `eye` and `mouth` frames, their rigid placement, the head's courses | `AutoMovieHumanF1Placing`, `AutoMovieHumanF1Landmarks`, `AutoMovieHumanF1Frames`, `AutoMovieHumanF1Placement` | The face's work | These files are not among the ones this batch keeps to itself; the face's work edits them, one writer a file at a time. The neck's two rings read the `head` frame's origin and the neck's course only, which those edits leave as they are |
| Face: the nose's join, the nostrils' cuts, the lids' and lips' openings, the auricle's nets | `AutoMovieHumanF1.ts` | This batch writes the statements the face's note states, where the head's families are stored; until then the tree keeps the head's present statements unchanged | After the limbs' and the trunk's statements |

### What this batch carries now that the body's laws and the head's parts are paused

The one whole-figure round carries the joints and the nails. The body's requests W1 to W12 and the head's declarations are not wired by it, except what a joint needs to stand: a spliced digit keeps its stored tip record, and the digit's caliper site stays where the body's work already put it.

| Joint | In this batch | Why |
| --- | --- | --- |
| The neck: its family, its two rings and their continuations | Deferred with the head | A neck family needs a head family to end against. Today the trunk's family is one wall from the hip to the crown on a straight course with level sections; the neck's upper ring, 74 mm below the head's origin on the neck's own course, is no section of that wall, and a ring cut into it would be judged against level sections it does not match. The ring's place stays as measured, for the head's work |
| The ear's root | In | It stands on its own premises: the head's wall is fitted with the ear left out today, and the root is a join of the plate on that wall. It becomes a shared-loop join on a loop cut by the `ear.root` landmark surface, with the plate's root stretch refitted up to that surface. The helix's and the antihelix's tubes and the concha's cutter stay as they are: the plate as one sheet with its ridges in nets is the head's work |
| The breast | In | Its host is the thorax's part of the trunk's wall, which this batch does not change |
| The nose, the nostrils, the lids, the lips | Not this batch's | Today's nose port and cuts stay |

### What the fit tool has and needs

Read in `FamilyConicBody.ts`: `without` (lines 3613 to 3791), the rows it hands the fit (1940 to 1960) and the part record (884 to 942).

| Question | What the code does |
| --- | --- |
| How a clip is declared | A function of a world point in the part's declaration, positive outside (`clip`); `opening` names the share of it another part fills |
| Whether two openings close | Yes: every exit and entry pair of a section is closed on its own |
| How a section closes round its course | `around`: two conic arcs through a far point at a share of the kept skin's mean radius, in the opening's middle direction |
| Whether the closure weighs in the fit | No, with `around`: the row marks the closure's phases `free` and holds the wall there only on the parent's side of the opening |
| Whether a row can be read from another part | Only from another stored wall of the same part and course (`--plain`, `--skin-range`) |

So two needs remain, both small:

| Need | Why | Check |
| --- | --- | --- |
| The dividing surfaces declared once and used by both neighbours: the armscye's surface, each parting plane, the heads' and the carpus's planes | Complementary clips are what keeps one skin from being fitted twice | Each pair's kept skins share no reference vertex and leave none out |
| The closure's shoulder smoothed along the stations per closure, not per section | A ray with two neighbours has two closures a section | A made section with two gaps: each closure keeps its own shoulder |
## The correction: every finding of the first fit queues

The first queues fitted each root stretch against the registry, framed every admitted piece alone on its own box, and drew every refused section in its chart (`FamilyConicBody.ts --frames-of`, `--precheck --draw-closed`). Every finding is one row here, with its cause as read on the drawn sections and in the code, and the rule that answers it. The rules are decided together and applied in one queue.

| Finding | Where seen | Cause | Rule | Applied in |
| --- | --- | --- | --- | --- |
| A ray's closed section turns a corner of 80 to 90 degrees where its kept skin meets its closure; the seed's arc there meets at 0.022 to 0.099 of its chord, under the fit's 0.1, and the fit refuses its start | Toes: big 2 to 8 and 14 mm, little 6.5 to 12.5; middle finger 2.5 (a kite: two straight closure sides to an apex); the thumb's ray 18 and 22 | The closure round the course passes a far point at 1.0 to 1.25 of the kept skin's mean radius and was accepted as soon as its end tangents met ahead at all. A parting plane passes at about that radius, so the far point stood 2 to 3 mm past it and the tangents met a millimetre from the skin's end | A closure is a wall the family has to represent, so each of its two arcs is held to the family's own admissibility: its tangent lines meet at least the fit's margin of its chord from both ends. The closure is the admissible pair nearest the round one: the far point's tangent square to its radius first, then turned, least turn first, then the far point carried outward, up to twice the mean radius; among those, the first whose closure at the parabola's shoulder stays on the neighbour's side. The turn is needed where the kept skin runs along the plane at one end and square to it at the other (two toes pressed together, the second toe at 20 mm): no round closure is admissible there at any depth. The plane decides only which points are fitted. The closure is not asked to lie inside the neighbour's or the host's volume: the engine trims a part's face at its rail or its seam, so a closure is in no sewn surface (`IAutoMovieConstructionJoin`, the kept sides), and held inside the reference's cut it becomes the near-chord this row is about. The round checks it on the realized mesh: no vertex of a part's face on the host's side of its dividing surface farther than its rail | `FamilyConicBody.without` |
| Two closures of one section shared one smoothed shoulder | Middle finger 3.5 to 10.5: its first station's 0.03 carried over both webs | The smoothing along the stations was keyed by section, written for the arm's one opening | Keyed by closure: the side its opening's middle lies on | `FamilyConicBody.without` |
| A seed's arc crosses a hull edge that carries no point | Middle finger 14.5 and 16.5: 9.8 to 10.2 mm without a point | The tape wall reads the closed loop's hull, and a hull edge has no vertex between its ends; only loose parts were given points along it | Every part closed across an opening carries a point a millimetre along each hull edge, as a loose part does | `FamilyConicBody.ts`, the rows |
| The thumb's ray is no ray proximal of its knuckle: its kept skin carries the first web's sheet as a spur from 26 mm, and at 32 mm its section is a blade 4 mm by 100 mm | Thumb's ray 16 to 38 (arc 6 on kept skin; the fin at 36 and 38; chord 98.9 mm at 32); its own-box frames do not read as a thenar | `web.thumb`, a plane through the midpoint of the wrist and the thumb's first joint, runs along the thumb's sections there and leaves the web's sheet on the thumb's side. The thumb leaves the hand's side, not its end | The thumb is a part on a host's side: a shared-loop join on a loop cut by a landmark surface about its knuckle (radial, dorsal and palmar skin points on its own section there, and the first web's floor), built as the armscye's. The thenar is the palm's. The hand is one family from the wrist to the heads: `carpus`, `web.thumb`, the wrist's stub and the carpus split leave the plan, and `thumb.root` enters the registry | Registry, `FamilyConicJoints.ts --thumb-landmarks`, the tree |
| The palm fitted with the thenar cut away | `q3-hand` (519.5 to 584.8) | The same surface | Withdrawn; the hand is refitted whole from the wrist against `thumb.root` and the heads' plane | Correction queue |
| The little finger's "root fit" had no knot of its own | `q3-finger.pinky`: knots 16, 22, 36, closure share 0 | The root's knots were laid only where half a knot gap remained before the tail; its root is 4.5 mm long | A root stretch has its first knot at its start whenever it starts before the tail | `FamilyConicBody.ts --seed-tail` |
| A piece's distal end stands off the skin as a collar or a flap | Ring finger (about 4 mm), little finger, on their own-box frames | A root piece ends at `--to` on the tail's knots with a free end; the splice replaces everything from the splice station on | Not carried by a splice. A spliced family is framed on its own box before it is stored, and judged there | Correction queue |
| A toe's closure reappears at its distal end | Middle and fourth toe, own-box frames | Not read yet: either the toe's own distal skin crosses its web's plane, which runs on without end, or the frame's shading reads the cap | Read first (the opening's report by station on the spliced toes); no rule before the reading | Reading queue |
| A closure runs out in a horn | Index finger's root, 200 px past its outline; a thorn at the arm root's inner top on the whole-figure clay | Index: the closure across two surfaces that cross at an acute angle. Arm: not read yet | Index: answered by the first rule. Arm: its own-box frames first | Reading queue |
| Spliced tip records | Every digit's root piece emitted its cap from its last root knot and lost `own` | The end record was computed from the refitted stretch's domain | A tail splice keeps the tail's far end record, moved by the splice's shift | Done, `FamilyConicBody.ts --splice` |
| The digits' caliper site and the wrist's site | Body's requests W11 and W12 | Sites read at a family's first knot | The digit's site is its first joint's station, the `from` of its leaf. With the hand one family again the wrist's site stays on it, and W12 falls away | The body's files |
| Surfaces the registry lacks | Breast, ear root, thumb root, the neck's two rings | Not declared | `mammary`, `ear.root` and `thumb.root` are landmark surfaces supplied to the registry as the armscye's is; each one's landmarks are read on the reference by a stated rule before its fit. The neck's rings are section planes of its own family | `AutoMovieHumanF1Divide`, `FamilyConicJoints.ts` |
| A surface's far side takes in skin of another joint | With the thumb's root in the registry: 210 to 796 vertices at the knuckles kept by a finger and the thumb; with the thumb counted apart, 347 kept by none | A far part read its surface everywhere, and a near part only near the joint: ownership was stated on one side | One region a landmark surface, the ball about its joint that holds its landmarks with the tube about its part's course past it. Inside it the side decides for both; outside it the near part keeps the point and the far part has no claim. Made case `test_human_f1_divide`; the complement check reads none 0 and both 0 on all 14 surfaces | `AutoMovieHumanF1Divide`, done |
| A ray's kept skin turns back before its parting plane | Pressed toes (second toe 20 mm, third 14 to 18, little 9.5 to 12.5); the middle finger at its web's floor (17.5); the hand at the first web (563, 565) | The skin there runs into the groove between two digits: it is the web's, the seam's valley, and no child's round | Each end of the kept skin is taken back to its last point that still advances round the course, and the tube is continued from there | `FamilyConicBody.without` |
| The far-point closure itself | Three rules in fifty minutes, the third making the second toe worse (1 refused section to 6) | The closure was built as free wall with conditions added one refusal at a time, while a composed end reads a child's buried arcs (forks, the seam's valley) | The buried arc is the part's own tube continued (The hidden end of a part); the far-point closure and its rules are deleted. Made case `test_human_conic_closure` | `FamilyConicClosure.continued` |
| The hand's hull edge under the margin | Hand 561: a 39 mm arc at 0.0991, the tape's straight edge across the palm's hollow where the thenar and the hypothenar stand apart | The hand's wall is a tape and the palm's hollow is a relief on it, as stored | Unchanged: the hollow stays the palm net's. One section a hair under the margin is read on the fit's own admission, not answered by a rule | Correction queue |
| The parent's end against its children's valleys | The valleys at the heads' planes (Where a parent ends): 1.2 to 4.0 mm on the hand, under 1 mm on the foot | A composed end holds the host's ring within the shortest rail of the children's outline, which is the envelope; a tape bridges the valleys | The planes stay; the parent's skin at its last sections is held to the envelope within the shortest rail by its reliefs, read from its fit and at the joint's realization | Correction queue, the joint alone |
| The thumb's root stretch | `finger.thumb` from its root surface: 148 sections, all whole | Past its root surface the thumb has no buried section, and its stored family starts at 43 mm, before the surface's cut at 45.5 | No root fit: the stored thumb is declared with its face from the loop | The tree |

Read down the cause column, two things repeat. A closure was treated as free wall and built without the conditions every fitted wall meets, so its faults came back as refusals of the wall it is part of. And a parting surface was placed by a rule about two points, without asking whether it crosses the part's sections or runs along them: where it crosses them (the fingers' and the toes' webs), the registry's rule holds and only the closure had to change; where it runs along them (the first web), the part is not a ray there and belongs on the host's side.

How others close a ray at a branch, as recalled from the earlier reading for this note and not read again here: the skin modifier's base mesh builds a branch node as the convex hull of its limbs' end sections, which stand a distance from the node, and stitches the hull to them; Wang's mannequin holds closed feature curves away from the crotch and the armhole and fills between them with four-sided patches. Neither closes one limb's section through its neighbour: the branch is owned by a transition between closed sections. That is what the engine's composed end does with its seam planes and bands, and it is why the closure here is a device of the fit alone: the engine cuts each child at the seam and never shows a closure, so the only thing asked of a closure is that the wall it completes is an admissible wall.

The registry's rules are the package's (`AutoMovieHumanF1Divide.create`, on joint centres), and the fit tool hands them the reference's joints (`FamilyConicDivide.build`), so the fit and the tree read one declaration. The loop of every part on a host's side is one generator (`AutoMovieHumanJoinLoop.create`): the part's skin cut by the surface on the part's chart, and the host's own skin cut by it on the host's chart (`AutoMovieHumanSkinCutLoop.shares`, the face's piece). Its host must have a straight course with level sections, which the trunk has; the thumb's host is the hand, whose course turns, so the generator's address on the host becomes the general inverse chart before the thumb's join is declared.

### The hidden end of a part

The closure row above was revised three times in an hour, each time after the last refusal, and the third revision made one toe worse: the far-point closure was the wrong object. What the hidden end of a part is, for every buried root of the figure at once (the arm in the trunk, the rays in the palm and the foot, the thumb in the hand, the leg in the pelvis, the breast on the chest, the ear's plate on the head), from three readings.

What the engine reads of a part beyond its visible skin, from the interface's admission text and the kernel's refusals:

| Operator | What it reads | Its refusals |
| --- | --- | --- |
| A join on a declared loop (`IAutoMovieConstructionJoin`, `AutoMovieSolidSharedCurve`) | The part's face through the loop: every loop point within the tolerance of the face, the foot found on the face's own 2-jet, the part's side read all round. The face proximal of its rail is trimmed | A loop point off the face; a foot that does not return; a loop that encloses no region; a kept side that reverses (the part passes under its host along an arc); a width or a fold radius the surfaces do not admit |
| A composed end (`IAutoMovieConstructionSplit.ICompose`, `ICut`) | Each child's whole root section in the end plane, a closed curve. Neighbouring sections cross in exactly two points, the forks; the outline is each section's arcs outside its neighbours; the seam is, in the seam plane through the forks, the deeper of the two children's skins, where their union crosses the plane. A child keeps only its skin inside the wedge of the end plane and its seam planes, moved along its axis by its rail | A child whose skin does not cross the end plane all round; neighbours that do not cross exactly twice; children that are not neighbours and overlap; a seam plane that does not cross the host's ring twice; a host ring farther from the outline than the shortest rail; a child phase whose skin never enters the wedge |
| A port (`IAutoMovieConstructionPort`) | Nothing: the part keeps its stations beyond its rail | - |

So the buried arc of a root section is free wall under a join and under a port, and is read under a composed end: it decides the forks and the seam's valley, and a child's buried arc that comes out through its neighbour's wall gives a third crossing or a valley that is not the web's skin.

How the stored figure buries a root today: the breast, the nose and the arm are ports and keep nothing before their rails; the ear's plate is closed in a point 6 mm inside the head (a covered tip) and traced; the digits are tubes whose families start at or outside their joints, with the fan's bands across the gap; the legs start on the crotch's ring. None of them has a root section that continues into its host, which is the first of the four repeated causes.

What others do with the buried part of a limb, read for this note:

| Source | The limb inside its host | The junction | Read |
| --- | --- | --- | --- |
| Raymer, Aircraft Design: A Conceptual Approach | Defined through the fuselage to the centreline as reference geometry ("the reference wing is fictitious, and extends through the fuselage to the aircraft centerline"); real only outside ("the actual, exposed wing begins at the side of the fuselage") | A fillet, "a circular arc of varying radius, tangent to both the wing and fuselage" | Sections 4.3, 6.4, 7.8, through a text extraction of a scanned copy |
| Bloomenthal and Shoemake 1991, Convolution surfaces; Bloomenthal, Bulge elimination in implicit surface blends | Fully present: each skeleton segment runs to its end inside the junction and the fields add | The summed field's surface; a bulge where a limb's end touches the host's segment, reduced by pulling the limb's skeleton back by its radius | Both papers in full |
| Wang 2005, Parameterization and parametric design of mannequins | Absent: a skin-only wireframe of planar feature curves | Gregory patches, four- and five-sided, on shared feature curves with one cross-tangent ribbon a curve | Pages 1 to 16 of the author's copy |
| The skin modifier (Blender, `MOD_skin.cc`), after B-Mesh | Absent: "branch node generates no frames"; a limb's sweep stops at its neighbour's frame | The convex hull of the limbs' end frames, their caps removed; a frame that ends up inside the hull is a defect it repairs | The modifier's source; the B-Mesh paper itself could not be opened |

Liming's conic lofting text and the B-Mesh paper were not read.

The engine's composed end takes its children's root sections whole and crosses them, which is the lofting practice, not the patch or the hull practice: it needs the limb defined through the junction. So does the body: the bone and its tissue run on inside the host along the part's course.

The one construction. The buried arc of a root section is the part's own tube continued: at each phase of the opening, the radius about the course of the part's nearest whole section (where it stands free of every dividing surface), multiplied by a ratio whose logarithm is a cubic in the phase that takes the kept skin's ratio and its rate at the opening's two ends (`FamilyConicClosure.continued`). It passes through the kept skin's ends with the skin's own directions, and it is the tube itself where the kept skin lies on the tube. Nothing is chosen: no far point, no depth, no turn, no margin. Two neighbouring rays continued this way overlap by a lens, each one's buried arc inside the other's section and the two crossing at the kept skins' ends, the composed end's premise; a part on a host's side is a tube inside the host, the join's face through the loop. The far-point closure it replaces was scaled to the kept skin's mean radius and knew neither the part's own section nor its neighbour: that is the corner at the parting planes and the horn of the arm's root through the chest's skin.

Its premises, refused by name in the fit's report: the part has a whole section; each end of the kept skin advances round the course. Its made case (`test_human_conic_closure`): a round tube cut by a chord gives the tube itself within 1e-12; two circles of radius 10 at 16 mm parted by their middle plane give a closure that lies inside the neighbour and past the plane at every point; kept skin off the tube with unequal ends meets both end tangents within 0.005 mm; a skin end running back and a tube without a radius are refused.

Where a ray's kept skin ends. At a web's floor, and where two digits are pressed on each other (the second toe at 20 mm, the third at 14 to 18, the little toe at 9.5 to 12.5, the middle finger at 17.5, the hand at the first web at 563 and 565), the skin before the parting plane turns back toward the neighbour and runs into the groove between them. That stretch is the web's: a composed end reads it as the valley of the two walls' union and gives it to its bands, and it is no child's round. So each end of a ray's kept skin is taken back to its last point that still advances round the ray's course, and the tube is continued from there (`FamilyConicBody.without`). The parting plane decides between two neighbours' skins; where the skin stops being a round about its own course decides where either one's ends.

### Where a parent ends

A composed end measures its host's ring against the outline of its children's root sections and refuses a ring farther from it than the shortest rail. With each child a ray's territory, its kept skin runs up to its parting planes, so the composed outline is the skin's own envelope in the end plane, forks and valleys included; and the host's ring is the parent's skin as the engine reads it, its wall with its reliefs. The premise is therefore a statement about the parent's fit at its last section: it follows the envelope within the shortest rail. A tape wall bridges every valley, so the valleys' depths say where a wall alone cannot.

Read on the reference with the valley taken locally, against the hull of the skin over the two neighbours alone (`FamilyConicValley`; `FamilyConicBody.ts --divides` on the parent's own section planes about the heads' plane, depths on either side of each pair's line, mm):

| From the heads' plane | Little and ring finger | Ring and middle | Middle and index | Toes: little and fourth | Fourth and third | Third and second | Second and big |
| --- | --- | --- | --- | --- | --- | --- | --- |
| -8 mm | 1.67 / 2.13 | 3.69 / 0.83 | 2.98 / 0.45 | 0.02 / 0.21 | 0.07 / 0.19 | 0.21 / 0.08 | 0.07 / 0.05 |
| -4 mm | 1.45 / 3.52 | 3.60 / 1.47 | 2.77 / 1.03 | 0.03 / 0.47 | 0.04 / 0.22 | 0.12 / 0.17 | 0.06 / 0.21 |
| 0 | 1.17 / 3.97 | 3.70 / 2.10 | 2.79 / 1.75 | 0.04 / 0.96 | 0.04 / 0.30 | 0.07 / 0.11 | 0.10 / 0.52 |
| +4 mm | 1.32 / 3.75 | 3.52 / 2.89 | 2.75 / 2.86 | 0.04 / 1.67 | 0.07 / 0.39 | 0.13 / 0.26 | 0.19 / 0.69 |
| +8 mm | 2.49 / 3.87 | 3.19 / 3.73 | 2.88 / 4.21 | 0.02 / 2.09 | 0.06 / 0.59 | 0.15 / 0.21 | 0.24 / 1.09 |
| +12 mm | apart, 3.37 | 2.64 / 3.51 | 3.12 / 3.55 | 5.86 / 2.04 | 0.01 / 0.97 | 0.16 / 0.10 | 0.24 / 1.97 |
| +16 mm | apart, 6.23 | 2.88 / 3.74 | 4.24 / 3.69 | apart, 1.25 | 0.09 / 2.01 | 0.14 / 0.47 | 0.13 / 3.20 |
| +20 mm | apart, 7.33 | apart, 4.33 | apart, 5.45 | apart, 1.31 | 1.71 / 2.06 | 0.11 / 1.46 | 0.13 / 3.28 |

The hand's heads' plane stands at 584.80 mm of the hand's course, 10.2 mm proximal of the stored hand's end (595, which stands in the webs); the foot's at 964.21 mm, 10.8 mm proximal of the stored leg's end (975). The rails are half each web's floor (fingers 2.4 to 4.4 mm, toes 0.7 to 1.8).

What the table says. On the foot every valley at the heads' plane is under a millimetre: the forefoot is one sheet there, and a tape wall follows it within the rails, tightest at the little toe's web (0.96 against about 0.7). On the hand the valleys at the heads' plane are 1.2 to 4.0 mm: the side that grows toward the webs is the back of the hand between the knuckles (2.1, 1.8 and, at the little finger's web, 4.0), and the other side stays at 2.8 to 3.7 mm from 8 mm before the plane to 8 mm past it, which is the palm between its pads. So at the hand's end a tape wall alone stands 2 to 4 mm off the envelope, at or over the shortest rail (2.4), and the hand's family has to follow the envelope there by its reliefs, as its palm net already does on the palm's side to its end. The planes do not move: the parent ends at its heads' section, and the gate is the parent's own skin against the reference at its last sections, read from its fit (the skin's distance over the wall with its reliefs, by station) and again as the composed end's own measure when the joint is realized alone.

Behind the thighs the gluteal cleft stands 17.6 mm deep 100 mm above the trunk's foot: it is a fold of the trunk's own skin, a relief of the trunk's family as today, and not the branch's valley. The front valley is 3.6 mm at 80 mm above the foot and 8.4 at 60, within the thighs' rail (10.6) at the hip's plane, which stands about 76 mm up.

A row is an arc and a composed end has one plane ("each child's own skin cut by one declared end plane"): the little finger's first joint stands 11.5 mm proximal of the hand's heads' plane and its web opens first, 12 mm past it, while the other two open 20 mm past it. The plane stays the parent's section; a child whose joint stands proximal of it has its first millimetres inside the parent's sheet and is carried to the plane as its own tube.
### The thumb on the hand's side

This reverses the plan's row for the first web (the thumb's ray and the palm composed on a stub at the carpus), so its three premises are stated before anything is fitted.

Which joint. The thumb articulates on the hand at the carpometacarpal joint, and its metacarpal lies inside the thenar: that joint's centre stays the origin of the thumb's course and of its segment frame, and opposition is that frame's rotation, as before. What changes is where the thumb's own wall starts on that course. The visible thumb leaves the hand at the metacarpophalangeal joint: the first web's floor stands at about that level, and proximal of it the reference's sections square to the course are not a tube (the spur from 26 mm along the course, the blade at 32 mm, both measured on the drawn sections; the stored thumb family itself starts 43 mm along). So the cut is a landmark surface about the metacarpophalangeal centre, and the family's wall starts where that surface cuts its skin. The skin over the metacarpal is the palm's, and how the thenar moves with opposition is the hand family's form under the pose, a form law of the body's work and not of this joint.

What the loop follows in a rig. The surface's four landmarks are stored in the thumb metacarpal's frame, so they ride the carpometacarpal rotation; the loop is not stored at all. It is generated at the pose from the posed thumb, the posed hand and the carried surface (`AutoMovieHumanJoinLoop`), so under opposition it travels over the thenar's skin with the thumb, as the armscye's loop travels with the humerus.

The host's address. The generator reads a world point's address on the host's chart: on the trunk, a straight course with level sections, that is the point's height and polar angle. The hand's course turns at the knuckles. The general address is the station at which the point lies in the course's section plane, found from the straight-line guess by bisection of `(p - o(s)) . t(s)`, and the polar angle in that station's frame; on a straight course it is the present address exactly. It is one piece for every side joint and replaces the straight-course premise: the breast and the ear's root stand on the trunk's family and need no more than the present address, the thumb needs the general one. Its made case: a host on a course with one circular turn of radius 60 mm, a point placed at a known station, phase and radius inside the turn; the address returns that station and phase within 1e-9, and on a straight host the old and the new address agree to the last bit.

What is read before the thumb or the hand is fitted: the four landmarks on the reference by their rule (`FamilyConicJoints.ts --thumb-landmarks`); the complement check of every pair with `thumb.root` in the registry and `carpus` and `web.thumb` out of it; and the hand's sections from the wrist to the heads with the thenar inside them, star-shaped about the hand's course or not, station by station (the earlier reading of the thumb's end found two to six folded rays from 20 mm on the thumb's course, which says nothing yet about the hand's).

## Kernel, Human and tool pieces

Each stated once as a general capability, with the red-first made case and its closed-form expectation.

| Piece | Where | Joints | Made case that fails first | Files |
| --- | --- | --- | --- | --- |
| A band owned by a join's declared loop, exact between columns | Engine | Armscye, breast, nose, alae, ear | A cylinder on a plane joined on their circle with 16 columns: between columns the blend's start edge must lie on the circle within 1e-9 mm; today it is exact at the columns only and stands off by the chord's sagitta `a (1 - cos(pi / 16))` between them | `AutoMovieSolidJoin`, `AutoMovieSolidBlendChain`, `AutoMovieSolidBodyMerge`, `AutoMovieSolidSharedCurve` |
| A join's loop, and a port's, as a face's skin cut by a declared surface, as `ICut` gives a split's child | Engine and interface | Armscye, breast, nose, ear, neck | A sphere cut by a plane: the loop is the circle of radius `sqrt(R^2 - d^2)` with its exact tangent, at any phase | `IAutoMovieConstructionJoin`, `AutoMovieConstructionSharedLoop`, `AutoMovieConstructionSkinCut` |
| A chart roll with local support (done) | Human | Ankle and ball under a changed foot; every posed limb | `test_human_conic_pose` scenario 9: three runs, the last twisted 0.1 rad; the first two runs' axes equal the unrolled axes bit for bit. It failed on the natural cubic (off by 9.2e-8 to 1.6e-3) and passes on `IRoll.eases`; f1's leg with a foot 0.9 as long now differs from f1's at its root by 0 machine epsilons | `AutoMovieHumanConicPose.twist`, `AutoMovieHumanConicLoft.IRoll`, `eased` |
| The loop of a part on a host as the part's skin cut by their dividing surface | Human | Armscye, breast | A made cylinder cut by a made plane: the loop's stations are the closed form at every phase. The crossing of the two fitted walls is not the loop: past the surface each wall is a free closure (measured on f1: the crossing jumped between arm stations 74 and 119 over the cap) | `AutoMovieHumanLandmarkSurface` (done, `test_human_landmark_surface`), `AutoMovieHumanF1Armscye` rule `surface` (its made case owed) |
| Reliefs placed in a bone's frame | Human | Elbow, knee, wrist, ankle | A feature window at a made hinge turned 0.5 rad keeps its place in its bone's frame | `AutoMovieHumanConicPose`, `AutoMovieHumanF1Placement` |

Pieces considered and dropped, each with the measurement:

| Piece | Why it is not needed |
| --- | --- |
| The fold's blend as the ball's conic arc | The present blend turns a made 2.8 rad and f1's sharpest fold is 2.8 rad; the refusals offered for it were the trunk's net |
| A parent end generated by the kernel | The parent ends where its own section is star-shaped; the composed end is used as built |
| A split whose host is a split's child | It exists: a made case realizes with no diagnostic (`test_construction_split_compose`, scenario 12) |
| A composed outline of separated tubes with web arcs | Ray territories overlap by construction |
| A curvature width bound between knots | It served the axilla cutter, which goes |
| Several contact loops for one traced part | It served the cutters and the ala's traced join, which become shared-loop joins |
| Contact between sheets | No fold of f1 reaches `cleft` at a 3 mm radius; it stays the limit for a hanging arm in a person or a pose whose apex closes past 3.0 rad |

### What the batch deletes

| Deleted | Replaced by |
| --- | --- |
| `armscye.*` port, its band, `cut.axilla`, `AutoMovieHumanF1Axilla`, `AXILLA_SEED`, `AXILLA_LAYER_MM` | The armscye's shared-loop join |
| `AutoMovieHumanF1.ROOT_CONTROLS` loops (arm, breast, nose), `AutoMovieHumanF1RootRails`, `ARM_RAILS_MM`, `NOSE_RAILS_MM`, `RAIL_MM` | Derived loops; fold widths |
| `AutoMovieHumanF1NativeRootLevel`, the arm's, the breast's and the nose's entries of the native root law, their level and clock calibration | The loop generated for the person |
| `NOSE_PROFILES` | The alae as families |
| `FANS` webs, corners, reach, square, fair; `FAN_ORIGINAL_CHORDS_MM`; `fanSeams`' authored phases; `CROTCH` knots | `compose` |
| The thumb's capsule merge, `THUMB_CHORD_MM`, `THUMB_FAIR_MM`, `ROOT_MM` | The carpus split |
| `wrist.*` continuation, `WRIST`, `ARM_TO_MM` | The arm's family through the wrist |
| `ridge.helix`, `ridge.antihelix`, `cut.<concha>`, their families, `EAR_FAIR_MM`, `EAR_SEED_LINES` | The plate's nets |
| `fills`, `BREAST_FAN_FILL_MM`, every join's `fair` | Nothing: a fork and a fold are owned by surfaces |
| The tools that read those tables: `FamilyConicArmscye.ts --table`, `FamilyConicScan.ts webs`, `nose-rail`, `band`, `crotch` | The instruments of this note |

## The batch

Order inside the one batch, by dependency only.

1. Fit tool: the four needs above, each with its check.
2. Engine and interface pieces, each red first on its made case; Human pieces likewise.
3. The fit queue, one run at a time, each admitted on the instrument for its joint alone.
4. Families stored; `AutoMovieHumanF1.ts` declared anew: every shared-loop join, every composed split, the arm through the wrist, the neck; the deletions.
5. The native law for a person: loops generated from the person's sources; the level law gone.
6. One whole-figure round.

### One side, mirrored

Every paired part and joint is made once, on the +Z side, and the other side is its image in the median plane. The fit queue fits +Z parts only; `FamilyConicDivide` holds +Z surfaces only and a part that spans both sides (the trunk) reads each surface and its image; the tree builds the -Z arm, leg, breast and ear and their joins from the +Z families through `AutoMovieHumanConicLoft.mirror`, with the +Z loop's centre phase and sense negated. No table, fit or surface belongs to the -Z side. The reference's own left and right differ slightly, and a difference between the generated -Z side and the reference's -Z side that comes from that alone is not a defect and is not fitted.

Every pass condition below is read on the +Z side against the reference's +Z side. The -Z frames are opened for the mirror's own correctness: each mirrored join realizes without a diagnostic of its own (today the refused axilla blend is the twin's), and the median seams (the crotch, the trunk's own front and back) close.

### The one test round

Cases: f1; every length case of [Centres and courses](centres-and-courses.md) (twenty); tissue 0.8 and 1.2; the tagged-field cases the armscye refused. Cameras: every region of the capture catalogue on both sides, in clay, curves over clay and owners, beside the reference; added for this round, the armpit from in front and behind at the fold's height, and each hand's roots from the palm.

Pass conditions, each a form present on the reference and a number:

| Joint | Form | Number |
| --- | --- | --- |
| All | One piece, no diagnostic, no boundary edge, no face of a foreign owner, no fill | Receipt |
| Armscye | The anterior fold's groove from the apex up and forward; the posterior fold's edge; no crease on the shoulder's front | The apex's turn within 15 degrees of 160; in owners, fitted skin on both sides up to a strip no wider than twice the fold's tangent length |
| Finger row | A knuckle over each head; a web saddle between neighbours; no shelf, collar or notch | In owners, each band no wider than the web floor |
| Thumb | The thenar running on into the palm; one crease in the first web | No fin |
| Toe row | Webs as grooves; domes as now | As the fingers |
| Crotch | As now, from the front, the back and both obliques | - |
| Breast | The inframammary crease as a line with its roll | The fold's turn within 15 degrees of the reference's at five sagittal planes |
| Nose | The alar wing and its groove; the nostril's rolled rim | The groove's turn within 15 degrees of 70 |
| Neck | The sternocleidomastoid's ridge from behind the ear down and forward with the hollow before it; the jaw's floor without a level fold | - |
| Ear | The helix attached, with a scapha inside it; the antihelix one continuous fold with its two crura; tragus and antitragus present; the lobule's edge smooth | No tube, no cutter face and no saw-toothed border in owners |
| A changed person | Every length case builds | Twenty of twenty admitted |

Findings of the round are fixed together by cause.

## Risks

Each with the design answer if the premise refuses; none is answered by a tolerance.

| Risk | Where | Design answer |
| --- | --- | --- |
| Two fits of one skin: a fork or a loop placed by two independent fits moves by their disagreement (4.9 to 7.0 mm at the armscye today) | Every shared curve | No skin is fitted twice. Each dividing surface is declared once in the parent's frame and the two neighbours take complementary clips of it, so their fitted surfaces overlap only in their closures and cross once, at that surface; the fork or the loop is that crossing, one curve by construction |
| The closure beneath a neighbour pulls the fitted arcs | Every ray territory, the arm's root | The closure carries no weight (the fit tool's `free` phases); it is the continuation of the kept arcs through a far point square to the course, inside the neighbour's territory. No visible skin comes from it: the composed outline keeps only each section's arcs outside its neighbours, and a closure that reaches the outline is refused by `cross twice` |
| A territory is not star-shaped about its ray's course for a changed person | Thumb (2 to 6 rays fold from 20 mm on), fingers at the hand's thumb side (10 to 12 rays 30 mm in) | The parent's end plane is placed by rule where the star-shape holds (the heads' level; within 20 mm of the carpus), in the parent's frame, and moves with it |
| The inner split's host is a child | Carpus then heads | The kernel piece above. Declaring the thumb and the four fingers as five children of one end is not an answer: the thumb's ray parts from the palm 60 mm proximal of the heads, in another plane |
| The cap of a fold width: a 3 mm ball at 160 degrees puts both rails 17 mm up the walls | Armpit's apex | The radius is the fold's own; if the reference's floor is tighter than the mesh shows, the rails shorten with it. Past 3.0 rad the join refuses as `cleft` and the two walls stay two sheets, which needs contact between sheets |
| The trunk's wall under the arm has no reference skin | Armscye | It is a declared construction surface: the thorax's wall continued by its own fields. It is hidden under the arm at every pose the join admits |
| The neck's two rings cut the torso and the head where their sections are not level | Neck | The rings are skin cuts by planes square to the neck's course; the torso's and the head's last rows are those cuts |
| The alae cross the nose and the cheek at once | Nose | Each ala is joined after the nose, its loop on a host of two faces; the mixed join's test crosses seams (scenario 6) |
| The rim's top curls over 0.3 to 2.5 mm of air on eight lines | Ear | A height net draws a steep wall there, not an undercut: the template's stated limit, under the reference's own mesh edge |
| A net fine enough for the rim (4 mm wide) holds about two thousand heights | Ear | It is one template in the ear's frame, scaled by the ear's length, breadth and protrusion; its count is stated in its module |
| The fit queue takes hours and one bad fit blocks a joint | All | Each fit is admitted alone on its joint's instrument before the next starts |

## Sources read for this note

| Source | Read |
| --- | --- |
| `AutoMovieHumanF1.ts` | lines 90 to 330, 600 to 1300, 1867 to 2200 and 2264 to 3129 in full; the rest in part |
| `packages/interface/src/construction`: `Split`, `Port`, `Join`, `Continuation`, `FoldWidth`, `CurvatureWidth`, `Trim`, `KnownPort`, `LoftRelief` | in full, without their evidence tags |
| Engine: `AutoMovieSolidBlend.ts` | in full |
| Engine: `AutoMovieSolidJoin.ts`, `AutoMovieConstructionWidths.ts`, `AutoMovieConstructionComposedEnd.ts` | in part |
| Engine: `SplitCompose`, `SkinCut`, `SharedLoop`, `PortCurve`, `PortBand` | refusal texts only |
| `test_construction_operator_mixed_join_cases.ts` | in full |
| `FamilyConicBody.ts` | the trunk's, the arm's and the digits' part declarations, the part record's closure options and the relief refit path, in part |
| `AutoMovieHumanNativeControlLaw.root`, `AutoMovieHumanConicPose` head | in part |
| Wang C. C. L., Parameterization and parametric design of mannequins, CAD 37 (2005) | pages 3 to 16 in full |
| Blender, `MOD_skin.cc` | header and `build_hull`, in part |
| The campaign's supervision record of 2026-11-17; `joint-logic.md` | in full |
