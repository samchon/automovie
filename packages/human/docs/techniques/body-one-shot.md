# Every body part in one shot

The investigation that precedes one implementation batch for the form of every part of the f1 figure below the head, between its joints: the neck's surface, the thorax, the abdomen, the back, the pelvis and the buttocks, the breast's mound, the upper arm, the forearm, the palm and the dorsum, every finger's and toe's shaft and tip, the thigh, the shank, the foot, and the height the figure stands at. [Every joint in one shot](joints-one-shot.md) owns how the parts meet; [Centres and courses](centres-and-courses.md) owns how a length reaches a course. This note adds, for every part at once: what it is stored as, how a person's part is made from it today, how it reads against the reference, which of its numbers are f1's, which published measures govern it, and the one construction that answers each cause that repeats down the rows.

**State of this note.** Nothing here is implemented. A cell says how it was obtained:

| Mark | Meaning |
| --- | --- |
| code | Read by the author in the named file |
| tool | A number printed by `test/src/reference-conics/FamilyConicBodyParts.ts` into `packages/human/.shots/body-one-shot/run-3` (`parts.txt`, `sites.txt`, `summary.txt`, `<family>.stations.txt`, `<family>.map.png`) |
| frame | A render of round `packages/human/.shots/family-conic-figure/2026-11-17T08-45-34.287Z/case-f1` opened by the author beside its `reference` pass, with the pixel region |
| record | Taken from the supervision record of 2026-11-17 or another worker's note, not repeated by the author |
| source | A published source, with how much of it was read, under [Sources](#sources) |

The instrument reads, at stations along each family's own course, the bare wall (the conic chain of the stored fields), the skin (the wall with its relief nets) and the reference cut by the same plane, each as reaches along `+u`, `+v`, `-u`, `-v`, girth, taut tape, area, box fill (area over depth times breadth: 0.785 for an ellipse) and centroid; and it draws each family unrolled, station against phase, as the skin less the wall and the reference less the skin.

## Every part side by side

One row per part. "Stored" counts numbers (knots times fields; net heights as stored). "Centre" is how far the skin's area centroid stands off the course. "Reference less skin" is the mean over every ray of every station.

| Part | Family, stations (mm) | Course and frame | Stored | Centre off course, mean / greatest (mm) | Skin less wall (mm) | Reference less skin, mean (mm) | Form against the reference | How a person's part is made today | Published measures at its own sites |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Pelvis, buttocks, abdomen, waist | `trunk` 28 to 380 | One straight vertical course through the figure's origin, level sections, `bilateral(1)`: 10 fields | Wall 310 for the whole trunk; `trunk.low` 4,897 heights (-9.2 to +85.0, rms 11.0), `trunk.crotch` 1,656, `trunk.navel` 228 | 20.8 / 40.3 (whole trunk) | -80.0 to +36.7 (whole trunk); a back median band past -8 from 220 up, lobes past +8 either side of it at 64 to 220, a front median band 28 to 250 | 0.63 (whole trunk to 740) | frame: `hip.front`, `hip.back` read as the reference (navel, groin, cleft, gluteal fold present; a level line px 180-430 x 575-600 of `hip.back.clay` where the reference's fold is jagged) | Wall fields and net heights times a depth and a breadth ratio interpolated between the hip and the omphalion sites, about the course point (code: `AutoMovieHumanF1NativeBuild`) | Hip girth 990.7 tape, breadth 360.6, depth 234.4 at 105; waist at omphalion 745.9, 277.1, 183.6 at 267.4 (tool `sites.txt`) |
| Thorax, back | `trunk` 380 to 640 | The same | `trunk.chest.front` 1,323 (-3.7 to +16.1), `trunk.chest.back` 1,323 (-6.5 to +16.7), `trunk.chest.side` 3,127 (-39.3 to +27.9), `trunk.fold` 1,419, `trunk.shoulder` 459 | as above | The back band continues to 636; fields past -8 either side of the front median at 440 to 520, where the wall bridges both breasts | as above; greatest 100.7 at 508, phase -1.62, where the arm joins the level cut | frame: `chest.front`, `chest.back`, `chest.left` read as the reference (clavicles, sternum's channel, spinal furrow); the scapulae are faint in both | The same, between the under-bust, bust and neck sites; `trunk.shoulder` by the arm root's ratio | Under-bust 763.4, 275.4, 195.7 at 427.7; bust level 856.4, 294.1, 214.3 at 474.7 |
| Neck | `trunk` 640 to 740 | The same: level sections across an oblique neck | `trunk.collar` 2,574 (-6.2 to +5.9); six wall knots in 70 mm (646, 658, 680, 696, 710, 716) | as above | Level stripes 650 to 740 on the map | as above | frame: `neck.left.clay` level bands px 190-300 x 300-470, no sternocleidomastoid ridge where the reference has one px 440,200 to 330,620 (fail) | Collar by the neck site's ratio | Neck girth 332.1 at 690.3 (the site is provisional: the thyroid cartilage does not show) |
| Breast | `breast` 11 to 29.9 and the trunk's hull under it | Two centres, root to tip, `limb(1)`: 20 fields | 100; no net. The mound below 11 mm is the trunk's hull, `trunk.fold` and `trunk.chest.front` (record) | 3.4 / 7.7 | -0.1 to +0.2 | 0.16 | frame: `fold.left.clay` a soft shade and a hook px 680-740 x 570-610 where the reference has a crease with a roll under it (fail; the fold is the joints') | The cap's rail-to-pole chord; any projection but f1's is refused (code) | Bust girth, under-bust girth; bust point breadth and bust height have no field |
| Upper arm, elbow, forearm | `arm` 32 to 445 | Six centres; the course leaves the thorax through two thorax datums and reaches the bone line at the elbow (record); `limb(1)` | 580 for the whole family; `arm.hollow.0` 559, `arm.hollow.1` 308, `arm.fore` 494 | 10.9 / 37.7 | -20.5 to +2.3; local: the root at 36, the elbow at 244 to 296 | 0.47 | frame (record, supervisor): `elbow.back` close; not opened by the author | Reaches times the site depth and breadth profile through mid upper arm, elbow, forearm, wrist; shares and shoulders unchanged | Upper arm 266.4 at 130.0; elbow 226.6 at 263.0; forearm 236.8 at 313.0 |
| Wrist, palm, dorsum | `hand` 448 to 595, with `arm.hand` 1,368 | The arm's course past the wrist | 200; `hand.hollow.0` 774, `hand.hand` 1,178, `hand.palm` 256 (to +16.3) | 7.1 / 15.5 (tool `run-5`) | -17.9 to +2.0 | 0.72; greatest 27.0 at the end | frame: `hand.dorsum.left.clay` smooth where the reference shows the extensor tendons' ridges faintly; a hard edge at the little finger's root px 230-400 x 690-720 (the joints') | Wrist and hand site ratios | Wrist 152.0 at 504.9; hand girth at the metacarpal heads 170.9 on the skin, 185.0 on the reference with the thumb in the cut |
| Fingers and thumb, shafts | `finger.*`, 16 to 95 | Four centres each, turns of 5 mm | 60 to 140 each, 488 in all; no net | 0.6 to 2.2 mean | within 0.2 | 0.10 to 0.18 | frame: not opened by the author at the shafts | One ratio from the representative finger's first knot | None enters: no finger breadth, depth or girth field |
| Fingertips | The same, past `tips.from` | The cap closes on the course's end | `tips` per digit | - | - | 0.6 to 1.2 over the last 3 mm | tool: 1 mm before the pole the generated girth is 15.4 against 7.4 (index), 21.2 against 17.1 (middle), 21.1 against 17.2 (thumb): blunter; the cap keeps one box fill to its pole (0.76 to 0.81) while the reference's falls to 0.68 to 0.70 | The cap's law on the scaled wall | Fingertip breadth and depth have no field |
| Thigh, knee, shank, ankle | `leg` 104 to 794 | Five centres: hip, knee, ankle, ball, end; `limb(1)` | 820 for the whole family; `leg.hollow.0` 264, `leg.hollow.1` 448, `leg.hollow.2` 989 (-5.6 to +15.4) | 14.8 / 30.1 | -10.1 to +1.7; local: the knee 416 to 468, the ankle's hollows at 832 | 0.22 | frame: `knee.front.clay` patella's mound and the hollow beside it as the reference; a faint level line px 290-560 x 655-690 where the reference's mesh has an edge row | Knee, calf, ankle ratios; the thigh by the leg root's | Knee 342.6 at 438.5; calf 348.5 at 563.5; ankle 204.0 at 794.0; the thigh site (97.0) lies proximal of the family's first knot (104) |
| Foot | `leg` 794 to 990 | The same | `leg.sole` 560 | as above | as above | as above; greatest 20.2 at the end | frame: `foot.left.clay` heel, arch, malleolus and dorsum as the reference | The foot site's ratio | Ball of foot girth 213.1 at 964.2 |
| Toes | `toe.*`, 20 to 56.6 | Three centres each | 60 each, 300 in all | 2.3 to 4.4 mean on reaches of 4 to 11 | within 0.3 | 0.10 to 0.29 | frame: `toes.left.clay` the little toe ends in a point at px 185,600 where the reference's end is a blunt dome (fail). tool: at its last station the reference reaches 4.45 mm along `-u` and the generated 3.67; the big toe's girth is 10.5 against 14.5 | One ratio from the selected toe's first knot | None enters |
| Standing height | The chain's root | The pelvis is the root and keeps its height (record, `centres-and-courses.md`) | The pelvis's offset [25.4, 904.8, 0] | - | - | - | record: with every limb 1.1 times as long the feet stand below f1's floor (`figure.front` px y 1440 against 1380) | Not generated | Stature, crotch height, trochanterion height: none enters |

### Seen on the other side and in the other passes

Opened after the matrix was first written, same round, each beside its reference or its clay pass.

| Frame | What it shows |
| --- | --- |
| `elbow.front.clay` beside `.reference` | The cubital hollow px 470-560 x 330-470 and the forearm's two bellies in both; the upper arm's and the forearm's shafts read as the reference |
| `elbow.front.curves-over-clay` | Four outline tracks along the limb; the one through the hollow hooks sideways px 410-600 x 380-395: an extreme's track is not a smooth line along the limb where the section's extreme changes sides at the elbow |
| `elbow.twin.front.clay` | The same hollow; a faint ripple px 380-480 x 540-620 |
| `knee.front.curves-over-clay` | The front outline's track swings round the patella px 420-470 x 380-700, an S along the limb |
| `knee.twin.front.clay` | The level line px 400-600 x 678-684 with a level edge above it px 410-600 x 660-700, as on the other side |
| `hand.left.clay` beside `.reference` | Finger shafts and the dorsum's slope as the reference; every tip a bare dome where the reference has a nail's plate; a pinched crease at the roots px 560-680 x 480-560 (the joints') |
| `toes.twin.right.clay` | The big toe's dome and the second toe's from the medial side, blunt; a fan of flat bands under the second toe px 250-450 x 590-680 |
| `foot.twin.right.clay` | Medial malleolus, arch and heel present and smooth |
| `hip.back.curves-over-clay` | The median line and two outline tracks a side; no curve on the buttock's mass or its fold; the level fold line on both sides, px 180-430 x 575-610 and 520-770 x 560-600 |
| `chest.front.owners` | The breast's own family is a disc about 190 px across at the apex with a ring of band; the mound's slope, its fold and everything round it are the trunk's faces |

| `hand.left.owners` | Each finger its own face from its web out; the hand's face from a wrist band to the webs; saw-toothed borders at every root (the joints') |
| `hand.left.curves-over-clay` | Each finger's course runs down its middle to the tip's middle; the outline tracks follow the fingers' sides |
| `foot.left.owners` | The leg's one face covers the shank, the ankle, the heel and the whole foot to the toes' roots |
| `foot.left.curves-over-clay` | A track hooks round the malleolus px 195-240 x 330-420, as at the elbow and the knee; the sole's and the dorsum's tracks run the foot's length |
| `toes.left.owners` | Each toe its own face; saw-toothed borders at the roots px 100-250 x 290-470 |
| `toes.left.curves-over-clay` | Every toe's course ends on the upper front of its dome (little toe px 185,605, the next two px 470,605 and 690,600) and the outlines gather there: the pole stands at the toe's top edge, not on the pad's far point, which is why the little toe closes to a point |
| `neck.left.curves-over-clay` | The trunk's straight course at px x 333; the side outline's track wanders across the neck in two S bends (px 320-470 x 240-440 from behind the ear to the jaw's angle, px 185-260 x 640-750 onto the trapezius); no curve runs along the sternocleidomastoid |
| `neck.left.owners` | One owner, the trunk, from the shoulders to the head |
| `shoulder.front.clay` beside `.reference` | A short crease px 640-680 x 270-310 and a ridge along the shoulder's top px 590-700 x 230-250 where the reference is one smooth cap; fringes at the fold's apex px 490-540 x 560-640 (the joints') |
| `shoulder.front.curves-over-clay` | An arm outline track arcs outside the silhouette px 355-480 x 270-390: the arm's first sections' extreme, read off the course under the shoulder |
| `shoulder.twin.front.clay` | The same crease px 240-330 x 280-320 and fringes px 330-400 x 540-640 on the other side |

Three findings these add. An outline's track is the path of a section's extreme, and at the elbow, the knee, the ankle and across the neck that path leaves its side of the part; a view curve drawn through landmark knots (cause 4) is a line of the anatomy instead. The toes' poles stand on their domes' upper edge (cause 5: the course's last centre is not the pad's far point). And the breast row's split is visible in the owners pass: the family the measures act on today is the apex's cap alone.

The round's catalogue holds no twin view of the chest, the hip or the neck (the trunk is one bilateral family whose two sides are one construction, and `chest.front`, `chest.back`, `hip.front` and `hip.back` show both); a twin view of them is added to the round below, to read the mirror and the median seam.

### What the whole-figure curves pass shows

frame: `figure.front.curves` and `figure.left.curves-over-clay` draw, for the trunk, two outline pairs and one straight orange course that runs in the back third of the abdomen. Every form the trunk's clay shows (furrow, buttocks, navel, clavicles) has no curve: it lives in the nets. The limbs' curves follow their skins.

## Read down the columns

Six causes repeat. Each has one construction that answers it on every row it occurs in.

| # | Repeated cause | Rows | Measured | One answer |
| --- | --- | --- | --- | --- |
| 1 | A person's part is f1's section under one depth and one breadth ratio a site. A girth, a breadth or a depth never enters by its own definition; quadrant shares and conic shoulders are f1's at every person | Every row | code: `AutoMovieHumanF1NativeBuild.wall`, `AutoMovieHumanF1NativeCalibration.ratio`; `AutoMovieHumanF1FieldModel` lists girths as checks | The section solved at each site from its published triple: breadth and depth set the four reaches, the girth closes the fullness ([The section law](#the-section-law)) |
| 2 | The ratio is applied about the course point, and the course is not the section's middle nor the bone | Trunk 20.8 mm mean off centre, arm 10.9, leg 14.8, toes 2.3 to 4.4 on reaches of 4 to 11 | tool `summary.txt`; record: 41.5, 29.4, 31.0 mm at most | Tissue is laid about the skeleton's crossing of the section (`AutoMovieHumanNativeFamily.ISpec.centre`, built and unused), so a tissue change leaves the bone's place |
| 3 | The trunk's wall is not its skin. 17,006 stored heights carry -80 to +37 mm of the trunk below the head; on the limbs the wall is the skin and the nets are local | Pelvis to neck | tool `parts.txt`, `trunk.map.png` | The trunk's wall laid on the skin through the lines the anatomy has, and each feature with its own centre a template in its bone's frame ([The trunk](#the-trunk)) |
| 4 | Knots stand where the trace needed them, in f1's millimetres: six in 70 mm on the neck, five in 48 mm at the wrist (470, 482, 494, 506, 518) | Neck (level bands), knee, wrist; every row for a changed person | code: the families' `knots`; frame: `neck.left.clay` | Knots at the part's landmark stations by their place in the run: one at each extremum of each outline, none closer than the form ([Knots](#knots)) |
| 5 | A closed end is one cap law about the course's end: one box fill to the pole, the pole on the course | Every fingertip and toe tip; the breast's apex | tool: girths and reaches above | The end as a dome with its own centre and its own profile, in the last bone's frame ([Tips](#tips)) |
| 6 | A stored number is f1's absolute value: 2,798 wall numbers and 24,204 net heights below the head, every knot station, every tip station | Every row | tool `parts.txt` | The audit's classes below; what stays is a prior in the part's normalised coordinates, each with its basis |

Two rows have a cause of their own: the breast (one mound split over three owners, [The breast](#the-breast)) and the standing height ([Root height](#root-height)).

## The audit of f1's numbers

Every stored number of the parts below the head, by what it is today (code: the family modules; tool: `parts.txt`).

| Group | Count | Today | Class | What it becomes |
| --- | --- | --- | --- | --- |
| Joint centres, segment lengths | The chain | Supplied per person (`AutoMovieHumanF1SegmentLengths`) | Supplied measure | Unchanged |
| Site stations | 16 sites | Read by published definition on f1, carried by run and tau (`AutoMovieHumanF1NativeSites`); neck and head provisional | Derived; two copied | Unchanged; the thigh site moves inside the leg's family once the leg starts at the hip's centre (the joints' batch) |
| Site calipers (depth, breadth) | 16 by 2, 4 roots by 2 | Read on f1's stored families as the person's default | Supplied measure | Each site gains its girth and takes its breadth and depth by the published definition's plane |
| Reaches of a wall (`u`, `v` of each extreme) | About 40 % of 2,798 | f1's millimetres at f1's knots | Copied from f1 | A profile along the run in shares of the site reaches either side (a prior), times the person's site reaches |
| Offsets of an extreme across its direction | About 20 % | f1's millimetres | Copied from f1 | Shares of the section's breadth or depth |
| Median fullness, conic shoulders | About 40 % | f1's shares | Copied from f1, already dimensionless | A prior along the run, moved at each site by the girth's closure |
| Knot stations | 5 to 41 a family | f1's millimetres | Copied from f1 | Landmark places in the run |
| Tip stations, cap starts | 15 families | f1's millimetres | Copied from f1 | The dome's law from the last bone's length and the section there |
| Relief heights | 24,204 | f1's millimetres on f1's chart | Copied from f1 | Wall (the trunk's volume), or a feature template's few numbers in its bone's frame |
| Turn half lengths | 2 to 4 a family | f1's millimetres; the turn rule bounds them | Derived bound, copied value | The turn rule's value from the section's size at the joint |
| Placing datums in segment frames | The placing table | f1's coordinates in each segment's frame | Copied from f1, carried by `AutoMovieHumanF1Centres.local` | The joints' batch for course starts; the rest are landmark rules |

No published prior is among the stored numbers today: the only published values the path reads are the definitions that place the sites.

## Published measures and what each solves

Each measure enters at its own site by its own definition and solves one thing there. f1's own value by the definition is the default; a population relation is used in its source's covariates, never as a plain mean.

| Measure | Definition, source | Site today | Solves | f1 by the tool, against ANSUR II women |
| --- | --- | --- | --- | --- |
| Hip (buttock) girth, hip breadth, buttock depth | ISO 8559-1 5.3.13; ANSUR II at the buttock point | 105.0 | Side reach, front and back reach, fullness at the hip | 990.7, 360.6, 234.4; 1,021.2 (75.9), 353.8 (26.7), 232.9 (24.3) |
| Waist girth, breadth, depth at omphalion | ANSUR II | 267.4 | The same at the navel's level | 745.9, 277.1, 183.6; 860.9 (99.9), 299.9, 213.0 |
| Under-bust girth | ISO 8559-1 5.3.8 | 427.7 | The chest wall's fullness under the breasts | 763.4 |
| Bust girth; chest breadth and depth | ISO 8559-1 5.3.4; ANSUR II chest | 474.7 | The breast's projection over the solved chest wall (a tape over both mounds) | 856.4, 294.1, 214.3; 946.9 (82.7), 269.3, 247.4 (breadth compressed at full inspiration) |
| Bust point breadth, bust height, under-bust height | ISO 8559-1 5.2.3, 5.1.7, 5.1.8 (titles read, text not obtained) | none | The mound's centre across and up, its lower pole's height | not read |
| Neck girth | ISO 8559-1 5.3.2, square to the neck's axis | 690.3, provisional | The neck's section on its own course | 332.1; 329.8 (19.2) |
| Biacromial breadth, cervicale and suprasternale heights | ANSUR II | none | The shoulder line's ends; the neck's base | not read |
| Upper arm girth relaxed; elbow breadth; forearm girth; wrist girth | ISO 8559-1; ISO 7250-1; ANSUR II over stylion | 130.0, 263.0, 313.0, 504.9 | Each site's fullness; the elbow's and the wrist's bony reaches | 266.4, 226.6 (girth), 236.8, 152.0; wrist 154.8 (7.8) |
| Hand breadth and girth at the metacarpal heads | ISO 7250-1 6.3.3; ANSUR II | 579.4 | The palm's breadth and thickness | 170.9 on the skin |
| Thigh girth at the gluteal furrow; knee; calf; ankle | ANSUR II; ISO 8559-1 5.3.22, 5.3.24 | 97.0, 438.5, 563.5, 794.0 | Each site's fullness | knee 342.6, calf 348.5, ankle 204.0; calf 373.3 (28.5), ankle 215.7 (14.9) |
| Ball of foot girth, foot breadth | ANSUR II | 964.2 | The forefoot's section | 213.1 |
| Finger and thumb breadth at the distal joint | Shirato 2017: index 13.8 (0.6) women, middle 14.0, thumb 17.5 mm | none | Each digit's shaft at its distal joint, the tip dome's base | not read by definition |
| Stature, crotch height | ISO 7250-1 6.1.2; ANSUR II | none | A check of the root height law | not read |

Bone and tissue apart, where a source gives both: the humeral and femoral biepicondylar breadths, the bistyloid and the bimalleolar breadths are bony (`AutoMovieHumanF1FieldModel`, unresolved on f1: its skin shows 75.0, 55.7, 107.8 and 61.3 mm); forearm girth follows muscle nearly alone (Martin 1990: correlation 0.96 with muscle mass, abstract only); arm, thigh and calf girths carry a skinfold the somatotype formulas remove (Heath and Carter, secondary source). The split of a girth change between front depth and side breadth at the waist has no published closed form: the first shape mode of torso sections is anterior weighting (Thelwell 2020) and the sagittal diameter follows visceral fat (abstract only), which says a waist gain goes mostly forward. That stays the person's own depth and breadth as inputs, and no law is invented for it.

## The hypotheses, decided

### The section law

One law for every family, at each measurement site and between sites.

1. **Centre.** The section is laid about the skeleton's crossing of its plane, a point stated in the bone's frame. The course keeps carrying the frames; the origin line (`IFamily.origin`) puts the section's chart on the centre line so the star-shape margin is the section's own.
2. **Reaches.** The four reaches at a site are the published breadth and depth there split by the site's share (front share of depth, medial share of breadth), a prior in the part's normalised coordinates. `ISize` becomes the four reaches the field model already asks for.
3. **Fullness.** The site's girth closes the fullness: one scalar moves every shoulder of the section along its admissible interval until the section's taut tape equals the girth. A conic's shoulder is `rho = w / (1 + w)` for its middle weight `w` (Sanchez-Reyes 2011), a quarter circle has `rho = sqrt(2) - 1`, and the area under an arc is monotone in `w`; the perimeter has no closed form, so the closure is a one-dimensional root solve in the shared constraint owner, bracketed by the layout's bounds and refused outside them.
4. **Between sites.** Reaches follow a profile through the sites that keeps f1's run of convex and concave stretches (the limb law's quintic profile, accepted on frames in its own study); the fullness scalar follows the same profile. Both are applied to the source function with its derivatives (`AutoMovieHumanNativeScaleProfile`).
5. **Bone.** Where a published bony breadth exists (elbow, wrist, knee, ankle, bicristal, biacromial) the site's bony reach is that breadth and tissue is what the caliper adds; a tissue change scales the tissue alone. Elsewhere bone and tissue stay one reach about the skeleton's centre.

What this changes for the owner's two sentences: a girth no longer goes into one direction, because breadth, depth and girth are three inputs with three unknowns; and a tissue change moves fullness and tissue reach while the joint centres, the bony reaches and the centre line stay.

### The trunk

The trunk's map shows what its nets carry, and each is one of three kinds.

| What the map shows | Stations | Kind | Where it goes |
| --- | --- | --- | --- |
| The back median band (spinal furrow between the erectors), past -8 mm | 220 to 636 | A groove along the form | The wall's back median anchor on the furrow's floor and an anchor on each erector's crest: an inflection line |
| The buttocks either side of the cleft, past +8 mm | 64 to 220 | Volume the wall leaves out | The wall, on the skin; the cleft is the back median anchor's floor below the furrow |
| The front median band and the fields beside it | 28 to 250 | Volume and the groin's valley | The wall; the inguinal line as an off-axis anchor where the map keeps a valley after the refit |
| The fields either side of the sternum | 440 to 520 | The wall bridging both breasts | The bare chest wall under the breasts' footprints; the mound is the breast's family (the joints' batch gives it its root datum and its dividing surface) |
| The navel | 258 to 290 | A feature with its own centre | A template at omphalion in the pelvis's frame |
| Scapulae, clavicles, sternal notch, iliac crests, sacral dimples | 380 to 680, 120 to 330 | Bony features | Templates in the thorax's and the pelvis's frames, their heights carried by the skeleton and left alone by tissue |
| The armpit's knot, the shoulder | 500 to 640 | The arm's skin read twice | The joints' batch |
| Level stripes | 650 to 740 | Knots closer than the form | The neck's own family on its own course (the joints' batch creates it); its form below |

The wall on the skin was tried once on stations 28 to 380 with layouts that add the front median, the back median and an off-axis line (record: `test/.shots/family-conic-solve/2026-11-15T01-22-13/table.txt`). The stored layout alone left 2.39 mm rms and 13.4 mm at most; each richer layout was refused after its fit, at the splice to the held wall above, by one premise: the tangent lines of the arc after the front extreme meet behind the arc's start at stations 211 to 233 (least meeting 0.095 to 0.100 under the margin 0.1). The fit's own window had no refusal in 1,842 readings, which pointed at the splice between a window with an inflection anchor and a held wall without one.

The made case (`test_human_conic_lined_fade`) shows the cause is wider than a splice. A made bilateral wall carries a back median groove 10 mm deep on the lined layout and lets it end over 60 mm. Ended by taking every field to the plain section's, the wall is refused at seven stations of the fade with the earlier runs' own words, `the tangent lines meet behind the start`: the inflection's heading turns from inward of the floor's tangent to outward of it, and where the two are parallel while the points are not in line no conic joins them. No splice is in that wall. A field-by-field path between a grooved knot and a smooth one crosses that state, and a fit that leaves a groove's end to its knots' cubics will be refused there whether or not a splice stands near.

Ended by narrowing, the same groove is admitted at every station: half width `22 q`, depth `10 q^2`, turn `30 q` degrees for a width share `q` from 1 to 0.25, the floor at `90 - 10 q^2` exactly. The share bound of the section model keeps the anchors from meeting, so a groove narrows to a remainder (0.6 mm deep and 5.5 mm half wide at `q = 0.25` on the made wall) and does not vanish on one layout.

Conic lofting's own practice agrees with the narrowing. In the method as Raymer's text gives it (a course handout that reproduces it, pages 14 to 24 read; Liming's own texts were not obtained) each section's conic is set by its two end points, the meeting of their tangents and a shoulder point, and the one rule along the body is that each of those points is joined station to station by a smooth line; a canopy's bump is a conic of its own that "grows smaller towards the rear" while its end points "hold the same tangent angles". A feature ends by shrinking with its tangents kept, not by turning them.

So the trunk's whole fit stands on two things: one layout with no splice inside it, and a law for how each feature line ends, a narrowing in which the inflection's turn and the floor's depth go down with the width. Where a groove truly ends (the spinal furrow above the shoulders, the linea alba below the navel) its remainder must be under what the skin shows, or the layout changes there by a declared conversion.

Sections stay level through the torso, because ISO 8559-1 takes its girths horizontally. The section's chart moves onto the centre line (cause 2).

### Neck

The neck's wall is fitted by the joints' batch on its own course with sections square to it. Its form law here: knots at the base ring, the least girth (the published neck girth's level) and the ring under the skull, and one inflection line each side for the hollow before the sternocleidomastoid, whose ridge runs from the mastoid process to the manubrium and the clavicle's medial third (Gray, by a tertiary page). Its thickness at mid neck is 8.1 (2.0) mm relaxed (ultrasound, 16 adults, read in full); belly width norms were not obtained, so the ridge's breadth is read on f1 as a share of the neck's girth and marked as a prior of one person.

### Limbs

On the limbs the wall is the skin, so the section law applies as it stands. The nets that remain are features with their own centre and each becomes a template in its bone's frame, as the joints' note already asks of the bone ends: the olecranon and the epicondyles, the patella with the hollows beside it, the tibial tuberosity, the malleoli with the hollows beside the tendon, the extensor tendons on the dorsum, the thenar and hypothenar pads. Their heights follow the class of what makes them: bone and tendon by the skeleton, a pad by tissue.

### Feature templates

One record serves every feature with its own centre (`frame/AutoMovieHumanFeatureTemplate`): a centre and two directions in its segment's frame, two half extents, a height, a class, and two shape numbers, the footprint's superellipse exponent (2 an ellipse, more a squared strip or bed) and the share of the radius its height is whole over before a quintic ramp (absent, a bump `(1 - r^2)^3`). Both profiles meet their wall C2. `between` makes a feature that runs from one landmark to another (a tendon, a clavicle, a muscle's ridge); `at` carries a template to a person: place and extent by the skeleton's ratios, height by tissue for a pad only.

The record was widened once for the nails' work: a nail's bed is a squared footprint with a plateau and ramps, which the exponent and the flat share state. What it does not hold is a relief with several height laws side by side in one window (a plate's bed with its two lateral folds as one net): that is several templates on one segment, each with its own centre and class, composed where their footprints meet; a net that mixes them stays the nails' own until its parts are named.

#### The landmarks and the features read on f1

One tracked instrument reads both, `test/src/reference-conics/FamilyConicBodyFeatures.ts`, in one run of 17 seconds (reading `packages/human/.shots/body-one-shot/features-2`: `landmarks.txt`, `features.txt` and two stills a region). A published definition names a bony point by palpation; on a skin a tool can apply it only where the bone shows, and what shows is a height over the skin round it. So every landmark is a window and an extremum. The window is fixed by joint centres and segment directions (three trunk windows by ANSUR II women's height ratios, three SDs each way). The skin's height over it is read by rays from inside the body. The baseline is the surrounding skin continued across the window: the cubic through the window's rim for a point, the quadratic through each station's two side bands for a line. The landmark is the residual's extremum, found only inside 0.7 of the window and over the greatest of 0.5 mm, three times the baseline's own residual on the rim and three times the opposite-signed residual inside it (a baseline that misfits smooth skin leaves both signs alike; a feature leaves one). The acromion alone is read by the chord rule the stored cervicale reading uses, because a shoulder is a convex corner with no rim. Left side and median plane only.

The same reading is the feature's size: its height is the extremum's residual and its half extent is its half width at half height over 0.4542, the radius at which the template's bump is at half height.

Twelve of thirty-six windows found their landmark. Pixels are in the 1000 by 1000 stills of `features-2`, each opened; a red cross is a found landmark, a green outline its window, a blue outline a window that found none.

| Landmark or feature | Definition's source | Found | Reading on f1 | Still and pixel |
| --- | --- | --- | --- | --- |
| Acromion, as the shoulder point | ANSUR II handbook p. 23 | yes | 12.2 mm above a chord of 185 mm; 174.4 mm off the median plane, so a biacromial breadth of 0.205 of stature against 0.2244 (0.0096), -2.0 SD: the corner, not the palpated point | `shoulder.front` 238, 583 |
| Suprasternal notch | ANSUR II p. 63 | yes | -3.64 mm; half extents 28.8 by 19.7 mm | `neck-front.front` 531, 249 |
| Sternoclavicular head | Wu 2005, 2.3.1 | no | 0.92 mm against a floor of 2.66 | window about 437, 143 |
| Clavicle's line | ANSUR II p. 29 | yes | a ridge over 86 of 120 mm, 1.96 mm mean, 3.37 greatest; half width at half height 10.6 mm | `shoulder.front` 418, 565 to 877, 568 |
| Sternal channel | - | yes | a groove of 4.71 mm mean depth over 171 of 180 mm: the wall and the two mounds | `neck-front.front` 531, 265 to 531, 912 |
| Cervicale | ANSUR II p. 27 | yes, marginal | 0.88 mm against a floor of 0.75, at 0.8495 of stature (0.8570 (0.0068), -1.1 SD); the stored reading's chord rule had rejected it | `back-upper.left` 493, 248 |
| Scapular spine, medial border, inferior angle | Wu 2005, 2.3.3 | no | no station over 0.5 mm; 0.79 mm at the window's edge | `back-upper.back`, three blue windows |
| Spinal furrow | ANSUR II p. 50 | yes | a groove at every station from 952 to 1,284 mm, 6.57 mm mean, 10.86 greatest, half width 14.3 mm | `back-lower.back` 462, 128 to 462, 874 |
| Sacral dimple (PSIS) | Wu 2002 | no | -0.54 mm against 0.62 | window about 560, 709 |
| ASIS; iliocristale | Wu 2002; ANSUR II p. 39 | no | 0.37 against 0.51; 1.33 at the window's edge against 1.85 | `pelvis-front.front`, two blue windows |
| Omphalion | ANSUR II p. 70 | yes | -8.14 mm at 0.6165 of stature (0.6017 (0.0135), +1.1 SD); half extents 20.1 by 18.2 mm, on facets of 11 mm | `pelvis-front.front` 792, 410 |
| Mastoid | - | no | 0.88 against 1.90, behind the auricle | `neck-side.left`, blue window |
| Sternocleidomastoid's line | - | yes | a ridge over 108 of 114 mm, 2.00 mm mean, 4.45 greatest, half width 9.9 mm | `neck-side.left` 471, 402 to 691, 881 |
| Olecranon | ANSUR II pp. 22, 52 | no | 1.48 mm with 1.31 of the opposite sign beside it, against 1.92: a baseline's misfit, and the still shows no bump | `elbow.back` (features-1) |
| Humeral epicondyles; styloids, as prominences | Wu 2005, 2.3.4, 2.3.6 | no | 0.30 to 0.74 mm; they stay the stored section extremes | `elbow.back`, `wrist.left` |
| Four extensor tendons | - | no | 6 stations of 244 over 0.5 mm | `hand-dorsum.top` (features-1) |
| Thenar, hypothenar as bounded mounds | - | no | the thenar's window leaves the hand (568 rim samples of 692): a mound as wide as what it stands on | `hand-palm.low-oblique` (features-1) |
| Patella | ANSUR II pp. 48, 62 | yes | 1.72 mm, 16.7 mm below and 16.0 mm medial of the knee's centre; half widths 6.9 to 16.7 along, 13.2 across on the one side that closed | `knee.left` 538, 572 |
| Parapatellar hollows; tibial tuberosity | Wu 2002 | no | -0.46 and -0.32; 0.39 against 0.86 | `knee.front`, blue windows |
| Lateral malleolus | ANSUR II p. 44 | yes | 2.22 mm against 0.87; half extents 24.1 by 21.7 mm; the stored reading's global extreme had rejected it | `ankle.left` 551, 735 |
| Medial malleolus | ANSUR II p. 22 | yes | 1.84 mm against 0.90; 19.2 by 11.8 mm, the breadth under one 8.9 mm facet; the lateral stands 1.8 mm lower and 14.7 mm behind it | `ankle-medial.back` 356, 509 |
| Retromalleolar hollows | - | medial yes, lateral no | -2.34 mm, 37.7 by 11.1 mm; lateral -0.79 against 0.81 | `ankle-medial.back` 523, 474 |
| Achilles' line as a ridge | - | no | 12 stations of 61: the shank's back itself, not a ridge on a wider surface | `ankle.back`, blue window |

What the reading limits. The reference's facets are 5 to 11 mm where its features are 10 to 25 mm wide (the instrument prints each window's median edge), so a half width under one facet is a lower bound, and a height of 2 mm stands on two or three facets. The floor's 0.5 mm is the stored landmarks' instrument's own. A window that is set by a rig joint can miss its feature: the first run's navel stood on the rim of such a window, and the height ratio's window found it.

What the research pass found (one reader; the ANSUR II handbook's chapter 5 read directly for the definitions quoted above): clavicle length 141.2 mm in women and 154.8 in men (Hoogervorst 2018, CT, no SD); patella 36.07 (1.49) wide and 16.24 (0.92) thick in women (Muhamed 2017, MRI); Achilles tendon 13.3 (1.0) wide and 5.4 (0.5) thick in women (Mello 2006); an extensor tendon of the hand 4.39 (0.71) wide and 1.29 (0.19) thick (Meng 2010); sternocleidomastoid 8.10 (2.0) thick at rest (Pirri 2021); skin to the L4-L5 spinous process 11.8 (5.6) mm (Kartufan 2020); soft tissue lateral of the iliac crest 21 to 25 (11 to 12) mm at 16 to 35 years (Town 2023). These are bone, tendon and tissue dimensions. How far any of these features stands out of the skin round it was found published for none, so the heights below are priors read on f1.

#### The laws

`frame/AutoMovieHumanFeatureLaws` holds every catalogue feature in exactly one of three lists, and one constructor, `template(law, datums, length)`, makes any law's template through the widened record.

| List | Features | What it holds |
| --- | --- | --- |
| `LAWS`, nine templates | navel, sternal notch, cervicale, clavicle, sternocleidomastoid, patella, lateral malleolus, medial malleolus, medial retromalleolar hollow | The landmarks that place it (one, its centre; two, the ends it runs between), the length that sizes it (stature; the knee's skin breadth over the femoral epicondyles; the ankle's skin breadth through its centre) and its half extents and height as shares of that length: f1's reading divided by f1's length, two figures, each row's comment giving the millimetres it was read at. A line's height is its greatest station's |
| `WALL`, eight forms the wall carries | spinal furrow, sternal channel, acromion's corner, humeral epicondyles, styloids, Achilles tendon, thenar, hypothenar | The reason each is the wall's and not a template |
| `ABSENT`, twelve | sternoclavicular head, three scapular features, iliac crest, sacral dimples, olecranon, parapatellar hollows, tibial tuberosity, lateral retromalleolar hollow, extensor tendons, mastoid | The reading that fell under its floor. Each takes a template when a source states its height or a person's reading shows it |

The shares are priors of one person, marked so in the module; a published size replaces one when a source states the size it stands for. `test_human_feature_laws` pins each law's definition on made datums: placement, directions, sizes as shares of a round length, the bump's height at the centre and on the edge, the doubling with the length, the sign of mounds and hollows, the class's behaviour under tissue, the catalogue's one-list rule and three refusals.

#### The landmarks as placing datums

A law's landmarks must reach generation as points in their segments' frames. Nine are stored today (`AutoMovieHumanF1Landmarks`: both humeral and both femoral epicondyles, both styloids, pternion, suprasternale, the third metacarpal's base). The request, W13, is for the joints' worker's files `AutoMovieHumanF1Placing.POINTS`, `AutoMovieHumanF1Placement` and `AutoMovieHumanF1Landmarks`: the eight points this reading found, each by this instrument's rule as its definition and re-based into its segment's frame by `FamilyConicRebase.ts --tables` like the stored ones: `omphalion` (pelvis), `cervicale` and `acromion` (thorax), `midpatella`, `malleolusLateral`, `malleolusMedial` and `retromalleolarMedial` (tibia), and the two ends of the two lines, `sternoclavicular` (thorax) and `mastoid` (head), which the reading did not find as prominences and which therefore enter as the found ridges' ends (the clavicle's medial end and the sternocleidomastoid's upper end). The module's comment that the malleoli and the vertebra prominens are not stored is then revised: over a baseline both malleoli stand, and cervicale stands marginally. The face's work asks for its two tragus points by the same route.

### Knots

A family's knots are its landmark stations, each stated as a place in its run: the run's ends, each site, and each extremum of each outline between them (one maximum for each belly, one minimum at each joint's waist). Two knots stand no closer than half the section's mean reach there, the scale of the form the wall carries. The count this gives against today's: neck 3 against 6, upper arm and forearm about 12 against 21, thigh to ankle about 14 against 31; the figures are estimates until the outlines' extrema are read from `<family>.stations.txt` in the batch.

The rule run on every stored family (tool `run-7/knots.txt`: run ends are the course's joints inside the fitted stations, the trunk's are its segment origins; sites from the site owner; extrema of each extreme's own coordinate along the stored wall; least spacing half the mean reach). The stored walls carry the trace's small waves, so the extrema found are an upper reading:

| Family | Stored knots | Rule's knots | Run ends, sites, extrema | The rule's stations, mm |
| --- | --- | --- | --- | --- |
| Trunk, to 740 | 25 | 10 | 4, 5, 1 | 28; hip 105.0; hip centres 124.8; omphalion 267.4; least side reach 331.9; under-bust 427.7; bust 474.7; suprasternale 635.5; neck 690.3; 740 |
| Arm, to its cap | 27 | 15 | 5, 3, 7 | 32; 78.1; mid upper arm 130.0; 177.3; 243.3; elbow 263.0; 293.3; forearm 313.0; 353.1; 426.8; 491.9; wrist's centre 505.0; 548.6; 570.5 |
| Hand | 8 | 6 | 3, 1, 2 | 448; 491.0; wrist 504.9 and 505.0; 549.9; 570.5 |
| Leg | 41 | 15 | 5, 4, 6 | 104; 386.6; knee 438.5; 515.9; calf 563.5; 710.1; ankle 794.0; ankle's centre 825.6; 884.2; 912.7; 938.6; ball 964.2; 975 |
| Breast's cap | 4 | 2 | 2, 0, 0 | 11; 26 |
| Fingers: middle, ring, index, little, thumb | 8, 7, 5, 6, 6 | 9, 8, 5, 6, 8 | their two joints and both ends; 1 to 5 extrema | middle 21, 30.4, 38.7, 44.0, 54.3, 70.9, 75.5, 79.2, 89; index 18, 28.1, 40.9, 61.8, 81 |
| Toes: big, second, middle, fourth, little | 4, 4, 2, 2, 3 | 4, 4, 3, 3, 3 | their joint and both ends; 1 extremum | big 21, 28.8, 36.6, 48.4; little 20, 23.3, 30 |
| All | 152 | 101 | | |

Each station's place in its run is in the tool's file (`<station> <basis> run <index> at <tau>`), which is what fit request F3 takes. The limbs and the trunk lose a third to two thirds of their knots; the digits keep theirs, since their joints alone are four knots on five to eight. The neck's three knots (suprasternale, the neck girth's site, the upper ring) are the trunk's last run here and become the neck family's own.

### Tips

A digit's end is a dome in its distal bone's frame: its base is the section where the pad begins, its pole is the pad's far point (a datum of the distal segment, already stored for every digit and read by the nails' work), and its profile from the base to the pole is one conic whose shoulder is the dome's fullness. The cap's law today closes about the course's end with the base's box fill; the reference's sections lose fill toward the pole (0.81 to 0.70 on the index finger) and gather about a point off the course on the toes (the little toe's `-u` reach 4.45 against 3.67). `ITip.centre` and `ITip.own` already move the cap's middle; what the tool's readings ask for is a cap that starts by the section's reach (below) and a pole on the pad's far point. A digit's course ends on the line from its last joint through its stored pad datum (code: `AutoMovieHumanF1Joints`), so the pole follows that datum and stays on the course by construction; the toes' datums are read again by their definition. The nail's plate and folds are the nails' work and stand on this dome.

Each end read as a half ellipsoid (tool, `run-4/summary.txt`: least squares of `r(d) = R sqrt(1 - (1 - d / H)^2)` on the sections' mean reaches before the pole), length over the base's reach:

| Digit | Reference | Generated | The generated cap |
| --- | --- | --- | --- |
| Index, middle, ring, little finger | 1.78, 1.39, 1.36, 1.45 (rms 0.08 to 0.17 mm) | 0.54, 0.67, 0.48, 0.76 | 3.1 to 3.9 mm long |
| Thumb | 1.09 | 0.56 | 3.6 mm |
| Big, second, middle toe | 0.78, 0.83, 1.08 | 1.22, 0.73, 0.65 | 7.7, 5.6, 4.7 mm |
| Fourth toe | 1.66 (rms 0.79 mm: a poor fit) | 0.66 | 4.4 mm |
| Little toe | 0.73 | 0.89 | 3.4 mm |

So the fingers' bluntness has one measured cause: the cap law already draws a half ellipsoid from wherever it starts, and it starts a fixed 3 to 4 mm before the pole, where the trace's last section happened to be, on fingers 5 to 6 mm in reach. The law is where the cap starts: the station at which the stretch left before the pole is a share of the section's own reach (`AutoMovieHumanTipDome.start`, the rule the toes' `rounded` holds for one share). The share is a prior of the digit's kind in its own normalised coordinate, read on f1 alone: about 1.5 for a finger, 1.1 for the thumb, 0.8 for a toe. The little toe's point is the other half: its pole stands on the course while the reference's end gathers 0.8 mm toward `-u`.

What the dome publishes, for the nails' work, which generates its bed and plate on this surface and lands in the same round:

| Published | Meaning | Frame |
| --- | --- | --- |
| Base | The station where the pad begins and the section there: its four reaches and its shoulders | The digit's course, in the distal segment's frame |
| Pole | The pad's far point, the course's last centre | The distal segment's frame |
| Profile | The conic from the base to the pole on each of the four sides: its end tangent at the base (the wall's own slope), its tangent at the pole (square to the course) and its shoulder | The plane through the course and each extreme |

Published sizes: nail width over distal joint breadth 0.66 to 0.69 on the index finger (derived from Shirato 2017); a distal segment 25 by 20 by 18 mm, the tissue asymmetric about an elliptical bone (Wu 2006, pages 1 to 4). No toe tip geometry was found.

### The breast

The mound is one family from a root datum inside the chest wall (the joints' batch), on the bare chest wall the trunk's refit leaves. Its form law takes five measures, each at its own site:

| Measure | Solves |
| --- | --- |
| Bust point breadth | The apex's place across |
| Bust height and under-bust height | The apex's height and the lower pole's length |
| Under-bust girth | The chest wall under the mound (the trunk's site) |
| Bust girth | The projection: the tape over both mounds on the solved wall |
| Suprasternale to bust point (from the two heights) | The upper pole's length, and with the lower pole's the droop |

The base is three radii from the apex's foot (medial, lateral, inferior), as the volume formula takes them; the upper pole has no radius in it and is the slope from the mound's upper edge, which the two heights place. The mound's volume is tied to the radii by `V = (pi / 3) MP^2 (MR + LR + IR - MP)` (Qiao 1997, read in Kayar 2011; r 0.975 against specimens). How a change of volume is shared is read from two published tables, and it is not the similar solid's cube root this note first assumed. On breast CT (219 women; group means by cup, read as a summary) the volume goes 324.7, 467.9, 803.1 and 1,203.7 ml from cup A to D, a ratio of 3.71, for which a similar solid would grow 1.55 times in every length; the diameter at the chest wall goes 11.1, 11.4, 13.0, 13.7 cm (1.23 times) and the length from the wall 5.7 to 9.7 cm (1.70 times). The slope of `ln diameter` on `ln volume` through the four means is 0.17. Zheng, Yu and Fan 2010 (322 women, read in full) show the same in a sizing table: breast width follows the under-bust girth (13.1 to 16.0 across four bands; 14.1, 14.2, 14.0, 14.2 across four cups of the 75 band) and depth follows the cup (4.3, 4.8, 5.3, 5.9), the depth over the width rising from 0.25 to 0.55 from AA to G. So the base's radii take the volume ratio to the power 0.17 and the projection takes what the formula then asks (`AutoMovieHumanMoundLaw`, `BASE_EXPONENT`): a volume 20 % larger widens the base 3 % and raises the projection about 9 %. The base's own size belongs to the chest (the under-bust girth through the chest wall, the bust point breadth), which is why those enter as bounds. No regression on individual women was found; the exponent is a provisional prior from group means.

That is the owner's sentence in numbers: a girth does not all go into projection only because the mound was drawn as a cone on a fixed foot; the published share puts most of it there, on a base that the chest sets, and the form stays a mound because the base's radii, the lower pole's length and the apex's place come from their own measures.

### Root height

The pelvis's height above the floor is derived, not stored: the figure's lowest sole point, read on the person's chain and datums in the pelvis's frame, stands on the floor. Erect with the knees extended this is the ankle centre's height plus the shank plus the thigh along the chain's own rest angles (de Leva 1996 gives the segments as hip to knee and knee to ankle centres, read in full). Every course and datum hangs on the chain, so the whole figure follows the root; the one reader of the reference's world, `AutoMovieHumanF1NativeBuild.skinPoint`, reads the trunk's station on f1's axis and takes the person's axis instead. MPFB2 does the same by a shift of the whole object by its lowest vertex after shaping (`humanservice.py` 1617 to 1619).

## One side, mirrored

Every paired part is made once, on the left (`+Z`): the arm, the hand, the leg, the foot, the breast and each digit. The right is its mirrored copy in the median plane. The trunk is the one median family, bilateral, whose half is reflected. The reference's own left and right differ slightly; the figure does not follow that difference.

What this fixes for everything in this note:

- Laws, sites, fits, knots, templates and pass conditions are stated for the left side and the median trunk. There is no right-side fit and no right-side table.
- A measure that a source gives for the right side (ANSUR II measures the right) enters as the part's measure and is built on the left.
- A difference between the figure's right and the reference's right that comes only from the reference's asymmetry is not a defect and is not recorded as one.
- A twin camera reads the mirror itself: that the right is the left's reflection with its orientation, its seams and its joins intact, and that the median seam of the trunk is smooth. It is not a second reading against the reference.

## Interlock with the joints' batch

A family is fitted by one worker at a time. The joints' note states its side under "Who fits what"; this is the other side.

| Family | The joints' batch does | This batch does, after it |
| --- | --- | --- |
| Trunk | Raises the foot 40 to 60 mm; cuts the top at the neck's base; refits `trunk.chest.side`, `trunk.shoulder`, `trunk.crotch`, `trunk.low`, `trunk.collar` on the stored wall | One refit of the wall on the skin between those two ends with the median and crest anchors, the nets refitted on it as feature templates; the centre line; the section law at four sites |
| Neck | Existence, course, two rings, a first fit; its upper ring meets the head, whose form is the face's work ([The face in one shot](face-one-shot.md)) | Its knots, the sternocleidomastoid's line, the neck girth's site on its own course |
| Breast | Family from its root datum, dividing surface, join | The mound's form law; the chest wall under it |
| Arm | Root on the humerus's course, through the wrist to the carpus | Section law at four sites; knots; the elbow's and the wrist's templates |
| Palm, thumb, fingers | Carpus and heads planes, each root proximal of its first knot | Section law at the wrist and the heads; shafts; tips |
| Leg | Root from the hip's centre; end at the heads' plane | Section law at five sites; knots; knee, ankle and sole templates |
| Toes | Roots proximal of their first knots | Shafts; tips |

### With the nails' work

Read in [Nails](nails.md) (its law, premises and one run; in part). A nail is a plate of its own merged onto its digit, with a bed relief on the digit's dorsal skin. What it consumes of the digit and what this note's tip law does to each:

| The nail consumes | The tip law's effect | What keeps the two in step |
| --- | --- | --- |
| The distal segment's frame: the last joint's centre and its distal and dorsal axes | None from the dome's start (W3). Re-reading the thumb's and the toes' pad datums (W4) moves the point the segment's axis runs to by 1 to 3 mm, and with it the axis | The nail's own frame is taken from the digit's skin (its step 3), so it follows; the datums are re-read before the nails' round, in the same batch |
| The digit's breadth across the last joint and its length from that joint to the tip on the skin | The length is kept: the pole is the pad datum. The breadth is the wall's, unchanged | - |
| The dorsal skin from the proximal fold to the tip, read at realization: the plate's sections are the digit's own dorsal arc, and the free edge stands where the crown is one thickness over the skin, read back from the tip | This is the surface the dome changes. A finger's cap will start about 1.5 reaches before its pole (index finger near station 75 for a pole at 84.4) in place of 3.4 mm, so the dorsal skin falls away sooner over the last 9 mm and the free edge moves back along the digit | The nail reads the skin, not a stored station, so it follows; its free edge's place and its cap's "shortened by halves" rule are re-run on the dome, and its premise "the curve keeps off the plate's pole" is read again there |
| A bed relief whose window runs into the digit's cap (index 70.2 to 84.38 mm, the cap from 81; probed, its last three rows zero) | The cap then covers most of that window (from about 75) | The premise "a relief may run into the digit's cap" was probed with 3.4 mm of cap inside the window; it is probed again with 9 mm, on all ten digits, before either work claims a tip |

Tips and nails land in one round: the dome law is wired (W3, W4) and the nails' probe is rerun on it before the round's frames are read.

### With the face's work

Read in [The face in one shot](face-one-shot.md) (the neck's rows, the ring and the head's family; in part). The head is one family on the neck's course continued to the crown, and it begins at the ring through the cervical point: the plane square to that course at the corner between the floor under the jaw and the neck's front (Legan and Burstone's C), 71 mm below the head's origin along a course leaning 17.2 degrees forward. Below the ring every section holds the neck alone.

| Of the neck | Whose | Shared at the ring |
| --- | --- | --- |
| The neck's surface from its base ring to the ring at the cervical point: its knots (base, least girth, upper ring), the neck girth's site, the throat's front and the nape | This work | The ring's section is one curve: the neck's last and the head's first, a continuation |
| The sternocleidomastoid's ridge and the hollow before it | This work, from the manubrium and the clavicle's medial third up to the ring | The muscle runs on to the mastoid process, above the ring, behind the ear. Its line is one contour authored once, in the neck's frame, and the head's wall reads its value, slope and bend at the ring and carries it to the mastoid, so no shelf stands where the two families meet |
| The floor under the jaw, the jaw's line and angle | The face's work | The floor meets the neck's front at the ring's front point, the cervical point itself |

The neck's upper form ends at the ring. The neck girth (ISO 8559-1 5.3.2, square to the neck's axis below the thyroid cartilage) lies between the two rings on the neck's own course, where a section is square to that axis by construction.

Until a family's joints fit is stored, this batch saves no module of that family. What it can build beside the joints' batch is what no family file holds: the laws themselves as new modules with their unit tests.

## The batch

### Law and representation changes

| # | Piece | Where | Made case that fails first, with its closed form |
| --- | --- | --- | --- |
| 1 | Girth closure: one fullness scalar moving a section's shoulders until its tape equals a girth | New Human module beside `AutoMovieHumanNativeScaleProfile` | An ellipse section with semi-axes 100 and 60: at the scalar that leaves `rho = sqrt(2) - 1` the tape is Ramanujan's perimeter within the conic chain's own error; asked for a tape 3 % longer the solve returns a scalar whose section measures it within 1e-6, and a girth past the layout's bounds is refused by name |
| 2 | Four reaches a site in place of two calipers; tissue about a stated centre | `AutoMovieHumanF1NativeFieldTypes.ISize`, `AutoMovieHumanNativeFamily.ISpec.centre` callers | A made circular section off its course by 10 mm, tissue 1.2: the bone's point keeps its place exactly and each reach from it grows by 1.2 |
| 3 | Root height | New Human module; `nativeFrom` calls it | A made chain with the shank 1.1 times as long: the sole datum's height is 0 within 1e-9 and the pelvis has risen by the shank's change along its rest direction |
| 4 | Tip dome: the pole on the pad datum, a shoulder taper along the cap | `AutoMovieHumanConicLoft.ITip`, the digits' course ends | A made circular tube closed by a hemisphere: every cap section's radius is `sqrt(R^2 - x^2)` within the cap's stated error; today's law misses it by its box fill staying one value |
| 5 | Breast mound law: a volume to three base radii and a projection under the measures' bounds | New Human module | Qiao's volume identity on a made mound; a bust girth 5 % larger at one under-bust girth widens the base and raises the projection, each by its stated share |
| 6 | Knot rule: landmark stations by run place, a least spacing from the section's reach | The fit tool's knot choice (a need, below) | A made tube with one belly: three knots, at its ends and its maximum |
| 7 | Feature templates in bone frames with a height class | With the joints' "reliefs placed in a bone's frame" | A template of class bone keeps its heights under tissue 1.2 |
| 8 | The trunk's layout with median and crest anchors, fitted whole | The fit tool; the trunk's family | A made bilateral wall with a median groove 10 mm deep that ends over 60 mm (`test_human_conic_lined_fade`): ended by blending its fields to the plain section's it is refused inside the fade; ended by narrowing it is admitted at every station with the floor at `90 - 10 q^2` |

### Built so far

Seven laws exist as modules under `packages/human/src/generation` that read no family, each with its unit test under `test/src/features/human/frames` (seven of seven passing in one run). None is wired into the figure yet, because their consumers are files the joints' batch is rewriting; [Wiring and fit requests](#wiring-and-fit-requests) states each consumer's change.

| Law | Module | Test, made case |
| --- | --- | --- |
| 1 Girth closure | `conic/AutoMovieHumanNativeGirthClosure` | `test_human_native_girth_closure`: an ellipse's tape against the Gauss-Kummer perimeter; closed on girths 3 % longer and shorter within 1e-6 mm with the extremes untouched; a made bilateral section |
| 2 Four reaches, tissue about a centre | `conic/AutoMovieHumanNativeSiteReaches` | `test_human_native_site_reaches`: a circle of 50 mm whose centre stands 10 mm off the course: tissue 1.2 leaves the centre and takes each reach to 60 (about the course point the front would stand at 72 and the centre at 12); bone of 20 mm keeps 20; unequal sides |
| 3 Root height | `frame/AutoMovieHumanStandingRoot` | `test_human_standing_root`: a shank 1.1 times as long drops the unplaced foot by `42 cos 0.1 cos 0.05` mm and the placed root rises by exactly that |
| 4 Tip dome's start | `conic/AutoMovieHumanTipDome` | `test_human_tip_dome`: the closed form for a linearly tapering reach; twice the thickness, twice the dome |
| 5 Breast mound | `conic/AutoMovieHumanMoundLaw` | `test_human_mound_law`: the hemisphere's volume `(2 / 3) pi R^3` from Qiao's formula; the base's exponent recomputed from the CT study's four means; a volume 1.2 times larger grows the base by `1.2^0.17` and the projection by more than a similar solid's and less than 1.2; with the lateral radius at its bound the projection takes more, the volume exact |
| 6 Knot rule | `conic/AutoMovieHumanKnotRule` | `test_human_knot_rule`: one belly gives three knots; two runs with a belly and a waist give six at the closed-form extrema; a site within the spacing of an extremum replaces it |
| 7 Feature template | `frame/AutoMovieHumanFeatureTemplate` | `test_human_feature_template`: a bone and a tendon keep their height under tissue 1.2, a pad takes it; the centre follows a longer, narrower segment; placed on a frame turned 0.5 and 1.0 rad it rides the frame; the height meets its footprint's edge flat |
| 9 Feature laws | `frame/AutoMovieHumanFeatureLaws` | `test_human_feature_laws`: every law on made datums at a length of 1,000 mm, so a share of 0.012 is 12 mm; written, its first run not yet made when the body's work was paused |

Law 8, the trunk's layout fitted whole, is the fit tool's (below); its made case exists, `test_human_conic_lined_fade`, and what it showed is under [The trunk](#the-trunk).

### Wiring and fit requests

For the joints' work, which holds `AutoMovieHumanF1.ts`, the native builder's window and `FamilyConicBody.ts`. Each row is one change of one consumer; line numbers are of the tree as read on 2026-11-17.

| # | Consumer | Change | Module it calls |
| --- | --- | --- | --- |
| W1 | `AutoMovieHumanF1.nativeFrom` (lines 642 to 646) | After the hip support, `chain = AutoMovieHumanStandingRoot.place(AutoMovieHumanF1Placing.CHAIN, chain, "foot", [0, 1, 0])` | Root height |
| W2 | `AutoMovieHumanF1NativeBuild.create` (lines 86 to 104, `trunkAxis`, `stationOf`, `skinPoint`) | Read the trunk's axis of `bone.body.trunk`, the person's, in place of `original.body.trunk`: with W1 the person's trunk stands at another height than f1's and a station read on f1's axis is off by the root's rise | - |
| W3 | `AutoMovieHumanF1.DIGITS` and `rounded` (lines 203 to 263) | Every digit's cap start from `AutoMovieHumanTipDome.start(reach, end.tip, share, family.knots[1])` with the reach `rounded` already reads; shares 1.5 for the four fingers, 1.1 for the thumb, 0.8 for the toes, each a named constant with its basis (the dome table above); a `held` result becomes a diagnostic | Tip dome |
| W4 | `AutoMovieHumanF1Joints` pads `bigtoePad` to `littletoePad` and the ends built on them (`littletoeEnd` is `beyond(littletoe2, littletoePad, 4)`, code) | A digit's course already ends on the line from its last joint through its pad datum, so the pole is where that datum puts it. On the toes that line leaves through the dome's upper front (frame `toes.left.curves-over-clay`); the little toe's reference end gathers 0.8 mm toward `-u` of it (tool). Measured (tool `run-6/summary.txt`): every digit's stored pad datum lies on its course (0.00 to 0.01 mm off) within 0.12 mm of its pole, so the pole is the datum. The reference's last sections gather off it, as their centroids in the chart less than a millimetre before the pole: fingers within 0.5 mm (index [0.11, 0.28], middle [-0.16, 0.51], ring [-0.09, -0.17], little [0.19, 0.24]); thumb [-1.32, -0.10]; big toe [-0.96, -1.59], second [-1.17, 0.36], middle [-0.92, 0.60], fourth [-2.59, 1.79], little [-1.89, 0.23]. The fingers' datums are the pads' far points; the thumb's and every toe's stand 1 to 3 mm toward `+u` of where the reference ends. Each of those six datums is read again by its definition, the far point of the distal segment's skin along its distal direction, before W3 moves the cap | - |
| W11 | `AutoMovieHumanF1NativeCalibration.readReference` (lines 243 to 244: the finger's and the toe's caliper at `family.knots[0]`) | The digit's site by a definition, the breadth across its proximal joint, as a station of `AutoMovieHumanF1NativeSites`. The correction queue moves the digits' first knots from 16 to 25 mm down to 2 to 8 mm, inside the palm's and the foot's envelope, where the first knot's section is a ray territory with its closure | - |
| W12 | `AutoMovieHumanF1NativeSites.evaluate`, the wrist's site (`site("hand", ...)`, 504.88 mm) | On the arm's family once the arm runs through the wrist: the refitted palm runs from 519.5 to 584.8 mm, so the wrist lies proximal of its first knot. The hand's site (579.37) stays on the palm | - |
| W13 | `AutoMovieHumanF1Placing.POINTS`, `AutoMovieHumanF1Placement`, `AutoMovieHumanF1Landmarks` | The placing datums of the feature laws: `omphalion`, `cervicale`, `acromion`, `midpatella`, `malleolusLateral`, `malleolusMedial`, `retromalleolarMedial`, `sternoclavicular`, `mastoid`, each by the rule of `FamilyConicBodyFeatures.ts` as its definition, stored in its segment's frame | Feature templates |
| W5 | `AutoMovieHumanF1NativeFieldTypes.ISize` (lines 17 to 23) | Gains `girth?: number` (the site's taut tape, mm) and the four reaches in place of `depth` and `breadth` (`AutoMovieHumanNativeSiteReaches.IReaches`), with the site's `IShares` held by `AutoMovieHumanF1NativeSites` | Site reaches |
| W6 | `AutoMovieHumanF1NativeCalibration.ratio` (lines 93 to 96) and its callers in `NativeBuild` (lines 78 to 85, 282 to 287, 343 to 350) | One ratio a reach, about the site's centre; the profile carries four ratios | Site reaches |
| W7 | `AutoMovieHumanF1NativeBuild.make` (lines 172 to 181, the call of `AutoMovieHumanNativeFamily.create`) | Passes `centre`, the skeleton's crossing of each section as a `Profile.ICentre` (`AutoMovieHumanNativeFamily.ISpec.centre`, line 61, built and passed by no caller) | - |
| W8 | `AutoMovieHumanNativeFamily` (line 87, where a field of unit `mm` is scaled and a share is kept) | A share field takes the site profile's fullness: `AutoMovieHumanNativeGirthClosure.shift` at the profile's scalar, the scalar at each site from `solve` on the section whose extremes W6 has placed | Girth closure |
| W9 | The breast's family once it starts from its root datum | Its base radii and projection from `AutoMovieHumanMoundLaw.mound`, the volume closed on the bust girth's tape by the tape owner (`AutoMovieHumanF1NativeTape`); `breastProjection` leaves `IFields` | Mound law |
| W10 | `AutoMovieHumanF1NativeBuild.trunkFeature` (lines 248 to 266) | A net's ratio by its class in place of its name: the name-string branches go when the nets are templates | Feature template |

State of these requests after the joints' work released `NativeBuild`, `NativeFieldTypes`, `NativeCalibration`, `NativeSites` and `NativeFamily` to this one and kept `AutoMovieHumanF1.ts` and `AutoMovieHumanF1NativeRoots.ts`:

| Request | State |
| --- | --- |
| W11 | Applied. `AutoMovieHumanF1NativeSites` holds a `digits` group (the representative finger's and toe's site at the station of the digit's course at its second centre) and `AutoMovieHumanF1NativeCalibration.readReference` reads the calipers there. f1 cannot move by it: a digit's native scale is the ratio of a person's caliper to f1's at the same site, exactly `[1, 1]` at f1's own (`test_human_f1_native_digit_sites`) |
| W5 to W8 | Not applied, and held by one file. The arm's, the leg's, the breast's and the nose's families are created in `AutoMovieHumanF1NativeRoots` (its own call of `AutoMovieHumanNativeFamily.create`, and one `S.P` ratio a site at lines 113 to 138, 193 to 206 and 325 to 336), and every site's junction target is built from that one ratio. The change is one for all sites of all families or it is a branch for some: it lands when `NativeRoots` passes each site's four ratios, its fullness and its centre in the same batch as `NativeBuild` |
| The consumer both will call | Built: `conic/AutoMovieHumanNativeSiteSection.solve(values, layout, site)` carries a section's extremes to the person's four reaches about the site's centre and closes its fullness on the girth, for every layout of extremes and medians (all the body's stored families). `test_human_native_site_section` pins it: a site at its own measures returns the given array itself; a girth 7 % larger leaves the eight extreme coordinates and raises every shoulder to a tape 1.07 times as long; tissue 1.2 over 20 mm of bone keeps the centre and takes the sides to 56; a trunk 7 % broader moves its side extreme alone |
| W12 | Waits for the joints' declarations: on today's stored families the wrist's station lies on both the arm's and the hand's |
| W13 | Requested, not applied: the eight found landmarks and the two lines' ends as placing datums in the joints' worker's `AutoMovieHumanF1Placing`, `AutoMovieHumanF1Placement` and `AutoMovieHumanF1Landmarks`. Until then `AutoMovieHumanFeatureLaws.template` has no caller |
| W1, W3 | The joints' work applies them in `AutoMovieHumanF1.ts` |
| W9, W10 | After the breast's family and the templates exist |

### Why W5 to W8 land with the knots, not before

`AutoMovieHumanF1NativeRoots` was released for one batch and read in full with the native family builder and the source law. The reading changes where the site law enters, and nothing was edited there.

| Read in code | Consequence |
| --- | --- |
| A person's source is f1's source function transformed: `AutoMovieHumanNativeSourceLaw` multiplies each coordinate function by the scale profile, turns each tangent angle with it and returns each shoulder function as it is (`shoulder: part.shoulder`, lines 172 and 376) | The path has a place for a ratio and a centre and none for a change of fullness |
| `AutoMovieHumanNativeFamily.create` uses that function law only while the family's controls are the original's (`sameControls`, lines 307 to 319); with any share changed it falls back to the knot-sampled source | A fullness applied to the knot columns drops the law between the knots for the whole family |
| Every site is a protected junction whose target is the original source under one constant ratio (`targets`, `measured` in `NativeBuild`; `NativeRoots` lines 271 to 276 and 320 to 375), bound within 1e-9 | A section solved by the site law disagrees with its own target and is refused. The refusal's text was read on f1 itself when a source was asked for in another cap scope: `protected junction at 579.368 disagrees with the changed source`, shoulder 0.4945 against 0.4560 |
| In `NativeRoots` the root's ratio feeds the root law (`Root.prepare`, the root targets, the rail interval, the handoff to the limb's profile) | The site ratios cannot be replaced there without touching the root's loop and level code, which the joints' batch deletes |

So the site law does not fit into a transformer of f1's source functions; it is a law in the family's own fields. It has one consistent place: the family's knots. With a knot at every site (the knot rule, fit request F1), a person's family is made in its fields: each site's column is `AutoMovieHumanNativeSiteSection.solve` on the prior's column there, each knot between two sites takes the profile's reaches and fullness, and the source is the family's own. A site then holds its section by construction, with no junction to bind and no second function to agree with. This is cause 4 and cause 6 answered together, and it needs the families refitted on landmark knots first, which waits for the joints' queue to be stored (F1, F3).

What exists for that step: the site law (`AutoMovieHumanNativeSiteSection`, `NativeSiteReaches`, `NativeGirthClosure`), the knot rule, the case table, and an invariance reading: `test/src/reference-conics/FamilyConicNativeIdentity.ts` builds f1's native assembly at f1's own fields without lofting (58 s through the construction's own sources) and records every family's knots, values, tips, nets and source points; `--against` lists every number that differs. The record of today's path is `packages/human/.shots/body-one-shot/native-identity/before-site-batch.json` (22 families, 71,435 numbers, none unread).

For `FamilyConicBody.ts`, which this work may not edit:

| # | Need | Exact terms |
| --- | --- | --- |
| F1 | Knots given, not chosen | One call site. The module exists: `test/src/reference-conics/FamilyConicLandmarkKnots.ts` (`test_human_landmark_knots`: a tube with one belly gives three knots; a limb with two bellies, a joint waist and a site gives six). In `FamilyConicBody.ts`, where a part's knots are seeded before the fit, the whole request is: `const knots: number[] = FamilyConicLandmarkKnots.knots(family, { sites, step: part.step ?? STEP_MM, ...(part.name === "trunk" ? { joints: AutoMovieHumanF1NativeSites.REFERENCE.runs.trunk } : {}) }).map((knot) => knot.station);` with `family` the part's stored wall (or its first fit) and `sites` the part's site stations from `AutoMovieHumanF1NativeSites.REFERENCE`, and those `knots` held through pruning in place of the seeded ones. `FamilyConicLandmarkKnots.argument` prints the same stations as `--knots=...` for a run's record |
| F2 | The trunk fitted whole on its lined layout | `FamilyConicBody.cjs trunk --trunk-lines` (the layout `TRUNK_LINED` of lines 61 to 66 already holds what this note asks: an inflection and a crest after the front extreme, a groove between the front and the side, a groove behind the side, a crest and an inflection before the back extreme) over the trunk's whole domain between its two new ends, with no `--from`, `--to`, `--wall=stored` or `--splice`. The earlier refusal was at a splice (see [The trunk](#the-trunk)) |
| F3 | The trunk's knots for F2 | By run place: the first station; the hip site (tau of 105.0 in its run); the hip centres' midpoint (124.8); the omphalion (267.4); the least side reach between the hip and the under-bust (333 on f1, the natural waist); the under-bust (427.7); the bust (474.7); the armpit's level (496.0); suprasternale (635.5), the neck's base ring |
| F4 | A relief fitted as a template | `--refit-reliefs=<net>` taking, for a net named as a template, the six numbers of `AutoMovieHumanFeatureTemplate.ITemplate` (centre, two extents, height, in its segment's frame) as its unknowns, and emitting the template's record, not a net's heights |
| F5 | The made case for F2 | Written: `test/src/features/human/frames/test_human_conic_lined_fade.ts`. It failed first as built (a blended fade refused at stations 97 to 103 of the made wall) and now pins both readings: the blended fade is refused inside the fade by the tangents' meeting, the narrowed fade is admitted with the floor at `90 - 10 q^2` |
| F6 | A fade law for a feature line | The law exists as a module: `conic/AutoMovieHumanGrooveFade` (`narrowed(groove, q)`: half width by `q`, depth by `q^2`, turn by `q`; `admitted`: `depth < half tan(turn)`; `holds`: `depth <= half turn`, admitted at every width; `anchors`; `share(station, from, to, least)`), checked by `test_human_conic_lined_fade` on the section model itself. The fit tool's side is one constraint: between a knot that holds a groove and the next that holds none, the feature run's fields are `anchors(narrowed(groove, share(s, ...)), back)` encoded on the run's chord, in place of free cubics. Where a feature run's groove ends along the course, its fields are tied: the inflection's turn `h` and the floor's offset go to zero with the groove's width (the made case's `30 q` degrees and `10 q^2` for half width `22 q`), in place of free cubics through the knots either side. In the fit tool: a constraint on a feature run's fields between a knot that holds a groove and the next that holds none, or a penalty that keeps `h` on the groove's side of its neighbour's tangent; and the remainder's depth reported by station |
| F7 | The spliced digits' tip records | Each root piece of the correction queue is emitted with `tips: [null, { from: <its last root knot>, tip }]` and without `own: true` (index finger `from: 38`, ring 44, little 36, thumb 63, second toe 45). After the splice the tip record is the stored one, `own: true` kept, until W3 sets its start by the dome law |

### What the fit tool needs

| Need | Why |
| --- | --- |
| Knots given as landmark places | Cause 4 |
| A whole-family fit of the trunk on a layout with inflection anchors, with a fade law for each feature line (F2, F6) | A groove that ends between two knots is refused with or without a splice (the made case) |
| A relief fitted as a named template's parameters, not free heights | Cause 3, cause 6 |
| A tip's pole taken from a datum | Cause 5 |

These are stated for the fit tool's owner; this batch writes no line of `FamilyConicBody.ts`.

### Order

1. The laws 1 to 5 as new modules, each red first on its made case. They read no family and can be built while the joints' queue runs.
2. After the joints' families are stored: knots and the trunk's whole fit (heavy runs, one at a time), templates, tips.
3. The native path's wiring: sites with girths, four reaches, centres, the closure, root height.
4. One whole-figure round.

### The one test round

Cases: the table `test/src/reference-conics/FamilyConicBodyCases.ts` (`CASES`, 109 rows), which the round's tool resolves into native fields once the sites carry girths and four reaches (W5): f1; for each of fourteen sites below the head its girth, its breadth and its depth, each at the population's 5th and 95th percentile (`1 -+ 1.645 CV` of the matching ANSUR II women's measure, with the stand-in named where the survey has none) and what each holds; the bust girth at both percentiles on f1's under-bust girth; tissue 0.8 and 1.2; every length case the native round already resolves. Cameras, in two groups ([One side, mirrored](#one-side-mirrored)):

- Against the reference: every region of the capture catalogue on the left side and the median trunk (front, back, left and obliques), three passes and owners, beside the reference's same view. Every pass condition below is read here.
- The mirror: each paired region's twin view, and twin views of the chest, the hip and the neck added to the catalogue, in clay and owners, beside the left view of the same case flipped. They are read for one thing: the right is the left's reflection, with no flipped face, no foreign owner, no open edge and a smooth median seam. They are not read against the reference's right side.

The instrument of this note is rerun on every case, on the stored (left) families and the trunk.

#### The round's runner and its cost

Read in the tools (code): `FamilyConicNativeRound` takes its cases from `AutoMovieHumanF1Engineering.resolve`, which returns each case with complete native fields, and writes them as `cases.json` (`f1-native-cases/v1`); `FamilyConicFigure --cases=<artifact> --case=<id> --preflight=<report>` builds and captures one case from that artifact. So a case reaches a figure only as resolved fields.

What the table's cases still need, each a tracked tool's piece:

| Missing | What it is |
| --- | --- |
| A resolver from a table row to native fields | Built: `test/src/reference-conics/FamilyConicBodyCaseResolve.ts` returns each row as the artifact's own record (`AutoMovieHumanF1Engineering.IResolvedCase`) or as unresolved with its reason (`test_human_body_case_resolve`, on made fields). 75 of the 109 rows resolve today: f1, 26 breadth and 26 depth rows, tissue's 2 and the 20 lengths. The 28 girth rows and the bust's 2 resolve after the knots step; the thigh's breadth and depth (4) when the native fields hold a thigh caliper. Writing `cases.json` with its source hashes and bundle manifest stays `FamilyConicNativeRound`'s: one call of `FamilyConicBodyCaseResolve.resolve(row, prepared.fields)` a row where it takes `Engineering.resolve`'s cases today |
| The family-level reading on a case | `FamilyConicNativeIdentity` builds f1's native families; given `--cases` and `--case` it builds a case's, and `FamilyConicBodyParts` reads a person's families where it reads the stored ones today (each site's breadth, depth, tape; the fullness; the run of convex and concave stretches of each outline; the centre's place) |
| Left side only | The figure tool builds the mirror itself; the readings and the pass rows are the left's and the median's. The twin cameras are read once, on f1, for the mirror |

Cost, from the two timings: a whole figure 242 s (the supervision's figure), a case's native families 58 s (the identity instrument). All 109 cases as figures are 7.3 hours; as families 1.8 hours. Which cases need a figure follows from what a case can change:

| Cases | Read at | Why |
| --- | --- | --- |
| f1 | Figure, every camera, three passes, owners, twin views | The round's reference state and the mirror |
| The 20 length cases | Figure | A length moves joint centres: every join, band and fold is rebuilt, and the root height is seen only on the whole figure |
| Tissue 0.8 and 1.2; the bust girth's two | Figure | Every family changes at once; the breast's join and fold move with the mound |
| Girth, breadth and depth at the hip, the thigh and the upper arm (18 cases) | Figure | Their sites stand within a section's reach of a join (crotch, armscye), whose premises a changed section reaches |
| Girth, breadth and depth at the other eleven sites (66 cases) | Native families, with the instrument | A site between two joints changes its own family's sections and no connection: the claim is the section's, read as its reaches, its tape and its outlines' form; any case the family reading fails goes to a figure |

That is 43 figures (2.9 hours) and 66 family readings (1.1 hours) in the one round, against 7.3 hours for 109 figures. The basis is stated per row; the 66 are not a second round but the same round's cases read at the stage that can show their defect.

| Part | Form present, as on the reference | Number |
| --- | --- | --- |
| All | One maximum a belly, the run of convex and concave stretches of f1's outlines kept on every case | Each site's tape, breadth and depth within its ISO 20685-1 allowance of the asked value |
| Trunk | Spinal furrow, buttocks and cleft, navel, clavicles and sternal channel present with their sign and at least half their depth; no level band | Skin less wall within 3 mm outside the templates' windows |
| Neck | The sternocleidomastoid's ridge with the hollow before it; no level band | - |
| Breast | A rounded lower pole over its fold, an upper pole that leaves the chest without a shelf; the apex's place by the bust point breadth | A bust girth 8 % larger moves the apex forward by less than the girth's change over pi |
| Limbs | Each belly, the elbow's and the knee's bone ends, the ankle's hollows | Girth order along each limb |
| Tips | A blunt dome with the pad's fullness on fingers and toes; no point | The last 3 mm within 0.5 mm of the reference on f1 |
| Tissue cases | Fuller or leaner, with the joints' breadths unchanged | Bony site breadths equal to f1's within 1e-6 |
| Length cases | The soles on the floor | The lowest sole point at 0 within 0.01 mm |
| The mirror (twin views) | The right side is the left's reflection; the trunk's median seam shows no line | Every right vertex is a left vertex's reflection in `z = 0` within the mesh's own rounding; no boundary edge, no foreign owner |

Every form and number above but the last row is read on the left side and the median trunk, against the reference's left and median. A difference from the reference's right that its own asymmetry makes is not a finding.

## Risks

| Risk | Design answer |
| --- | --- |
| The closure's scalar reaches a shoulder bound before the tape is met | The solve is bracketed by the layout's own bounds and refuses by name; the remaining girth then asks for a reach, which is an input conflict the anatomy audit reports |
| A feature line's end is refused where its groove's inflection turns through its neighbour's tangent (measured on the made case) | The fade law: a groove ends by narrowing, its turn and depth going down with its width (F6). Where the remainder the share bound leaves would show on the skin, the furrow is a template over a wall that takes only the volume |
| One person gives the priors (profiles between sites, template shapes, split shares) | Each is held in normalised coordinates with its basis written as "f1 alone", and is the cross-person work's first check on f2, m1 and m2 |
| The bone's share of a reach is unknown between joints | The centre is the skeleton's crossing, which needs no split; the split is used only where a bony breadth is published |
| A section at a pole has no area | The instrument's first digest took the hand's last station, its pole at 610 mm, into its mean, where a centroid is 0 / 0; a pole's section is now left out of the digest and the hand's row is filled |
| The breast's base law has no published regression | It is a stated derivation with the CT diameters as its check; the measures that fix it (bust point breadth, the two heights) are inputs |
| Tips change while the nails' work reads the same distal sections | The dome's base, pole and profile are published to the nails' work as the three things it consumes |

## Sources

| Source | Read |
| --- | --- |
| `AutoMovieHumanF1Trunk.ts` (wall and net declarations), `AutoMovieHumanF1FingerIndex.ts`, `AutoMovieHumanF1Breast.ts`, `AutoMovieHumanF1Nose.ts`, `AutoMovieHumanF1Arm.ts` (wall) | in full but the nets' heights |
| `AutoMovieHumanF1NativeSites`, `NativeBuild`, `NativeCalibration`, `NativeFieldTypes`, `F1FieldModel` | in full |
| `AutoMovieHumanConicLoft.ts` lines 27 to 425; `AutoMovieHumanF1.ts` lines 86 to 300 | in part |
| `AutoMovieHumanTrunkKeys`, `TrunkFeatures`, `TrunkSolver` (the earlier parametric trunk) | in full |
| `FamilyConicLimbLaw.ts`, `FamilyConicLowerTrunk.ts` | headers |
| `joints-one-shot.md`, `centres-and-courses.md`, `anatomy/trunk.md`, `sources/ansur-ii.md`, `sources/ansur-ii-trunk-ratios.md` | in full |
| ANSUR II (Gordon 2014; Paquette and Parham 2017) | this package's notes |
| ISO 8559-1:2017 | this package's notes; clause titles 5.1.7, 5.1.8, 5.2.3 only |
| de Leva 1996, J Biomech 29:1223 | in full (by a research reader) |
| Kayar 2011, Breast Cancer (Auckl) 5:43, for Qiao 1997's formula | in full; Qiao 1997 not obtained |
| Huang 2017, PLoS One (605 women, breast measures) | in full |
| Shirato 2017, J Phys Ther Sci 29:1914 | in full |
| Wu, Welcome and Dong 2006, fingertip model | pages 1 to 4 |
| Sanchez-Reyes 2011, conic segments in Bezier form | in full |
| Thelwell 2020, Sci Rep 10:12125 | in full |
| Ultrasound of neck muscles, Front Rehabil Sci 2021 | in full |
| Martin 1990; Maruyama 1991; breast CT diameters; Serina 1998 | abstracts only |
| ISO 8559-1:2017 through others' quotations: bust point "most anterior point of the bust when wearing a bra", bust height "vertical distance from bust point to the ground", bust girth "horizontal girth measured at bust point level" (Petrova and Baytar 2023, table 3, read in full); bust point width "distance from the right to the left bust points" and under-bust level "directly below breast when wearing bra" (a measurement catalogue's paraphrase) | the standard's own text not obtained; no wording found for 5.1.8 under-bust height |
| Zheng, Yu and Fan 2010, a bra sizing system from breast measurements (3DBODY) | in full (by a research reader) |
| Breast CT by cup size, 219 datasets (PMC3081868) | a summary of the paper |
| Raymer's conic lofting as reproduced in a course handout | pages 14 to 24 |
| NASA TM-4406 (Barger and Adams 1993), a fillet blended over a length | pages 1 to 5 |
| Liming 1944 and 1947; Brown 1999; Lee and Hong 2004; Kovacs 2007; Pujades 2019; Allen 2003; toe tip geometry; how far any bony landmark stands out of the skin | not obtained |
| MPFB2 and anny, local clones: `macro.json`, `target.json`, `targetservice.py` 989 to 1199, `rig.py` 291 to 319 and 884 to 971, `phenotype.py`, `anthropometry.py` | by a research reader; both blend stored targets and hold no measure definition but anny's waist ring |
| ANSUR II measurer's handbook (Hotzman et al. 2011, NATICK/TR-11/017), chapter 5, landmarks | pages 21 to 72, by a research reader |
| Hoogervorst 2018 (clavicle, CT); Muhamed 2017 (patella, MRI); Meng 2010 (extensor tendons, ultrasound); Pirri 2021 (sternocleidomastoid); Kartufan 2020 (L4-L5 skin depth); Town 2023 (iliac crest soft tissue); Mello 2006 (Achilles tendon) | in full, by a research reader through a summarising fetch: each figure is rechecked against its paper before it becomes a coefficient |
