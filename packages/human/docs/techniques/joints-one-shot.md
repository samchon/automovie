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
2. **The divider owns the shared boundary.** The actual host wall meets the registered divider in one regular closed curve. The child inherits that same curve, with its clock and derivatives, in its original proximal section function. Each wall is fitted to its independently exposed skin on its own side. The hidden continuation carries no observation weight.
3. **One `merge` with `loop` joins them**, each rail by the fold's law `hypot(reach, R tan(beta / 2))`. A fold is the two walls meeting with radius `R`; nothing digs it and no band's profile shapes it.
4. **The radius is a prior in the host's frame**, stated per fold with its basis; the reach is the half width of the strip over a tangent arc.

The child's chart may reverse in phase along that boundary. Use connected arcs with a strictly monotone original chart coordinate and a fixed transverse direction for each arc. Their inverse maps use two derivatives of the original curve. On an overlap both maps inherit the same boundary clock. Their local material contributions are combined into one C2 function. The fitted transverse terms vanish on the boundary, and the retained distal field and cap own the protected station and its first two derivatives. The source reader, the loft preview and the realized join read that same function.

A bounded footprint places a breast candidate before fitting. The population extents constrain the proposed footprint, and the reference apex, inferior fold and exposed proximal skin test the individual's result. A registered tragion locates the ear attachment. The indexed medial and free-edge observation must establish whether that site supports a closed independent divider. A missing simple closed divider or missing protected material is recorded as a source refusal.

No either-or remains for the breast: a height net over the thorax cannot hold a lower pole that overhangs its fold, which a changed person's does, so the breast is a mound family and not a relief.

### Parts on a host's end: the composed end of ray territories

For the finger row, the toe row, the thumb's base and the crotch.

1. **Each child's family is its ray's territory from its joint's centre.** Proximal of the fork it carries its share of the one envelope: fitted to the skin on its outer arcs, and closed beneath its neighbours across the parting planes.
2. **Every dividing surface is declared once** (`test/src/reference-conics/FamilyConicDivide.ts`) and read by both neighbours with opposite signs. A parting plane holds the bisector of the two rays' first segments and the palm's or the sole's normal, through the midpoint of their joint centres (the median plane for the thighs). `FamilyConicBody.ts --divides` counts, on the reference's vertices beside each surface, the skin no part of the joint keeps and the skin more than one keeps: both are 0 on all fifteen surfaces (the check's first run found 42 vertices kept by the thumb and the index finger both, and the thumb's plane now parts it from the four fingers as well as the palm).
3. **The parent ends on one of its own sections, proximal of the webs.** A split's forks stand on the host's end ring, where each seam plane crosses it (pinned by `test_construction_split_compose`, scenario 12), so the plane the children part from the parent by must be a section plane of the parent, and its ring must lie near the composed outline. The planes are therefore the parent's section planes at its course's stations for the third metacarpal's head (584.8 mm on the hand), for the ball of the foot, and nearest the midpoint of the wrist's centre and the thumb's first joint (the carpus, 515.44 mm); for the thighs, the trunk's level section midway between the hip centres' height and its foot. Measured on planes within a few degrees of these, the envelope there is star-shaped about every child's course.
4. **The composed end uses one set of actual child sections.** The terminal host plane and each child's closed cut in that plane are bound to the source used for both fitting and realization. The two transverse crossings of each adjacent pair fix the child's fork coordinates and seam plane. The plane meets the host ring in two separately measured host coordinates; their spacing from the child outline stays within the declared rails. Both buried child walls supply the seam valley. Each rail is the child's skin cut by the end plane and seam planes moved by its rail distance.
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
| `AutoMovieHumanF1RootControls` loops (arm, breast, nose), `AutoMovieHumanF1RootRails`, `ARM_RAILS_MM`, `NOSE_RAILS_MM`, `RAIL_MM` | Derived loops; fold widths |
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
| Independent fits can disagree at a connection | Every shared curve | A side attachment inherits one registered host-divider boundary in both original source charts. A composed end uses bound actual plane sections and preserves separate child and parent fork coordinates in their one seam plane. Independently observed skin verifies each owner and the exposed union. |
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

## 2026-11-21: the recorded causes, decided together

Read for this section: the handoff of PR #3604, `queue.log` and `supervisor-decisions.log` of `campaign3-formed-20261120-003626-9925030e437a`, the joint worker's record from 2026-11-20 00:11 to 02:46 (its integrated table at 02:26), the nail worker's record from 00:25 to 02:53, `realize.json` of the nail run `2026-11-19T12-31-17.207Z-realize`, and the code at the operators: `FamilyConicBody.ts` (`materialColumns`, `endMaterialRows`, `groupPhysics.read`), `FamilyConicFit.ts` (`fitGroup`, `groupStep`, `readGroup`), `AutoMovieHumanF1.ts` (`declaration`, `leafSource`, `swept`, `folded`, `attached`, `bind`), `AutoMovieHumanConicLoft.part`.

### The table

| # | Finding (numbers from the files named) | Owner | Measured cause | Same cause elsewhere | Decision and basis |
| --- | --- | --- | --- | --- | --- |
| 1 | Crotch derivative: 1245.4 s of columns, 1237.2 s (99.3 %) source preparation for 180 columns; again 1388.4 of 1398.0 s (`fit-crotch.stdout`, worker 02:17, 02:46) | `FamilyConicBody.materialColumns` | Each column rebuilds the moved stock's faces by the ordinary leaf path: three discrete station refinements (`swept`, `folded`, `part`'s midpoint insertion) and two whole lofts per face, for the leg and again for its mirror, about 6.9 s a column | Hand: 88.4 of 91.9 s columns (`fit-fan-hand.stdout` #3); foot: 19.5 s (#8) | A column differentiates the smooth map at the base state's discrete structure: each moved face is resolved at exactly the base source's stations, with no refinement (`AutoMovieHumanConicLoft.part` with refinement off, `AutoMovieHumanF1.originalSources` with held stations). The refinements are step functions of the state; a finite difference across a changed station set is a difference across a step, which [Form](../../../../.agents/skills/human/construction.md#form) forbids differentiating. The held face is used only when its emitted station array equals the base's element by element; otherwise that face takes the full ordinary path. Every nonlinear trial, acceptance and admission keeps the ordinary path. |
| 2 | Hand: six accepted restorations 9.232 to 2.342 mm; trials #4, #13, #14, #17, #20 to #22 refused, each after a cold host outline of about 97 s | `FamilyConicFit.fitGroup` with `groupPhysics.read` | A refused trial was found refused only after the whole host ring was searched. The ring/middle fork moves nonlinearly in the proposed direction; the loop's own remedy (halved scope, damping times four) was stopped after three attempts because each attempt cost a cold outline | Foot #27, #29 to #31 (pair 3, fork 0, 8.95 to 10.56 mm against 3.06 accepted) | An exact lower bound before the host ring: acceptance needs the trial's maximum below the current one while restoring, or every row within the tolerance while fitting. The mapped fork allowances and child ownership rows are read before the ring; when one already reaches that ceiling the trial is refused as partial, naming the known and unread row counts. It never admits. The loop's trust-region shrink then costs seconds a step and runs to its budget (Moré 1978; Nocedal and Wright, ch. 4: a step short enough on a first-order model is accepted). No travel cap, no new constant. |
| 3 | Foot: trials #5, #6, #9 to #11, #16 to #18, #21, #22, #25, #26, #28 crossed non-neighbour toes (little/middle, middle/big) and lost all 1536 host rows; partial child-only values printed as if complete | `endMaterialRows`, `fitGroup` | The affine model has no row for the separation of non-neighbour cuts, so its step is free to close them; the refusal comes only from the nonlinear compose | Hand (four fingers): the same rows are absent | Each non-neighbour pair of actual end-plane cuts adds one hard row: the in-plane distance at its sampled closest pair, linearized by the two material velocities along the pair's normal, kept non-negative (the signed-distance constraint of sequential convex collision avoidance, Schulman et al., IJRR 33(9), 2014). The nonlinear compose and its non-neighbour refusal stay authoritative. A refused reading states it is partial with the unread row counts. |
| 4 | Crotch start: child 136.69, host 72.72, mapped 56.02 mm; accepted 45.86 then 16.86 mm; host +14.44 mm; interrupted in derivative 7 | Group restoration from the stored leg | The stored leg starts outside the trunk's end plane (the 17:45 observe receipt refused both cuts at phase 0); restoration was progressing (two accepted steps) and stopped only by time | - | No special seed. Rows 1 and 2 make each derivative and refused trial short enough for the restoration to run to its budget in one fit. The active divider at leg s84 is not needed to decide: the measured trend of the two accepted steps is restoration, not a stall |
| 5 | Armscye: 34 of 192 master rays paired, 158 unresolved; thumb: 44 witnesses, 0 paired source closures (`campaign3-physical-20261119-231431`, `joints-survey.json`: armscye 2 closed components and 1 unowned observation; thumb 0 closed components, 39 lines without a meeting) | `bind`, `AutoMovieHumanBoundSection.conic` (`boundary`), `AutoMovieHumanJoinLoop.certifiedAddresses` | The child's original chart is asked for a unique section plane at every master clock: `conic.boundary` refuses any clock with two or no plane addresses. Where the child's first stations run along the divider, a master point lies on two of the child's section planes (the plane-incidence `g(s, t) = n(s)·(c(t) - o(s))` folds in `s`), and the uniqueness premise is stronger than the chart needs. `AutoMovieHumanBoundSection.create` already combines monotone-coordinate arcs with one C2 weight; only the address of each clock is global | Ear root, mammary | In this batch (supervisor, 2026-11-21). The address of a master clock is the connected branch of `g(s, t) = 0` through the master, followed by predictor-corrector continuation (Allgower and Georg, Numerical Continuation Methods, ch. 2): from a sample clock with exactly one certified root, each next sample clock takes the certified root nearest the secant prediction of the two previous addresses, admitted only when every other root stands more than twice as far from the prediction; walked once round, the branch must return to its seed's root; between samples the root nearest the two samples' interpolation is taken under the same separation. A branch that loses its separation (two roots coalescing at a turning point, `g_s = 0`) or does not close refuses with its clock and roots. A clock with no root refuses as the child's domain not reaching the master. Made case: a straight tube whose sections are planes square to a bent course meeting a circle twice, with the branch's closed-form station |
| 6 | Ear root and mammary: declared refusals, no independently closed divider | `AutoMovieHumanF1.declaration` (`attached` with a refusal) | No landmark surface is declared for either | Row 5 | Decided in this batch from the code path. A side join declared with a refusal fails in the engine (`realizeAutoMovieConstruction.join`, `fail`: one diagnostic, the host restored, so the plate and its ridges or the breast leave the figure), and every refused side premise stops the figure check before its mesh (`FamilyConicCaptureContext`, the `ordinary side-contact premises refused` throw), which is where the 2026-11-19 23:16 run stopped before the nail owners. The committed tree (`9925030e437a`) carried the ear root as a traced merge and the breast as a port on its stored loop. With no witnessed closed divider for either (joint worker A's 02:26 survey: tragion and the insertion marks are open marks; the footprint prior crosses the breast's protected cap), the batch keeps those stored attachments unchanged and records the absence in the code, so the figure assembles as committed. A landmark surface for each needs a witnessed closed contour on the reference's indexed mesh first; that observation is not made in this batch |
| 7 | `test_human_nail_placed_cap` 1,633 ms against 1 s (`focus.stdout`) | The unit | Scenario 4 places and reads three whole F1 declarations (production source preparation) | - | Scenario 4 moves to the figure check as a pre-admission `sourcePose` record (`FamilyConicNailSourcePose`, written to `figure.json`), with its Rodrigues expectations and 64-epsilon bounds unchanged; the unit keeps the analytic fit, the quarter turn, the stale orientation and the bad origin |
| 8 | Big toe: the proximal fold reads as a sharp ledge at its left end (`sheet.oblique.1`, px 70-100 x 480-515); its median cut turns -10, +10, +12 degrees at 11.5 to 12.9 mm | `AutoMovieHumanF1Nails.ROWS`, `toe.big` | The hallux row carries 1.38 mm, an inherited geometry value with no source, which sets the plate's thickness, its proud free edge and its cap: the plate stands three fingernail thicknesses proud of its bed | - | The published intact hallux plate for women, 0.585 mm (López Ripado et al. 2024, table 3: 0.57 right, 0.60 left). The value feeds, in `AutoMovieHumanNail`: the free edge's place (the crown one thickness proud of the skin), the sections' end one thickness before it, the course's depth (half a thickness over the shallowest floor), the cap's length and its halving, the plate body's floor, the root's covered tip, the side wall's least room, the close strip's step length, and the strip window's front extent and sampling cell (a quarter thickness). The round reads each on the big toe: the free edge before the tip, the cap, `clipped`, the strip and the frames |
| 9 | Third toe: a dark pit on the lateral fold (`sheet.oblique.1`, figure px 895-910 x 572-585, close px 895-910 x 935-945); fourth toe's fold notch (px 1625-1645 x 625-640, 985-1000) | The nail's fitted roll on the lesser toes' distal skin | `toe.middle` settles at roll -0.176 rad (objective 4.518, ten times the others', 14 passes), its section turns -14, -19, -14 degrees on one lateral side (x -4.9 to -4.4 mm); `toe.little`'s section turns -12, -27, +9 degrees at x -3.98 to -3.62 mm, crown radius down to 2.86 mm on a 8.26 mm plate | `nails.md` Open: the lesser toes' distal frames and pads | The lesser toes' distal frame and pad (body note W4) belong to the body's work (#3621), which this campaign keeps out. Recorded with its numbers; the round reports both frames again |

### Read down the cause column

Two causes carry rows 1 to 4: the derivative was taken across discrete choices it should hold fixed, and an exact refusal was computed last. Both are answered without changing any gate: the fork allowance, the host rail, the child ownership, the held sections, the raw hard rows and the terminal 0.5 mm allowance keep their values and senses. Rows 5 and 6 are one missing capability, the side join's address on its master: a global uniqueness premise where the chart needs only the connected branch. Row 8 is an unsourced constant, replaced by the published one. Row 9 belongs to the body's work.

### Checks owed by the batch

| Piece | Made case, red on the defect | Expectation |
| --- | --- | --- |
| Held stations in `AutoMovieHumanConicLoft.part` | A round tube with its extents varied steeply between knots: the ordinary part inserts midpoints, the held part keeps the requested stations | Held stations equal the request exactly; on a constant tube the held and ordinary views are equal station by station and point by point; every extent scaled by 1.01 scales every point's distance from the course by 1.01 within 1e-12 of it |
| The partial lower bound in `fitGroup` | A made reading whose known rows reach the ceiling and whose unread rows are absent | Refused as partial with its counts; a reading below the ceiling continues to the full read |
| The non-neighbour clearance row | Two circles of radius 1 at centres 4 mm apart moving toward each other at 1 mm per unit | Distance 2, derivative -2 |
| The side search's alias resolution (`AutoMovieHumanJoinLoop.aliasResolution`, row 5) | The plane `z = 0` and the plane through the x axis at 0.2935 rad; a seed on the first at its measured meeting gap 5.378e-4 mm | Resolution = tolerance + gap / sin(angle), the seed's exact distance to the line added; a second line 1e-3 mm away is aliased (the stated limit), one past the resolution is not |

### Row 5, decided 2026-11-21: a certified branch on an enclosed master

The branch rules tried first (a nearest root with a separation ratio, then the secant predictor with its second difference) estimate the step's error and do not bound it: on the made branch `sqrt(5 + 0.5 cos t)` the secant's error exceeds the previous second difference by about the third difference wherever `|s''|` grows, so either rule refuses a smooth branch or admits a wrong one. The supervisor's ruling: certify each step.

1. **The master's enclosure (engine).** The master is the traced intersection of the host's loft and the analytic divider. Its tangent and curvature vector at a point follow from the two surfaces' first and second fundamental forms (Patrikalakis and Maekawa, Shape Interrogation for Computer Aided Design and Manufacturing, 2002, section 5.3; Ye and Maekawa, Differential geometry of intersection curves of two surfaces, CAGD 16(8), 1999). Over each trace interval, `|c'|` and `|c''|` are bounded from the host's second-derivative bounds on the interval's parameter box (the loft's own spline bounds) and the divider's analytic ones, with the transversality `|n_h x n_d|` bounded below; an interval on which that lower bound reaches zero (tangent surfaces) is refused. Made cases, red first: a sphere cut by a plane (the bound contains the circle's `|c''| = 1/r` everywhere and is finite), a cylinder cut by an oblique plane (the ellipse's curvature), two tangent surfaces (refused on the tangent interval).
2. **The Krawczyk step (Human).** For a clock interval `T` and a station box `S` carried from the previous step, `g(s, t) = T(s)·(c(t) - o(s))`; `g_s` over `S x T` from `certifiedAddresses`' frame bounds (`-1 ± reach·rate` on a turning run, `-1` on a straight one) and `g` over `T` at the box's middle from the master's enclosure. The Krawczyk operator proves exactly one root in `S` for every `t` in `T` (Moore, Kearfott and Cloud, Introduction to Interval Analysis, 2009, ch. 8; Kearfott, Rigorous Global Search, 1996); the next box is its image. Inconclusive: bisect `T`. An interval shorter than the address resolution with the test still inconclusive refuses with its clock and both boxes. The only rounding term is the enclosure's own.
3. **Made cases.** The smooth branch admitted at 32 samples; two branches crossing inside one sample interval refused at the crossing clock; two close, separated branches admitted after bisection.

Status at 21:38: not implemented. The rows 1 to 4, 6 to 8 batch compiles to documentation findings only (first cycle); the focused run and the fits wait for this piece, as the supervisor ordered.

### Row 5, measured 2026-11-21: what the side masters refuse on

Read by `test/src/reference-conics/FamilyConicSideLoops.ts` on the placed f1 sources, tracing again each branch the 2026-11-19 23:14 survey recorded (`packages/human/.shots/joints-batch-20261117/side-loops-20261121-215328-9925030e437a`, `stdout-2.txt` to `stdout-4.txt`). It supersedes the plan above: neither side refuses on its child's address.

| Side | Measured | Cause |
| --- | --- | --- |
| Armscye, "2 registered closed components" | The two registered branches are one loop: the second seed's traced loop stands at most 0.514 mm from the first's (Hausdorff over 192 points, the samples' own spacing), divider radius 43.95 to 77.51 mm and trunk stations 496.3 to 626.7 mm on both. The four landmarks stand 0.10 to 1.03 mm from it. The third branch (divider radius 51.8 to 71.7 mm, winding 0) is another closed component, correctly not registered | `AutoMovieHumanJoinLoop.connected` recognizes a seed on a traced loop only within the meeting tolerance (1e-3 mm). The seed is converged to 5.4e-4 mm between the two walls, and the walls meet there at 0.31 rad, so the seed stands up to 5.4e-4 / sin 0.31 = 1.8e-3 mm from their intersection: the alias test misses, and the same loop is traced and counted twice |
| Armscye, after that | On the loop, 168 of 192 points have one arm section plane and 24 have none; no point has several. The 24 are the shoulder's top, world y 1400.7 to 1406.9 mm, x -33.6 to 10.7 mm; over the arm family's whole knot span they still have no plane | The arm's section planes do not reach the cap's top: the arm family does not run proximally far enough under its own course for the master's top arc to lie in a section of it |
| Thumb, "0 registered closed components" | The one trace runs 34.6 mm and stops at the divider's owned radius (45.209 mm). With the divider's radius widened three times, it runs 46.5 mm and stops at the hand's domain end (station 584.807, the heads' plane) near [185.4, 936.6, 454.7]. The four landmarks stand 6.36, 3.68, 10.62 and 0.83 mm off the hand's wall | The hand's wall does not carry the skin round the thumb's root: its cut by the thumb's divider is no closed curve inside the hand's domain and leaves through the hand's distal end toward the index finger |

**The branch.** No point of the anatomical armscye loop has several arm section addresses, so the uniqueness `AutoMovieHumanBoundSection.conic` asks for holds wherever a plane exists. The branch continuation, and every number it needed, is withdrawn from the batch; `conic` keeps its original rule.

**Decided (supervisor, 2026-11-21).** The armscye's count of two components is answered in `AutoMovieHumanJoinLoop.connected`: a seed is recognized on a traced loop at the trace's own resolution there, `tolerance + meeting / sin(angle)` (`aliasResolution`), measured on f1 at 1.766e-3 mm from the seed after the alias test's own walk, angle 0.2935 rad, against a resolution of 2.83e-3 mm. The island (192 of 192 points inside the loop on the trunk's chart) is removed with the hole by `AutoMovieSolidClip.trim`. The arm's reach of the cap's top and the hand's wall round the thumb's root are fit items of this batch's one queue: the arm's root stretch refitted until its sections hold the master's top arc, and the hand refitted against the registry's `thumb.root` clip, each measured before its fit (frames: `side-loops-20261121-215328-9925030e437a/fifth`).
## 2026-11-22: from reproducing f1 to generating by rule

The owner's order (relayed 2026-11-22 01:4x): matching f1 coordinate for coordinate is no longer the goal; where a more universal rule gives a more fluent curve, it is taken even where it deviates from f1, and f1 stays the plausibility check (deviation is acceptable, a broken or unnatural form is not). The hand fit stopped at that order was at 0.356 mm over its allowances (`campaign3-claude-fits-20261122-000307-9925030e437a/fit-fan-hand.stdout`, reading 38), after 9.232 at its start; its whole progress was spent reproducing f1's forks.

### Every gate and objective the fits and admissions apply today

Read in `FamilyConicBody.ts` (`groupPhysics`, `endMaterialRows`, `fitComposed`), `FamilyConicFit.ts` (`fitGroup`, `readGroup`, `sectionGroupRows`), `AutoMovieConstructionSplitCompose`, `AutoMovieConstructionComposedEnd`, `AutoMovieHumanJoinLoop` (`master`, `connected`) and `AutoMovieHumanF1.bind`.

| Gate or objective | Where | Class |
| --- | --- | --- |
| Measured rows: each member's sections against the reference's skin points (4566 rows on the hand) | `sectionGroupRows` (objective) | f1 reproduction |
| Measured fork rows: each composed fork's x and y against the reference's fork | `endMaterialRows` (objective) | f1 reproduction |
| Observed fork allowance: each fork within 0.5 mm of the reference's (`TARGET_MM`) | `endMaterialRows` (inside rows) | f1 reproduction |
| Recovery equalities: the fork footprints at the observed forks | `groupPhysics` (master rows) | f1 reproduction |
| Parent training rows: the host's end ring against the reference's rings | `endParent` | f1 reproduction |
| Held sections: the seal requires exposure of withheld reference sections | `fitComposed` (`certify`) | f1 reproduction |
| Side-join landmarks: f1's traced skin points stored in the thorax and metacarpal frames | `AutoMovieHumanF1Armscye.LANDMARKS_MM`, `AutoMovieHumanF1ThumbRoot` | f1 reproduction |
| Child ownership: each child's raw sections on its own side of its dividing surfaces | `sectionGroupRows` (inside rows) | form and topology |
| Host outline rail: the host's end ring within the shortest rail of the composed outline | `endMaterialRows`, `SplitCompose.derive` | form and topology (engine premise) |
| Raw admissibility: conic tangent meetings, the first ring before the plane | `groupPhysics.readStock` (hard rows) | form |
| Non-neighbour clearance | `endMaterialRows` (hard rows, this batch) | topology |
| Neighbours cross exactly twice; non-neighbours do not overlap; seam planes cross the ring twice | `ComposedEnd.create`, `SplitCompose.derive` | topology |
| Protected distal tail: the stored digit unchanged past its mark | `tail.check`, `K.tailPolicyFault` | form (continuity with the kept part) |
| Star shape about the course; regular charts; rails inside domains; no folded blend | loft and join admission | form |
| Side joins: one closed master component; the child's unique plane address; column gap within 1e-3 mm | `connected`, `bind`, `columnGap` | topology |

### Generated by rule instead

| Joint | Generated from the person's centres and frames | Fairing replaces the reproduction residual |
| --- | --- | --- |
| Finger row, toe row | Each child's root stretch is its own tube continued proximally to the heads' plane (`FamilyConicClosure.continued`), from its metacarpal or metatarsal head's centre on its own course. The forks are the children's own crossings in the parent's end plane and the valleys the deeper of the two walls (both already derived by `ComposedEnd`); nothing is fitted to the reference's forks. The web's floor follows from where the neighbouring tubes cross; a published proportion is its plausibility check (the normal web slopes at about 45 degrees from the metacarpal head to mid proximal phalanx and covers about two-thirds of the proximal phalanx: Braun, Trost and Pederson, Syndactyly release, Semin Plast Surg 2016;30(4):162-170, a graded review; the figure first taken from Kozin and Zlotolow 2015 was not located in the pages read and is withdrawn, amendment C) | The root stretch's free values minimize a discrete curvature-variation energy (Moreton and Sequin, Functional Optimization for Fair Surface Design, SIGGRAPH 1992; Moreton's thesis on minimum variation curves, UCB CSD-93-732): over each section ring's samples and over each phase's line along the stations, the sum of `((k[i+1] - k[i]) / ds)^2 ds` of the discrete curvature `k`, with the distal tail's jets fixed. Constraints keep every form and topology gate of the table |
| Crotch | Each thigh's root stretch from the hip centre on its own course, parted by the median plane; the trunk ends at the registry's level plane midway between the hip centres' height and its foot | The same energy on the thigh's root stretch and on the trunk's last sections, which hold the composed outline within the shortest rail |
| Host end ring (all three) | The parent's own section at the registry's plane (heads, hip) | Where the ring stands farther than the shortest rail from the composed outline, the parent's last sections are faired toward the outline, not toward the reference |
| Armscye, thumb root | The loop as the parent's skin cut by a surface fixed in the bone's frame by a law of the person's measures (construction.md, Ports: a plane by its tilt and offset in the thorax's frame, or a cone about the child's bone), in place of a surface through f1's traced landmarks; the landmarks become its plausibility check | The child's root stretch faired as the digits' are, from the loop outward |

### Against the branch-surface literature

Gabrielides, Karavelas, Ginnis and Kaklis (Computer-Aided Design 39:639-651, 2007; abstract read) build a one-to-many branch by skinning each branch, trimming the skins, and filling the remaining multi-sided hole with G1 quadrilateral Gordon-Coons patches on shape-preserving guide curves. Wang (CAD 37, 2005) holds closed feature curves away from the crotch and the armhole and fills between them with Gregory patches. The composed end is the skinning-and-trimming half: the children's own sections are composed in one plane and trimmed at seam planes, and its bands are the transition strips. What the literature fills as an n-sided patch is, here, each fork's corner where two bands and the host meet. That corner is the one place a rule alone does not fix a shape, and it is where fairing belongs. MakeHuman and its descendants keep one fixed template topology and morph it, and SMPL and MANO learn linear blend shapes from scans; both reproduce data at the branch rather than generate it by rule, so they inform plausibility, not construction.

### Plan

Before any code: the gates of the first table classed f1 reproduction leave the group fit (they become a deviation report), the form and topology gates stay as constraints, and the objective becomes the discrete curvature-variation energy above. The Maratos second-order correction and the continued fit after the seal (saved, not compiled) are held until this plan is decided, since both serve the reproduction objective.

### Amendments, decided 2026-11-22 (supervisor)

**Evidence of the route left.** The stopped hand fit's last accepted reading (38) had its largest row at 0.356 mm, down from 9.232: every row is a signed excess over its allowance (a fork's row is its distance to the reference's fork less 0.5 mm), so the largest fork stood 0.856 mm from the reference's, 0.356 mm past its allowance, and the route was converging when it was left. That is evidence, not a reason to go back.

**(A) What is faired.** Only what the rules do not fix. The root stretches stay their own continued tubes from the joint centres, and the composed end's crossings, valleys and bands stay as the engine generates them. The fairing variables are the junction's own controls:

| Joint | Fairing variables | Rings faired | Phase lines faired |
| --- | --- | --- | --- |
| Finger row, toe row | Each child's knots inside the junction window: from the parent's end plane to its first stored knot (the band's own stretch), whose values the continued tube only starts | The child's rings at every source station in the window | The child's lines at the section's guide phases (the four extremes and the quarter shoulders) over the window and two stations past it each way |
| Crotch | The same on each thigh; the trunk's last sections where its ring exceeds the rail | Thigh rings in the window; the trunk's rings over its last 40 mm | Thigh lines as above; the trunk's lines at its guide phases over the same 40 mm |
| Armscye, thumb root | The child's knots from the loop to its first stored knot | Its rings there | Its guide-phase lines there |

**(B) The energy and its discretisation.** For a sampled curve with vertices `p_i`, edges `s_i = |p_{i+1} - p_i|` and discrete curvature `k_i = theta_i / ((s_{i-1} + s_i) / 2)` (the turning angle over the vertex's half edges), the minimum-variation energy (Moreton and Sequin 1992) is `E = sum_i ((k_{i+1} - k_i)^2 / ((s_{i-1} + s_i) / 2))`, the discrete `integral (dk/ds)^2 ds`. Scaled by `lambda`, `k` goes as `1 / lambda` and the measure as `lambda`, so `E` goes as `1 / lambda^3`; each curve's term is multiplied by the cube of its own length, which makes it scale-free, so a larger person weighs the same. Rings are sampled at the 64 phases of the section's own polar chart; lines at the source's stations. A made case fixes the minimum: a tube from a circle of radius 10 mm to one of 6 mm over 40 mm has zero energy with a straight blend of its radius (circles and straight lines have constant curvature), a bump on the blend raises it, and the same tube doubled in size has the same energy.

**(C) The web's depth.** The Kozin and Zlotolow figure is withdrawn (unverified in the pages read). The web's floor is where the neighbouring continued tubes cross; its plausibility check is the f1 reading already in this note (half each web floor: fingers 2.4 to 4.4 mm, toes 0.7 to 1.8 mm), stated as an estimate in a share of the digit's breadth until a published proportion is read in its source.

**(D) The arm's cap and the thumb's root.** Both fall under the same rule. The arm's root stretch is its own tube continued from the glenohumeral centre proximally along the humerus's line, far enough that every point of row 5's master loop has a section plane of the arm (the 24 cap points stand behind today's first knot at 24 mm). The thumb's root stretch is its own tube continued from the carpometacarpal centre through the thenar to its stored first knot. Each then meets row 5's surface by the shared-loop join: the master is the host's skin cut by the divider, and the child's continued tube is cut by the same surface, so the loop lies on both by construction and the column gap is the two cuts' agreement.

**Acceptance (owner, 2026-11-22).** Deviation from the reference does not matter; naturalness does, judged by the supervisor on frames. No residual or deviation number is a pass or fail gate anywhere in this batch: every residual and deviation is reported as a diagnostic only. The form and topology constraints stay (no crossings, no folds, one closed manifold, star-shaped sections, rails inside their domains), because a broken surface is never natural. Each joint is accepted on frames after its fit and again in the round: clay, curves over clay and owners from the front, the back, both obliques and the joint's own close views (the armpit from below, the hand's roots from the palm and the back, the toes' webs from above, the crotch from the front, the back and below), each beside the reference. The fairing energy is the means to natural curves and is tuned toward no number; a fair surface that looks unnatural sends the cause back to the rule or the region, never to a weight.

**Amendment D, built.** Measured on the arm's course widened 120 mm back (`side-loops-20261121-215328-9925030e437a/stdout-6.txt`), the 24 cap-top points of the armscye's loop stand at arm stations 17.3 to 23.7 mm, just before the stored first knot at 24. `AutoMovieHumanConicLoft.continued` carries a family back to a station as its own tube (its first section unchanged along its course); the declaration carries the arm and the thumb back to their courses' starts (the humerus's lead, 60 mm proximal of the shoulder joint; the thumb's carpometacarpal joint). The thumb's master still has no closed loop on the hand (the hand's wall does not reach its root's landmarks): carrying the thumb back does not change that cut, which is the hand's.

### The breast's footprint by rule, decided 2026-11-22

The supervisor reopened row 6's breast under the fairing regime: on `case-length-thigh-0.9/fold.left` the stored port shows no inframammary fold, only a blotched smear with stair-stepped shading where the reference shows a crisp fold arc under an overhanging lower pole. The refusal recorded in row 6 rested on the lack of an independently witnessed closed divider on the reference, which was a reproduction requirement; the footprint is now generated by rule (`AutoMovieHumanF1Mammary`).

| Extreme | Placed from | Basis |
| --- | --- | --- |
| Up | The line from the midclavicular point (midway between suprasternale and the shoulder point, ESTIMATE of the clavicle's middle) to the bust point, `CSL / CNL = 100.5 / 192.5` of the way | Demiroz et al. 2021 (J Plast Surg Hand Surg 55:13-16; 88 women, standing): CSL 10.2 and 9.9 cm, CNL 19.1 and 19.4 cm |
| Down (the fold's lowest point) | 0.590 of the way from suprasternale down to the umbilicus (de Leva's omphalion), the surface distances taken as heights (ESTIMATE of the projection) | Fujisawa et al. 2021 (J Plast Surg Hand Surg 55:21-24; 145 women standing): the thorax anthropometric position index 0.590 +- 0.038. Xiphion's height, decided first because the fold is held at a skeletal level, was measured 3.8 mm above the breast's course start on f1 (the focused run of 2026-11-22 03:44 refused the footprint with a negative reach): the xiphisternal joint is the 6th and 7th cartilages' sternal end, and the ribs descend laterally, so at the midclavicular line the fold stands well below it |
| Medial | The lateral sternal border, `25.8 / 2 / 133.1` of the sternum's length (suprasternale to xiphion's height) off the median plane | Atesoglu, Deniz and Uslu 2018 (Folia Morphol 77:489-497; 103 women, MDCT): corpus sterni 23.8, 25.8 and 27.8 mm wide at the 2nd-5th notches, manubrium and corpus 133.1 mm long |
| Lateral | The anterior axillary line, through the armpit's front fold point (the armscye's landmark) | UCLA Health, Breast anatomy |

Between its extremes the footprint is four quarter ellipses about the breast's course (ESTIMATE). Reported, not used: IR (nipple to fold, 7.3 and 7.4 cm) and the base width (13.5 +- 1.4 cm, Vietnamese women; 14.3 +- 1.4 cm, Chinese women; full texts not read).

1. **The loop** is the footprint dropped on the trunk's skin, each point along the trunk's radius in its own level section (as the armscye's loop is dropped), sampled at 240 clocks and joined by a natural cubic over three turns, so it is C2. The footprint carried along the breast's course was tried first: on f1 its line at clock 4.24 rad (low and lateral) stood 0.4 to 64 mm outside the trunk over its whole search, since the base wraps round the chest's curve at the anterior axillary line while the course points out of its middle (focused rerun of 2026-11-22 04:30, `diagnose-mammary`).
2. **The breast is carried back** (`AutoMovieHumanConicLoft.continued`) to 2 mm behind the loop's deepest station, so every loop point has a section plane of the breast, and its proximal section inherits the loop (`AutoMovieHumanBoundSection.conic`, as the armscye's and the thumb's do).
3. **One shared-loop merge** replaces the port and its band. Every length of the fold is a share of the footprint's height, so a smaller or larger person gets the same shape (supervisor, 2026-11-22; ESTIMATE, judged on the frames): rolling radius 0.03 over the lower third, a crisp fold under the overhanging pole, 0.18 over the upper half, where the upper pole runs onto the chest, their mean between; reach 0.0075, cap 0.3, the bound section's reach 0.04 (on a 140 mm footprint 4.2, 25.2, 1.05, 42 and 5.6 mm).
4. The trunk is refitted with the footprint's inside left out, and the breast from the loop outward, under the fairing regime (fit queue). The mound's form past the join stays the body work's (#3621).

### Terraces on the medial heel (supervisor's finding, 2026-11-22): a general cause, fixed in this batch

`case-length-thigh-0.9/foot.back.clay.png` of round `2026-11-17T10-34-23.195Z` shows stair-stepped bands along the medial heel and sole (px 250-420 x 430-560) that the reference does not have. Read only, from the frames:

- f1's own figure shows them too, at the same place (`2026-11-17T08-45-34.287Z/case-f1/foot.back.clay.png`, px 265-420 x 600-790), so no case's length change makes them.
- Their spacing is about 10 px in a frame where the foot's 240 mm fill about 550 px, so about 4.4 mm: the leg's layer pitch (`test_human_construction_topology` scenario 6 holds rings round a turn within the declared 4 mm on the skin). The heel stands on the outer side of the leg's ankle turn, where the rings fan out, and the skin there turns along the course on a radius of a few centimetres, so each 4 mm band is a flat facet turned several degrees from its neighbour: the clay's shading shows each band.
- Owner: the leg family's sampling round its ankle turn, on the leg's own course. This batch touches the foot's split at the ball (its host ring and the toes' root stretches), not the heel; the leg's stations and course are unchanged by it.

The cause is not the foot's form but the loft's layer rule: a layer in millimetres on the skin bounds a band's length, not its turn, and it acts wherever a family's skin turns along its course (the ankle, the knee, the elbow, the wrist, the arm's and the thigh's roots), so it is fixed everywhere at once (supervisor, 2026-11-22). Every family's stations are now halved until no band's two half chords meet at more than FOLD.turn (4 degrees, the turn tolerance the declaration already held over the breast's fold and the lips) at 192 phases: the chord-angle tessellation tolerance (Piegl and Tiller, The NURBS Book, ch. 9), AutoMovieHumanLayerTurn.refine, with the made case 	est_human_layer_turn (a tube bent a quarter turn: the 8 mm rings turn past the bound round the corner, the refined ones do not, the straight run keeps its rings). The figure's vertex delta is reported with the round.

**Fit flow per joint (2026-11-22).** Fit the group with `FamilyConicBody --joint-group=<owner> ... --emit`. An admitted group's families are written in place into their stored modules (knots and value rows). Before each write the module is copied, with its SHA-256, into the run's folder (`pre-emit/`), and the log names both hashes. Then the figure is captured: clay, curves over clay and owners, from front, back, both obliques and the joint's close views, beside the reference. The frames go to the supervisor. A rejected fit is undone by copying the pre-emit snapshot back. It is never undone from git, because the tree's modules carry uncommitted work.

## 2026-11-23: the rule-basis audit's decisions, applied

The full basis table of every rule, coefficient and constant is [rule-basis.md](rule-basis.md), written by the rule-basis audit under the owner's acceptance principle (issue #3151): each one cites a primary source with its definition, derives from the person's own fields, or is marked ESTIMATE with its reason. The supervisor decided its findings in four batches; this batch applies them.

| Rule | Was | Now | Basis |
| --- | --- | --- | --- |
| The fold's level (breast footprint, down) | Fujisawa's index of suprasternale to an umbilicus at a mixed-sex share of mid-hip height, surfaces taken as heights | The point on the trunk's anterior median skin line at 0.590 of the surface distance from suprasternale to the person's umbilicus (the navel site, ANSUR II omphalion); without a navel site, de Leva's women's 181.5 / 529.3 of mid-hip to suprasternale | Fujisawa et al. 2021 measure along the skin to the umbilicus's superior border (the few millimetres to the navel's centre an ESTIMATE); 0.590 is the population mean, since the index depends on age (Table 2: 0.582 under 50, 0.603 from 50) and the person has no age field; cross-checked against ANSUR II waist front length, women 355.1 +- 23.9 mm sitting |
| Xiphion's height | de Leva through a mixed cervicale | 1 - 142.5 / 529.3 of mid-hip to suprasternale | de Leva 1996, Table 4, women |
| The sternal border (medial extreme) | 25.8 / 2 / 133.1 | 27.8 / 2 / 133.1 | Atesoglu et al. 2018, Table 1, women, the corpus at the 4th-5th notches, where the breast's medial extreme lies; bone breadth on straightened MDCT |
| The upper border (up extreme) | CSL / CNL of the way along the oblique midclavicular-to-bust line | CSL / CNL times the person's midclavicular-to-nipple distance, straight below the midclavicular point | Demiroz et al. 2021, Fig. 1 |
| The fold's radius bands | lower share over 120 to 240 degrees | over 90 to 270 degrees, mean at 75 and 285 | Boutros et al. 1998; Muntan et al. 2000: the fold's zone of adherence runs from the sternum to the midaxillary line; the radii stay ESTIMATE |
| ISO 8559-1 5.3.8 under-bust site | the stored f1 mammary loop's lowest station | the generated footprint's fold level (the row above); no calibrated girth enters, so no circularity | ISO 8559-1 5.3.8 |
| Fingernail thickness | Bellinato's five, sexes pooled | Szymoniak-Lipska et al. 2021, women: index 0.405, middle 0.39, ring 0.37, little 0.355 mm; thumb 0.41 (ESTIMATE by Bellinato's thumb-to-index ratio); the fold and the lesser toes 0.38 (the women's mean, ESTIMATE) | Front Med 2021;8:686470 |
| The nails' roll spread | 0.145 rad, seven tilts on f1 (F1-FITTED) | 0.183 rad, the rms of Clarke et al. 2012's normal axial rotations of the fingers; the toes by the same value (ESTIMATE) | abstract only |
| The plate's wrap bound | Ha 2024 as a bone height | the same shares over the skin's height, a looser bound (ESTIMATE) | Ha et al. 2024 |
| The lesser toes' aspect | 8.80 / 5.68 as a source | the same value, ESTIMATE: Palomo-Lopez measure matrix width over bed length, not plate width over fold-to-tip length | Palomo-Lopez et al. 2020 |
| The layer turn's 4 degrees | Piegl and Tiller ch. 9 | the angular deflection a mesher bounds (Open CASCADE mesh guide); 4 degrees ESTIMATE, the turn below which flat-shaded bands stop reading as facets | |
| The mound's base exponent 0.17 | an unnamed CT study | Huang et al., Med Phys 2011;38(4):2180-2191, dedicated breast CT, prone; ESTIMATE, per-cup values read from a summary | |
| The digits' dome shares 1.5, 1.1, 0.8 | unlabelled | F1-FITTED, provisional, to #3205 | |
| The armscye's and the thumb root's landmarks | f1's traced points | F1-FITTED, provisional. The armscye's law needs fields the person does not carry yet: the axilla's height, ANSUR II Interscye I and the acromion (#3187); with them the front fold point stands on the anterior axillary line at the armpit's level (ISO 8559-1 3.1.13), the back fold point half Interscye I along the back from the median line, the shoulder point over the acromion. No published proportion places the thumb root's skin | |
| The fairing energy | rings at 64 phases, unsigned turning, unweighted; the parent window 40 mm | each ring sampled at the figure's phase count for its girth (AutoMovieHumanConicLoft.phaseCount), its curvature signed in its section plane (Moreton's planar minimum variation curve; an inflection's step through zero counts in full), weighted by its share of the window's stations (a discrete integral, independent of the sampling); lines keep the unsigned turning; the parent window a share of the parent's end ring's mean reach | Moreton 1993, UCB/CSD-93-732 |

### Joint widths as shares (rule-basis batch 2, item 5)

Every joint width that stood in absolute millimetres is now a share of its own joint's measured size, applied to the person's own size; each share is frozen as a named constant equal to the former millimetres over f1's size, read by `test/src/reference-conics/FamilyConicJointSizes.ts` on f1 as stored (`packages/human/.shots/joints-batch-20261117/joint-sizes-20261123-0103/sizes.json`). All are ESTIMATE; f1 keeps its former widths except where one share serves several children.

| Width | Size it is a share of (`AutoMovieHumanConicLoft.meanReach`, the mean of a section's four guide reaches) | f1's size, mm | Share |
| --- | --- | --- | --- |
| Finger row rails (`FANS.arm.rail`) | each finger's root reach | mean 10.79 (pinky 7.56 to index 15.15) | 3 / 10.79; f1's rails now 2.10 (pinky) to 4.21 (index) mm |
| Toe row rails (`FANS.leg.rail`) | each toe's root reach | mean 10.74 (little 7.63 to second 17.96) | 3 / 10.74; f1's rails now 2.13 to 5.02 mm |
| Crotch rails (`CROTCH_RAIL_SHARE`) | the leg's root reach | 117.17 | 6 / 117.17 |
| Wrist band rail (`WRIST.rail`) | the hand's root reach | 26.04 | 10 / 26.04 |
| Armscye fold radius, cap, reach and bound reach (`ARMSCYE_SHARE`) | the master loop's extent along the trunk's stations, read lazily from the traced contact | 130.40 (496.30 to 626.70) | 6, 30, 6 and 6 over 130.4 |
| Ear root fair and chord (`EAR_SHARE.root`) | the plate's root reach | 8.07 | 4 / 8.07, 0.5 / 8.07 |
| Helix and antihelix fair and chord | each tube's root reach | 1.80, 1.60 | 1 and 0.25 over each |
| Nostril rim (`NOSTRIL_RIM_SHARE`) | the hollow's root reach | 5.02 | 1.5 / 5.02 |
| Fairing parent window (`FamilyConicBody` `FAIR_WINDOW_SHARE`) | the parent's mean reach at its composed end | hand 28.09, leg 33.85, trunk 150.95 | 40 over each |
| Thumb chord (`THUMB_CHORD_MM`) | the thumb's master loop's length | not measurable: the thumb's master is refused on f1 (`sizes.json`, "0 registered closed components") | stays 0.5 mm until the loop closes |

### Flattened rules (rule-basis batch 5)

The owner's order: search wider, else flatten. From rule-basis.md, "Measured on an open asset" (the MPFB2 base mesh, commit 9de0707f, CC0, method stated there) and "Flattened rules": every toe's nail width share 0.73 and width over length 1.48 (lesser toes) and 1.14 (hallux), Jung's women's finger values carried by the asset's toe-to-finger ratios; one dome share for all five fingers, 1.35, and one for the toes, 1.0, the asset's means (good to about 0.3). The thumb root's divider is the plane square to the first metacarpal at half its length from the carpometacarpal joint, fixed in the metacarpal's frame (`AutoMovieHumanF1ThumbRoot.divider`, ESTIMATE); its four search seeds stand on that plane at the thumb's own mean reach there, and it owns the skin within that reach of the plane's centre or of the thumb's course. The traced landmarks (`LANDMARKS_MM`) are its plausibility check. The hand's wall carries the thenar up to that plane and the thumb's root stretch starts there, as decided for the thumb (option a). Whether the hand's skin cut by that plane closes within the owned reach is read on the figure's first run.

### The carried root stretch, corrected (2026-11-23)

`test_human_construction_topology` (scenario 6, now printing the loft's diagnostics) found f1's arm unloftable: from 2 to 6 mm along its carried stretch the phases did not advance and one half extent fell to -0.20, -1.25 and -3.26 mm (the course outside its own section). The cause is amendment D's `AutoMovieHumanConicLoft.continued`: a knot at the course's start with the first knot's values makes the natural cubic swing between two equal values, so the carried stretch is no tube at all, and the stored stretch past the first knot moves with it. A natural cubic's second derivative is zero at its end, so its continuation by the end's tangent line is C2, and the natural cubic through the stored knots and one more knot on that line is exactly that continued curve: the knot at `from` now carries each field's value on its first knot's tangent line. The stored stretch is unchanged exactly and the carried stretch is the fields' own trend (`test_human_conic_loft_continued`: a linear taper continues its line; a bent tube's stored stretch is unchanged within 1e-9 mm). It serves the arm, the thumb and the breast alike.

Measured on that change (rerun of `test_human_construction_topology`, `campaign3-claude2-focus-20261123-011336-9925030e437a/rerun-continued`): the tangent continuation over the arm's whole 24 mm crosses its outlines (station 0: front -35.67 over -5.12 mm, side -154.52 over -23.14 mm; still crossing at 7.46 mm), since the arm's fields climb steeply at their root. So a part on its host's side is carried back only as far as its join needs: past its loop's shallowest point on its own course by its fold's reach on the part's side, itself a share of the joint's size, so the carried reach is derived and has no constant of its own (the supervisor rejected a first 2 mm, an absolute length without basis). The arm past the armscye master's shallowest arm station by `ARMSCYE_SHARE.reach` of the master's extent (6 mm on f1; the master traced once on the trunk's own source, `armscyeContact`, and reused by the bind; on f1 the cap's top points stand at 17.3 to 23.7 mm), the thumb past its root's plane by `THUMB_CHORD_MM` (`thumbFrom`), the breast past its loop's deepest station by its fold's reach (`FOLD_SHARE.reach` of the footprint's height).

## 2026-11-23: the fairing fit's cost, measured, and its redesign

The owner's ruling: fitting a few conic-loft curves is light work, so a derivative of minutes or a fit of hours is a defect of the method, not a cost to be waited out. Measured on bounded runs (`FamilyConicBody --joint-group=... --readings=3`: the start, its first derivative and the first trial, under `node --cpu-prof`; `packages/human/.shots/joints-batch-20261117/campaign3-claude2-profile-20261123-1627-9925030e437a`, after the lazy side-join contact below).

### What one reading does today

| Piece | fan.hand (4 fingers, 344 free values) | fan.leg (5 toes, 504 free values) | What it realizes |
| --- | --- | --- | --- |
| Start: restoration of the raw inequalities | 17.4 s | 38.6 s | the fields only (QP iterations) |
| Reading 1 (start) | 134.6 s, of it the cold outline about 100 s | 6.0 s (outline refused) | the whole body's sources (`groupSources`: `assemble` and `constructionBareFrom` declare and loft every family of the figure, some 40, to read four or five), the end-plane cuts, the composed end with its host-ring search over 1,536 rows |
| Derivative | 74.8 s (594.9 s before the fix) | 17.9 s (838.1 s before) | one column per free value: the figure re-placed (`replaceNeutralOriginal`) and the whole tree declared again for one moved face (`originalSources`), that face lofted at its held stations (`part`), a full-source reader, then 1,757 (hand) and 1,691 (leg) site velocities read on the loft |
| Affine step | 53.2 s | 14.6 s | one QP over 13,304 (hand) and 27,184 (leg) hard rows: the factor's updates alone 47.0 s on the hand |
| Trial | 30.2 s (stock 28.7 s, cuts 7.0 s, outline 4.1 s, refused) | 76.2 s (stock 22.5 s, cuts 6.3 s, cold outline 53.0 s) | the whole body's sources again, the cuts, the composed end |

Where the CPU goes on the hand's run (358.6 s): declarations 108.8 s (lofting sources 102.6 s, of it the layer-turn refinement 24.2 s and the sweep refinement 12.5 s), whole-body declarations 58.2 s, the derivative's columns 57.0 s, the QP factor 47.0 s, the garbage collector 46.9 s, and the engine's snapshot comparison of each section-source layer on every read (`AutoMovieLoftSectionSource` `fits`/`same`) 34.1 s.

The first fix, already saved: every derivative column declared the moved face alone, but the declaration still made the breast's footprint loop eagerly, and with it the trunk's whole source as the subset's fallback; the new armscye contact would have traced the master in every column too. A side join's loop is now made only when its part's source is declared (`declares`), and the breast's fold widths are read lazily. That alone took the derivatives from 594.9 and 838.1 s to 74.8 and 17.9 s. It does not touch the design's real cost.

### What the energy and the constraints need

- The fairing energy is defined on rings at the window's stations and on guide-phase lines through the same stations. At a station a loft's ring is its section exactly (the derived outlines interpolate through the stations), so every residual is a 2D section of the family's own fields at that station (`AutoMovieHumanConicSection.resolve` and its chain) carried by the course's fixed frame: a few thousand 2D points, milliseconds.
- A field at a station is the natural cubic through the knot values, linear in them: its derivative with respect to one knot value is that knot's cardinal spline at the station, fixed while the knots are fixed. A column is therefore one 2D section resolve per station of the window, not a declaration and a loft.
- The raw admissibility and the child ownership rows are already read on the fields (0.4 s together).
- The composed end's premises (neighbours cross twice, non-neighbours stay apart, the host's ring within the shortest rail) are read in the end plane on each child's cut. The cut needs only the child's sections at the few stations that bracket the plane and the same natural cubic along the stations between them, then 2D polygon operations on a few hundred points.
- The full declaration, loft, compose, shared loops and seal are needed once, to admit the result.

### The redesign (plan, for decision; nothing coded)

1. **A junction model per group** (new `test/src/reference-conics/FamilyConicJunction.ts`): for each member, the free knot values of its window, the fixed course frames and cardinal-spline weights at the window's stations and at the stations bracketing the end plane, the host's end ring (fixed when the host is not varied). Evaluation maps values to fields (a sparse linear map), fields to 2D sections, sections to world points.
2. **Energy and gradient on the curves.** The fairing residuals as today (`FamilyConicFairing`), with their Jacobian by forward differences of the 2D section only (one resolve per station per column) or by the conic field jets the engine already has (`AutoMovieConicFieldJet`). The Jacobian is block-sparse: a member's values move only its own rings and lines (Nocedal and Wright, Numerical Optimization, 2006, ch. 8 on sparse finite-difference Jacobians; the reduced-space view of ch. 15: only the junction's controls are variables).
3. **Constraints on the cuts.** Each child's end-plane cut from its bracketing sections; hard rows linearized by the same columns: neighbours' overlap depth kept positive at both forks (a row the step model lacks today, below), non-neighbours' clearance (as now), the host ring within the composed outline's shortest rail, raw admissibility and ownership (as now). Rows are sampled at the figure's phase pitch, a few thousand in all, so the QP has some 350 to 500 columns and a few thousand rows.
4. **Admission only at the end.** The accepted state is declared, lofted, composed and sealed once by the existing path (`groupSources` restricted to the group's own faces, which removes the whole-body declaration from it as well); a refusal there returns to the junction model with the refused premise added as a row.
5. **Expected cost.** About 5,000 section points per evaluation and one per station per column: one trial in well under a second, one gradient in a second or two, one admission once (tens of seconds today, less with the faces restricted). The made case before any fit: four made tubes meeting in an end plane (`test_human_junction_model`), energy, Jacobian and constraint rows checked against a full loft at its stations to 1e-9 mm and timed under a second.

### The hand's repeated refusal

Readings 3, 4 and 5 of the hand were each "partial: common rows only, the outline refused" with the same reason, "the sections of finger.pinky and finger.ring cross 0 times in the end plane, not twice": the step pulled two neighbours apart in the end plane. The step model holds non-neighbours apart (row 3 of 2026-11-21) but has no row that keeps neighbours crossing; only the composed end's nonlinear admission refuses it, after the trial's 30 s. The fairing energy has no term for the shared web either: it rounds each root ring alone, and on the pinky and the ring it rounds away the sides that overlap. So the linearized step moves them apart, the nonlinear compose refuses, the trust region shrinks, and the same refusal repeats. The redesign gives each neighbour pair a hard row at each fork, its overlap depth kept positive and linearized by the same columns (the signed-distance row of sequential convex collision avoidance, Schulman et al., IJRR 33(9), 2014, used with the opposite sign), so the step model sees the crossing it must keep.

### The carry-back limit

The 2 mm first set behind the loop is gone (2026-11-23, above): a part is carried back past its loop's shallowest point by its own fold's reach on its side, a share of the joint's size: the arm by `ARMSCYE_SHARE.reach` of the master's extent (6 mm on f1), the thumb by `THUMB_CHORD_MM`, the breast by `FOLD_SHARE.reach` of its footprint's height. It is derived from what the join needs, so it has no constant of its own.

### The redesign as built (supervisor's approval with amendments, 2026-11-23)

- **Every reading on the junction's own curves.** `FamilyConicBody` `junctionModel` with `test/src/reference-conics/FamilyConicJunction.ts`: the start, every trial and every column read each child's rings, guide lines and end-plane cut from its fields at fixed stations (the engine's native chain of the resolved section, `AutoMovieHumanConicSection.chain`, read by `AutoMovieViewChain.read` and carried by `AutoMovieHumanConicLoft.axis`), with no declaration and no loft. The cut is read on the natural cubic along the station through the four stations of the base view that bracket the plane. The host's end ring is the host's section at its end station, read the same way.
- **The visible arc only.** A ring's phases whose cut point lies inside a neighbour's cut at the end plane are trimmed by the compose and are never skin, so the ring's energy is read on its visible runs only (open curves); rounding the hidden arc was what pulled pinky and ring apart in readings 3 to 5. The masks are the base state's, held for its columns.
- **Neighbours stay crossed.** Each neighbour pair carries one hard row, its overlap depth (the deepest point of either cut inside the other) kept non-negative: the signed-distance row of sequential convex collision avoidance (Schulman et al., IJRR 33(9), 2014) with the opposite sign, linearized by the two points' velocities along the depth's direction. Non-neighbours keep their signed separation non-negative, the host ring its distance to the composed outline (the cuts' points outside every other cut) within the shortest rail. An outline whose neighbours do not cross exactly twice is refused as before.
- **Block-sparse columns.** A member's rows read its own values only, so each grouped column moves one value of every member at once (Curtis, Powell and Reid 1974; Nocedal and Wright 2006, ch. 8); the pair and host rows take their rates from the members' own point velocities by the chain rule. A gradient costs as many grouped columns as the largest member has free values.
- **Admission once.** The accepted state is declared, lofted, composed and sealed by the existing path, and `groupSources` now declares only the composed end's own faces and its host (`AutoMovieHumanF1.constructionOf`) instead of the whole body. A refusal there names its premise, which joins the junction's rows once; a second refusal on a new premise goes to the supervisor.
- **Made case.** `test_human_junction_model`: four round tubes meeting an end plane; every ring and line point equals the full loft's at its station within 1e-9 mm, each cut is its circle within 1e-9 mm, a reading makes exactly one section per member and distinct station (the provider's count), and neighbours 8 mm apart cross twice while tubes 16 mm apart do not. No wall-time threshold is asserted; times are reported with the profile.
- **Not changed in this batch.** The engine's snapshot comparison per layer read (`AutoMovieLoftSectionSource` `fits`) and the layer-turn and sweep refinements now run only where a source is lofted, which the readings no longer do: once at the start's base sources and once per admission. Their cost is read again in the new profile.

### The carried stretch held (2026-11-23, after the rerun)

The tangent continuation, carried only past the loop by the fold's reach, still crossed the arm's outlines (`rerun-carry`: station 11.30 mm, side -76.99 over -29.90 mm; to 14.29 mm), because the arm's stored fields climb steeply from their first knot. No continuation inside one natural cubic both keeps the stored stretch and stays star-shaped there, so the carried stretch now holds the first knot's section (`IAutoMovieHumanConicLoft.IFamily.carried`, applied by `AutoMovieHumanConicLoft.reader`), with the stored stretch the stored natural cubics unchanged. The fields' slope changes at the first knot, inside the side join's bound sections, which replace the carried stretch in the skin (`AutoMovieHumanBoundSection.conic`, from the loop to the protected mark); the hold serves the loop's section planes and the part's own admission. `test_human_conic_loft_continued`: a constant tube's circles, a taper held at its first section, a bent tube's stored stretch unchanged within 1e-9 mm.

**The carried stretch's ease (accepted 2026-11-23).** A plain hold put a slope break at the stored first knot, and the engine's outlines, natural cubics through the station samples, swung across it until the layer-turn refinement found no chain point between two stations ("the points' phases do not advance within one turn"). The ease is a quadratic Hermite blend over the stored first knot interval `L = k1 - k0`, with no cubic term. Each field `f` with the value `v` and slope `d` of its stored natural cubic at `k0` is, for `s < k0`, `v + d L g((s - k0) / L)` with `g(x) = x + x^2 / 2` on `[-1, 0]`, and `v - d L / 2` below `k0 - L`. The conditions it meets: `g(0) = 0` and `g'(0) = 1` (value and slope continue the stored cubic at `k0`, so the field is C1 there; the natural cubic's second derivative is zero at its end, so only the second derivative `1 / L` of the blend steps); `g'(-1) = 0` (it meets the hold with zero slope, C1 again); `g' = 1 + x >= 0` on the interval, so the blend is monotone and stays between `v - d L / 2` and `v` with no swing. `L` is the family's own first interval, so the ease has no constant of its own. `test_human_conic_loft_continued` checks the closed form on a taper (4.175, 4.135 and 4.055 mm at 1, 3 and 5 mm).

**The fit's start without the whole body (supervisor, 2026-11-23).** `FamilyConicDivide.composition` declared the whole body to find its owner node. It now builds the tree alone (`AutoMovieHumanF1.constructionOf` with no names) to find the owner. It then declares only the owner's host and children; the foot's height and the three composed ends' planes (which place the registry's dividing planes) are read on the hosts' courses at their end stations (``AutoMovieHumanF1.endStations``), with no host lofted. Restoration reads the fields alone, and the start's sources come from `groupSources`, restricted to the owner's faces. The whole body is declared only by the figure round.

### The side parts start from their loops (plan, 2026-11-23, for decision)

The supervisor's ruling on the arm: the Connections rule (`.agents/skills/human/construction.md`, Ports) decides. The parent publishes the landmark loop with its outline values and slopes, the child's view curves start from them in its own frame, and the child owns the mass between its joint and the port. A band that must span a radial gap or turn steeply shows that the 2D lines were not shared. The arm's -6 mm/mm fall at its stored first knot, which no continuation can follow, is that symptom: its lines do not start from the armscye loop, so the carried stretch extrapolates past its first knot.

Plan:

1. **Addresses before the first knot.** `AutoMovieHumanF1.bind` addresses each master clock on the child's course planes over the course's whole length (`AutoMovieHumanJoinLoop.materialAddresses` with the course's domain from its start), not over the lofted domain. A section plane is the course's alone, so the planes exist before the first knot without any field there.
2. **The port is the child's first section.** The child's view starts at the loop's shallowest station on its course. Between there and its protected mark, its sections are the bound sections (`AutoMovieHumanBoundSection.conic`): the loop at each clock, blended C2 into the child's own section at the mark. The engine's join reads exactly that view. The child carries no stretch of its own fields before its first knot: `AutoMovieHumanConicLoft.continued`, `IFamily.carried` and the ease go.
3. **The loop's values and slopes published.** The master's 2-jet by clock (`at`: point, first and second derivative) is the parent's publication. The bound section takes its value at the loop and its station slope from the master's jet, so the child's surface leaves the port along the shared lines.
4. **The root fields by rule (the armscye's own fit).** The child's knots from the port to its mark are refitted by the junction fairing on the shared start: the loop's values and slopes fixed, the fairing energy on the root rings and lines, star shape, rails inside their domains and no fold as constraints. A stored knot that contradicts the published start is not kept. This is the side-join form of the junction model, with the loop in place of the end plane's cuts.
5. **Every side part.** The arm extrapolates today (carried to the master's shallowest station less the fold's reach, eased). The thumb extrapolates (carried to its root plane less the chord), and its master is still refused on the hand (no closed loop: the hand's wall question, the hand refit under ruling (a)). The breast extrapolates (carried to its generated loop's deepest station less its fold's reach, eased); its loop is generated by rule and closes. All three move to steps 1-4; the thumb's after the hand's wall carries its root.

Tests: a made case for step 1 (a straight tube whose loop crosses section planes before its first knot: each clock gets its unique plane by the course alone, red under the lofted-domain rule); step 2 (the bound view at the loop equals the loop to the trace's tolerance and is C2 into the mark); `test_human_construction_topology` with the arm, thumb and breast lofting and no carried stretch; then the figure's close views of the shoulder (armpit front, back and below), the thumb root and the breast fold, beside the reference.

### The port blend, ruled (2026-11-23)

Amending the plan above (supervisor's ruling on the measured point): `AutoMovieHumanBoundSection.conic` adds the loop's correction onto the child's own sections over its bound domain, so the port needs the child's sections between the loop and the mark, and a C2 meeting at the mark needs them to be the child's own there.

- **M, the child's own fields.** M runs from the loop's shallowest station on the child's course. Below the stored first knot it is extended by the C1 ease (`v + d L g(x)`, `g(x) = x + x^2 / 2`), and never below the loop. The f1 topology run found star-shape failures only below the loop (11.3 to 15.3 mm on the arm, where the carry reached one fold reach past it), none between the loop and the first knot. The carried family (`IFamily.carried`) and `continued` go; the ease stays as the port's field extension, so the earlier order to remove the ease is amended for that range.
- **The blend.** Radial about the child's section centre at each station: `r_P(phi) = (1 - q(tau)) r_L(phi) + q(tau) r_M(phi)`, with the quintic Hermite step `q(t) = 6 t^5 - 15 t^4 + 10 t^3` (`q(0) = 0`, `q(1) = 1`, `q'` and `q''` zero at both ends), and `tau` running from the loop's own station at that phase to the mark. A convex combination of two star-shaped radial functions about the same centre is star-shaped, so the port cannot fold; the star-shape row stays as the guard. The blend meets the child's surface C2 at the mark.
- **The mark.** One fold reach past the loop's deepest station on the child's course: the reach is the fold's own share of the joint's size (`ARMSCYE_SHARE.reach` of the master's extent for the arm, `FOLD_SHARE.reach` of the footprint's height for the breast, `THUMB_CHORD_MM` for the thumb until its loop's share is frozen).
- **Tests.** `test_human_conic_loft_continued` becomes the made-tube port test: a straight tube with a loop crossing its planes before its first knot, every clock addressed by the course alone; the port equals the loop at `tau = 0`, the child's section at the mark with matching first and second station derivatives, and is star-shaped in between.

### The guide extents in log space (2026-11-24)

The first focused run of the port batch refused the arm in `test_human_construction_topology`: stations 17.3 to 22.3 mm of the arm's original source failed the engine's half-extent rule, the forward extent running from -23.0 to -0.9 mm. Scenario 6 lofts the source without the port, so the eased stretch below the stored first knot (24 mm) stood on its own fields. The forward extent leaves the first knot at 10.1 mm falling 6.9 mm/mm toward the shoulder (solved from the refused extents). The linear ease `v + d L g(x)` over `L` = 12 mm dips by `d L / 2` = 41 mm, so it crosses zero below 22.4 mm. The port's own term reads the same fields, so the claim above that the stretch stays star-shaped between the loop and the first knot does not hold on f1. The run before the pause had not been read.

Rule (supervisor's ruling): the four guides' extents (`AutoMovieHumanConicSection.extents`: a `u` guide's `u`, a `v` guide's `v`) are positive magnitudes signed by their side, so they are extended multiplicatively, by the same ease on their logarithm: `v exp((d / v) L g(x))`. The value and the slope `d` at the knot are unchanged, it levels out at `x = -1` with `g(-1) = -1/2`, it is monotone, and it never reaches zero. Centre, offset and shoulder fields keep the linear ease.

On f1's arm the forward extent is 0.385 mm at the loop's shallowest station (17.3 mm: `x` = -0.558, `g` = -0.403) and 3.4 mm at 22.3 mm. At the shallowest station the port weight of the own section is `q` = 0 for every phase: `tau` is held at 0 where the station does not pass the loop's own station at that phase. So the near-collapsed own section carries no weight there, and its weight rises by the quintic step toward the mark.

The near-collapse comes from the stored first knot falling 6.9 mm/mm toward the shoulder. The remedy is the root-knot refit on the shared start (plan step 4), so the first knots follow the loop's published values and slopes. The log ease is the extension's admissibility rule, not that refit. The shoulder is judged on the close frames (front, back, below) beside the reference before it is accepted. A hold below the knot was rejected: it puts a 0.7 mm/mm kink in the port at 24 mm (`q(tau(k))` times the 6.9 mm/mm slope).

### The fit's step, its checks and its end (2026-11-24)

Measured on 2026-11-23 and 24:
- The leg's elastic steps took 5 to 7 s. Its first constrained step took 100 s, then 92, 65 and 39 s and on down over eleven retries, and each failed its own KKT check (stationarity 5.2e-6 against an absolute 1e-8). The hand's constrained steps took 13 to 48 s, 682 s of its 899.
- The constrained step had whitened every row by the full Cholesky factor of the Hessian, which makes each row dense across its members' blocks, before the native diagonal kernel solved it.
- The leg carries 27,191 hard rows. The safe screening by the trust box is the exact maximum of a row's affine part over the box, so a row survives exactly when the box can reach its bound: 80 % and 60 % at the restoration's first two attempts. The step now logs the quartiles of margin over reach.

The step, as built:
- **Active set.** The constrained phase starts feasible at `d = 0`, so it is solved by the primal active-set method (Nocedal and Wright 2006, Algorithm 16.3) on its own rows, unwhitened (`FamilyConicFit.activeSet`). Each equality subproblem goes through its Schur complement `S = A_W H^-1 A_W^T` (section 16.2). The Hessian is factored per diagonal block: a fairing row reads one member, so each member is a block, and only the working rows couple them through `S`. `S`'s factor gains a row when a row joins the working set and is restored by Givens rotations when one leaves (Golub and Van Loan, section 6.5).
- **Warm start.** The working set starts from every row at its bound at the start, within the feasibility tolerance. After an accepted step those are the previous step's active rows read again (the warm start of Gill, Murray and Saunders' SNOPT, SIAM Review 47(1), 2005). The step logs the warm and final working-set sizes and the iteration count.
- **Kernel.** The elastic phase, a linear program, and a fit with equal rows stay on the native kernel.

The checks:
- **KKT, scale-relative.** Stationarity `|g + A^T lambda|` is measured against `max(1, |g|, |A^T lambda|)`, the terms it balances (Nocedal and Wright sections 17.4 and 18.3; OSQP, Stellato et al. 2020, section 3.4). Feasibility is in the rows' own mm against the tolerance. Complementarity is measured against that scale times the step's largest coordinate. A step that fails its own KKT check is no longer retried in a smaller box: the box does not cure the solve.
- **Termination.** The hand was feasible from its reading 30, and its objective then moved under 1 % in 34 readings. The fairing fit now ends once three successive accepted feasible steps each change the objective, and each predict a change, of at most `tau (1 + |F|)`. This is the relative test U1 of Gill, Murray and Wright, Practical Optimization, 1981, section 8.2.3, with the model's predicted decrease as the first-order measure.
- **Tolerance.** `tau = (2 pi / 48)^2 / 12` = 1.4e-3, the energy's own resolution: a second difference round a ring of at least 48 points reads the curvature times `1 - h^2 / 12`. The three steps are an ESTIMATE.

The seams' nesting:
- **Rows.** The leg's emit of 2026-11-23 was refused at admission because seam 1 did not enclose seam 0 on the host's end ring. The junction model now reads the seams as the split derives them (`FamilyConicJunction.seams`): each neighbour pair's forks from their cuts' crossings, the seam plane through the forks and the bisector of the two cuts' mean station tangents, the host ring's crossings unwrapped by whole turns exactly as `derive`. Its three nesting margins per seam become rows, in mm along the ring at its mean radius.
- **Rates.** A nesting row couples three members and the host, so its rates come from each member's own moved reading in the grouped columns, the base turns kept.
- **Test.** `test_human_junction_model` scenario 6 checks the verdict and the phases against `derive` on three made tubes: parallel chords nest, and chords crossing inside the ring do not.
### The arm's root on its port (2026-11-24, plan step 4 brought forward)

The supervisor rejected lofting only the stored stations in scenario 6. The port's premise is that `M` is star-shaped wherever `q > 0`, and `q > 0` over the whole of `(s_L(phi), mark)`. The log ease kept the extents positive, but the eased chain still folded at 17.3 to 23.25 mm ("the points' phases do not advance within one turn"): easing fields one by one cannot keep a chain valid where the first section changes at 6.9 mm/mm. The cause is the stored first knot, so the arm's root is refitted on its port. The Connections rule applies literally.

- **Knots.** The arm's first knot moves to the port, the armscye loop's shallowest station on its course less one address tolerance (`AutoMovieHumanF1.armscyePort`, traced as the declaration traces the master). The knots before the mark, one fold reach past the loop's deepest station, are free; those past it keep their stored values. With no stretch before its first knot, the arm takes no extension, and the log ease does not act on it.
- **Objective.** The fairing energy on the port's skin, `P = q(tau) M + (1 - q(tau)) r_L(phi) dir(phi)` (`AutoMovieHumanBoundSection.port`), on its rings at every layer from the port to the mark and on its eight guide-phase lines. The loop's values and slopes are fixed boundary data: `P` is the loop at its own station at every phase, so no row fits `M` to the loop's 384 points, which about a hundred free values could not all meet.
- **Constraints.** `M` star-shaped on every ring, the blend's premise: every phase's ray meets `M`'s chain, and successive points turn the same way about the course. The rails need no row: the port's mark is past the loop's deepest station by the fold's own reach, inside the arm's domain.
- **Cost.** A reading builds one section per ring station and no loft; the derivatives are forward differences, one reading per free value (`FamilyConicSideRoot`).
- **Acceptance.** Scenario 6 of `test_human_construction_topology` lofts the refitted arm unchanged, the port's star-shape guard stays, and the shoulder is judged on its close frames (front, back, below; clay and curves over clay; the reference beside).
- **Breast.** Its loop is generated by rule and closes, so the same first-knot-at-the-port refit applies to it now.
- **Thumb.** It waits on the hand's emitted fit, whose wall gives its master a closed loop.
### The port's slope (2026-11-24)

Measured on f1 at the armscye's 384 clocks (`FamilyConicSideRoot`): with `q'(0) = q(0) = 0` the port left the loop with a zero radial station slope whatever the trunk did, at an angle out of the trunk's tangent plane with quartiles -45.8 / -30.8 / 11.5 / 54.8 / 90.0 degrees. The dihedral turn between the trunk's skin and the port's had quartiles 0.2 / 14.4 / 34.2 / 59.7 / 132.6 degrees, 107 degrees on average over the clock octant from 3.93 to 4.71 rad. The shared-loop merge takes that turn on a fold of radius `R` = 6 mm over `hypot(reach, R tan(beta / 2))` = 6.0 to 14.9 mm, an edge where the turn passes 60 degrees, where the axilla's vault turns over a long run.

Rule (supervisor's ruling, the "values and slopes" half of the Connections rule):
- **Slope term.** The port's radius carries the host's slope over its own length: `r_P = (1 - q(tau)) r_L + q(tau) r_M + h1(tau) (mark - s_L) sigma`, with `h1(t) = t - 6 t^3 + 8 t^4 - 3 t^5`, the quintic Hermite basis function of the first derivative at 0 (Farin, Curves and Surfaces for CAGD, 5th ed., 2002, quintic Hermite interpolation): `h1(0) = 0`, `h1'(0) = 1`, `h1''(0) = 0`, and `h1`, `h1'` and `h1''` vanish at 1, so the C2 meeting at the mark stays.
- **The host's slope.** `sigma` is the radius's station rate that keeps the port's station tangent in the host's tangent plane at the loop. With `P = o + r (cos phi u + sin phi v)`, `P_s = o' + r w' + r_s e`, and `n . P_s = 0` gives `sigma = -n . (o' + r w') / (n . e)`, `n` the host's outward normal from its own first derivatives (`AutoMovieHumanJoinLoop.master`'s `normal`, the parent's publication). It has no constant of its own.
- **Where it cannot hold.** Where `n . e` falls to zero or below, the host turns back under the arm (the vault concave along the course) and no radial slope lays the port on its skin. The port's star shape is then the guard's to decide; the slope is never capped or scaled. The refit reports the clocks, the host's turn there and the port's radius along `tau`.
- **Breast.** Its generated loop publishes no host normal yet, so its port keeps the zero slope until its own root refit.
### The step's solver and the pending topology finding (2026-11-24)

- **Solver.** The primal active set of "The fit's step, its checks and its end" cycled on the arm's root refit (27 of 31 steps refused, "did not settle"), even with the degenerate-row rules. The constrained step is now solved by the dual active-set method of Goldfarb and Idnani (Math. Programming 27, 1983): it starts from the unconstrained minimum, takes the most violated row at a time, keeps the multipliers non-negative and ends finitely. Its QR factors are updated by Givens rotations, the stable form of Powell (Math. Programming Study 25, 1985). A final polish solves the active rows' equality problem afresh with fresh block solves, because the rotations' accumulated rounding left stationarity at 2.0e-7 after 404 of them. The warm start of the primal method is gone with it: the dual method needs no feasible start.
- **Topology.** `test_human_construction_topology` scenario 6 stays failing ("the arm does not loft", view chain at 17.3 to 23.25 mm) until the refitted arm is stored in the figure: it lofts the arm's extended source, whose eased stretch below the stored first knot is what the refit removes. The supervisor accepted it as pending on that condition.
### Admission premises against the junction model (2026-11-24 survey)

Every refusal on a composed end's path, read from `AutoMovieConstructionSplitCompose`, `AutoMovieConstructionSkinCut`, `AutoMovieConstructionComposedEnd`, the split's realization (`AutoMovieConstructionSplitRealize`, `SplitSeam`, `SplitBand`, `PortCurve`), the declaration's admission, the fairing seal (`composeGroup`, `terminalIncidence`, `sealComposed`) and the fit's raw screen and reads. The survey's ids name the refusals. A premise reached admission unseen in this round for one of two reasons: either no row expressed it, or the model read it at other points than admission reads it.

| Premise (refusal) | Junction row, or why it holds | Status |
| --- | --- | --- |
| Declaration admission A1 to A20, realization preconditions D1 to D11 | The declaration's constants and the tree's structure; no field moves them | Cannot occur in a fit |
| End-plane cut, skin outside at its facing end (K4 via D12) | The raw screen's first-ring row before the end plane (X19, X20, X32) | Holds |
| End-plane cut, skin never enters (K5 via D12) | A missing cut phase refuses the reading (J8) | Holds |
| End-plane cut tangent to the skin (K6, D24); terminal cut's station advance and regularity (S10) | No row | **Missing: transversality row per cut phase** |
| Neighbours cross twice (E6), one lobe each (E11), lobes close (E12) | Overlap and non-containment rows; four crossings are not seen | **Missing: one overlap interval per neighbour pair** |
| Non-neighbours apart (E5, S11) | Clearance rows, read on the model's phase-count polygons; S11 reads 2 x count-gons | **Pitch: read the cuts at the seal's 2 x count phases** |
| Degenerate forks, axes, bisector, seam planes (E4, E7 to E10, D13, D19, D20) | Implied by positive overlap and crossing cuts with distinct forks and axes | Holds |
| A seam plane crosses the host ring twice (D15) | Refuses the reading (J14); implied while the forks stand within the host rail | Holds |
| Seams nest (D16) | Wrapped nesting rows | Holds |
| Host ring within the rail (D17) | Host rows at all 8 x count points | Holds |
| Each child's wedge entered at every phase (D18), and its rail wedge (D22) | No row: the leg's toe.ring was refused at phase 4.12 rad | **Missing: wedge row per child phase on the rail-shifted planes, which implies the unshifted** |
| A child's cut by a seam plane runs fork to fork (D21) | Implied by the wedge row with transversal cuts | Holds once the wedge row stands |
| Seam, valley and band construction (R1 to R38) | Built only after derive, from its seams and rails; not readable without the band | Checked at the emit's admission |
| Seal's lobe correspondence with the measured envelope (S13 to S19, S15: every fork within `TARGET_MM` of a reference endpoint) | A reproduction premise that the fairing seal still applies | **For the supervisor's ruling** |
| Tail checks and the lone-family loft (S22 to S25, P10) | The raw screen and the protected tail | Holds |
| Raw screen: conic chain faults, tangent-meeting margin, shares (X2, X12, X13) at every `DENSE_MM` station | Hard margin rows only at the prefix sites; the hand was refused between them (finger.index at -1.27 mm, meeting 0.0168 below 0.1) | **Pitch: margin rows at the screen's dense stations** |
### The port's slope bounds (2026-11-24)

The port's radius is `r_P(tau) = (1 - q(tau)) r_L + q(tau) r_M + h1(tau) L sigma`, `L = mark - s_L`.
- **Star bound, M-free.** The loop's placement must not depend on `M`, which the root refit changes, so only `r_M >= 0` counts. Then `r_P > 0` for every `tau` holds whenever `(1 - q) r_L + h1 L sigma > 0` for every `tau` in (0, 1). With `1 - q = (1 - t)^3 (1 + 3 t + 6 t^2)` and `h1 = t (1 - t)^3 (1 + 3 t)`, the ratio `(1 - q)/h1 = (1 + 3 t + 6 t^2)/(t (1 + 3 t))` decreases on (0, 1] to 10/4 at `t = 1`. So `sigma > -2.5 r_L / L` is the exact condition. The bound at `h1`'s maximum, `16/81` at `t = 1/3`, is not the binding one, because the loop's own weight there is `1 - q(1/3) = 0.79`, not 1.
- **Bulge bound.** `sigma <= (81/16) reach / L`: the slope term's largest radial excursion, `(16/81) L sigma`, stays within the merge fold's reach, its width once the port lies on the host's tangent plane. DERIVED from the merge; ESTIMATE in its choice of the fold reach; judged on the shoulder frames.
- **Placement.** Every arc of the loop where `sigma` leaves these bounds (on f1: 0.36 to 1.91 rad over the front of the cap, 4.03 to 4.09 and 4.55 to 4.65 rad under the arm) moves, by rule, to the nearest line of the trunk's skin where the violated bound holds with equality, traced by continuation. It joins the loop by the quintic step over one fold reach at its break points. The armscye's placement is thereby derived: the loop lies where the port can carry the host's slope, and the F1 landmarks become its plausibility check.
### Handoff, 2026-11-24

Joint worker 2 (Claude) hands campaign 3's joints work to the next session. Nothing was committed; every change is in the working tree of `feat/human-provisional-laws` and compiles (watch cycle 15:10:49 green over the last save, 15:08:30).

**State of every piece**
- **Junction model** (`test/src/reference-conics/FamilyConicJunction.ts`, `FamilyConicBody.ts` `junctionModel`). The fairing reading on the members' own curves, with no declaration and no loft. Its rows:
  - fairing on visible arcs;
  - overlap, non-containment, clearance and one-interval rows (`Junction.depths`, `secondRun`);
  - host rail at all 8 x count ring points, read on every state as inside rows;
  - wrapped seam nesting (`seams`);
  - cut transversality (`IRead.crossing`);
  - the rail wedge per child phase (`Junction.wedge`, conservative stations).

  Cuts are read at 2 x count phases. The rates come from the grouped columns; a column re-reads only its moved members, and the host only when its stock moves. Its fairing is read alone (`fairingOf`). Each member's seams are computed once per column, shared by the nesting and wedge rates. The admission probe (`family-body-junction-admission-probe`) logs both readings when derive refuses the host ring.
- **Premise table.** "Admission premises against the junction model" above: every refusal mapped to its row or to why it holds. In fairing mode the seal's S15 is a diagnostic (`family-body-seal-fork-distance`).
- **Step solver** (`FamilyConicFit.ts`, `activeSet` and `groupStep`). Goldfarb and Idnani's dual active set, with block Cholesky factors, Givens QR updates (Powell 1985) and a final polish kept only when every row still holds.
  - Constrained phase: on the measured objective.
  - Elastic phase: the exact-penalty QP `1/2 d^T D d + gamma s + 1/2 mu s^2`; D and mu are proximal in the box's metric; `gamma = n mu_y / incidence`.
  - Checks: scale-relative KKT; no retry after a KKT failure.
  - Screening: the box screening covers hard, held and inside rows.
  - Trust box: the scope carries from the last accepted step (audit #1).
  - Termination: relative (GMW U1, `(2 pi/48)^2/12`, 3 steps).
- **Port and slope term** (`packages/human/src/generation/conic/AutoMovieHumanBoundSection.ts`, `portSection`). Radial blend `(1 - q) r_L + q r_M + h1 (mark - s_L) sigma`; `sigma` comes from the host's normal (`AutoMovieHumanJoinLoop.master`'s `normal`). The breast's loop publishes no normal yet, so its port keeps the zero slope.
- **Armscye loop placement rule** ("The port's slope bounds" above).
  - Star bound `sigma > -2.5 r_L / L`, M-free and exact.
  - Bulge bound `sigma <= (81/16) reach / L`, DERIVED from the merge, ESTIMATE in the fold reach.
  - Out-of-range arcs to move on f1: 0.36 to 1.91, 4.03 to 4.09 and 4.55 to 4.65 rad. Not yet coded.
- **Arm root refit** (`test/src/reference-conics/FamilyConicSideRoot.ts`).
  - Fairing of the port's skin over [port, mark] (17.30 to 130.55 mm), with M's star rows and the slope term.
  - Modes: `--measure-only` (slope bounds and band) and `--store` (writes AutoMovieHumanF1Arm.ts with a pre-emit snapshot).
  - Not yet run on a moved loop; nothing stored.
- **Contacts** (`AutoMovieHumanF1.ts`, `prepareArmscye` and `prepareMammary`). Prepared per declaration from the trunk's source, right after the crotch's root; refusal by name when unprepared. `armscyePort` exports the trace for tools.

**Audit items and caches**
- Done:
  - #1 (the trust scope carried);
  - the elastic QP (merging #12's intent);
  - #3 (moved members only);
  - partly #7: seams once per member per column. Still open in #7: base forks per pair, and phasesOf rebuilt per pair row per column.
  - Caches converted: `Junction.sections`, `Junction.read`, the F1 armscye and mammary contacts.
- Remaining, at the auditor's locations of 2026-11-24:
  - #2 `groupStep` prepared per reading (CSR rows, reach and scaling once; FamilyConicFit.ts `groupStep`);
  - #4 `Junction.read` prepared per member per fit (station index lists, frames, the cubic's factor per bracket);
  - #5 engine `AutoMovieViewChain.reader(phases)`;
  - #6 cardinal-weight columns (as `preparePrefixMargins`);
  - #7 the rest: base forks and wedges per reading;
  - #8 SideRoot columns by cardinal weights;
  - #9 `AutoMovieHumanConicSection.resolve` prepared per layout;
  - #10 one start declaration shared by `FamilyConicDivide.composition` and `groupSources`;
  - #11 `AutoMovieMeshExtract.outline` prepared per mesh;
  - #12 `restoreGroup` reach once per iteration.
- Caches still to convert:
  - `endSections`' WeakMaps and its `last` compose memo (FamilyConicBody.ts `endSections`);
  - the `groupSources` readers;
  - groupPhysics' `priorShape`, `priorSources`, `priorDerived`, `screened` and `lastPartial`;
  - `solidCache`;
  - `AutoMovieHumanConicLoft.part`'s resolved Map;
  - `AutoMovieHumanConicRelief` STORED;
  - `AutoMovieHumanEmptyProbeWalls`;
  - F1's lazy `??=` getters and `loopSources`' prepared;
  - the engine's SAMPLERS, STATIONS, CHECKED, VALIDATED, TURNS, DECLARATIONS and `AutoMovieConstructionProfileGrid`;
  - `AutoMovieLoftSectionSource`'s `fits` and `same`.

**Open failures**
- `test_human_construction_topology`: "the arm does not loft", view chain at 17.3 to 23.25 mm, the arm's eased stretch. Pending until the refitted arm is stored.
- fan.hand: was not feasible within the wall in earlier rounds. On the last bundle it fell from incidence 10.9 to 5.1 in 3 elastic steps of 0.6 to 1.0 s, with the start's outline refused ("finger.pinky and finger.ring cross 0 times").
- fan.leg's start is refused on "toe.middle and toe.index cross 0 times". It is a containment: the overlap row read 16.5 mm while the pair did not cross. The restoration's phase I has no junction rows, so the start is not junction-feasible. The non-containment row is what brings it back (run 142443 reached incidence 0 with it).
- fan.leg's last bounded run stopped at its first elastic step on the KKT check, stationarity 0.0032. Unsolved; read the polish and the proximal scaling first.
- fan.leg's admission after a feasible fit (run 134433): "the child face toe.ring's boundary in the composition ... never enters". The wedge row now expresses it and is untried on a full leg run.

**Next steps, in order**
1. The leg's elastic KKT failure (stationarity 0.0032): compare the dual method's own point with the polish, at the leg's start.
2. The remaining audit items and caches above, in the auditor's order, as prepare-then-closure, then one bounded profile per fan.
3. The axilla arcs: trace the violated bound's level set by continuation on the trunk's chart, join with the quintic step over one fold reach, report the per-arc distance from the current loop in mm, with the made case of two cylinders at 60 degrees.
4. The arm refit on the moved loop (`FamilyConicSideRoot.cjs --out=<dir> --store`), then the shoulder frames (`FamilyConicFigureCapture`, zones armpit and shoulder; front, back, below, axilla close; clay and curves over clay; the reference beside), the two star phases' radial profiles, and topology scenario 6 green.
5. The fans' full fits with `--emit`; the close frames for the supervisor's naturalness judgement; then the crotch after the leg; the breast's root refit on its port; the thumb after the hand's emit.

**Evidence** (under `packages/human/.shots/joints-batch-20261117/`)
- Fans: `campaign3-claude2-fits-20261124-1{30129,32428,34433,42443,43436,44515,45514}-c59f11c9901f`.
- Profiles: `campaign3-claude2-profile-20261124-1{42802,43748,50651,51714}-c59f11c9901f`.
- Focused tests: `campaign3-claude2-focus-20261124-1{23147,30129,32428,34433,35942,42443,44515,45514,51714}-c59f11c9901f`.
- The arm's bounded and full refits and the slope measurement: `campaign3-claude2-fits-20261124-1{32428,34433,35942,43436}-c59f11c9901f` (`side-root*`).

### The leg's first elastic step, diagnosed 2026-11-24

At the handoff start the dual iterate had relative stationarity `0.00318634`, affine violation `5.15e-13`, complementarity `1.95e-14` and slack `0.0791040`. The equality polish reduced stationarity to `3.32e-16` but violated an inactive row by `3.54e-5`. The affine admission check was correct to refuse the raw result. A polish can restore the active equalities only for the working set it receives.

The replay of the first affine program from the preparation branch isolated a rotation on free columns 357 and 358. Both pivots were the least positive binary64 number. Their rounded hypotenuse equalled each pivot, so division gave `c = s = 1`. The active factor still satisfied `J^T N_A = [R; 0]` within `3.61e-15` but the free basis lost the metric identity `H J J^T = I`. One subsequent partial step carried a spurious stationarity residual into an otherwise feasible point.

The add and drop paths now divide both pivots by their largest magnitude before forming the Givens cosine and sine. The rescaled norm is used only as the output diagonal. This follows the scaled rotation in [Goldfarb and Idnani, 1983, section 4](https://link.springer.com/article/10.1007/BF02591962).

| Quantity on identical affine replay | Original | Scaled rotations |
| --- | ---: | ---: |
| Maximum `abs(c^2 + s^2 - 1)` | 1 | 4.44e-16 |
| Raw relative stationarity | 8.39e-4 | 1.70e-14 |
| Raw maximum row violation | 4.12e-13 | 3.13e-13 |
| Raw relative complementarity | 5.46e-15 | 1.03e-15 |
| Accepted polish relative stationarity | Unavailable | 3.25e-16 |
| Active-set iterations | 235 | 236 |

The original affine tolerances and polish gate still apply. The independent `test_human_fit_active_set` control has a subnormal tail in the first active row and an exact optimum where two later rows meet. The old code missed the second row's multiplier and returned `(y, w) = (0, 1)` in place of `(0.25, 0.75)`. The control passes with the scaled rotations.
