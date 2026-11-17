# Nails

The plan for the twenty nails of the f1 figure: what stands on the figure and on the reference today, what the literature and other parametric bodies give, the construction chosen and why, the law, the premises of the operators with today's values, and the one test round. [Every joint in one shot](joints-one-shot.md) lists the nail folds as outside its inventory; this note owns them.

How each statement was obtained:

| Mark | Meaning |
| --- | --- |
| code | Read by the author in the named file |
| tool | A number printed by `test/src/reference-conics/FamilyConicNail.ts`, with the output file |
| frame | A render opened by the author, with its file and pixel region |
| source | A published value, with how it was read |

Runs named below, all under `packages/human/.shots/nails`: `survey` is `2026-11-17T12-28-41.521Z` (every digit's distal segment cut in its own frame, reference and generated family), `probe` is the `-realize` run named in the premise table (every digit alone with its nail, realized by the engine).

## Today

**Generated (code, frame).** Each digit is one conic family fitted to the convex hull of the reference's sections (a tape wall) and closed in a cap from its last knot. No relief, line or part stands for a nail: `finger.index.dorsal.generated` of `survey` is a bare dome, and so are the other nine. The hull runs over the nail, so on the dorsal side of a distal segment the wall is the plate's own surface, bridged over the folds.

**Reference (tool, frame).** The reference models every nail as geometry in its one skin: a plate, a proximal fold, two lateral folds and a free edge. Its mesh is coarse there: 227 to 310 vertices on a finger's whole distal segment, 40 to 54 round a section (about 1 mm apart), rings 1 to 2 mm apart. A lateral fold is therefore one concave vertex, and its depth under the section's hull (0.1 to 0.26 mm) is the sagitta of one vertex over two 1 mm edges: it shows that a crease is there and where, not how deep a fold is. The reference is read for form only.

| Digit | Proximal fold from the last joint, mm | Free edge over the tip's distance | Chord between the lateral folds, mm | Breadth across the last joint, mm | Fold step on the median cut, mm |
| --- | --- | --- | --- | --- | --- |
| Thumb | 13.6 | 0.97 | 10.4 at least (lost past 16 mm) | 18.4 | 0.75 |
| Index | 10.7 | 0.96 | 9.4 | 15.0 | 0.33 |
| Middle | 9.4 | 0.96 | 9.6 | 15.2 | 0.70 |
| Ring | 7.2 | 0.94 | 8.9 | 14.0 | 0.37 |
| Little | 10.8 | 0.96 | 7.3 | 13.0 | 0.14 |
| Big toe | 10.9 | 0.89 | 16.7 | 25.6 | a groove, 0.1 |
| Toes 2 to 5 | 18.5, 15.3, 14.6, 13.3 | 0.87, 0.89, 0.92, 0.92 | found at single stations only | 15.5, 13.2, 12.9, 12.3 | 0.1 to 0.3 |

Forms read on the reference's median cuts (`survey.json`, `medianReference`): the proximal fold is a step down onto the plate with a concave vertex of 20 to 27 degrees; the plate runs nearly straight; the free edge is a convex vertex of 54 to 61 degrees on the fingers (36 on the big toe); under it stands a concave vertex of 18 to 27 degrees, the hyponychium. Frames: `finger.index.dorsal.reference` (the U of the proximal fold at px 330-560 x 440-500, the lateral folds as creases down both sides), `finger.index.lateral.reference` (the free edge's ledge at px 395-430 x 205-290), `toe.big.dorsal.reference` (fold at px 330-480 x 500-545).

The segment frames of `AutoMovieHumanF1Frames` point their dorsal axis at the nail within 2 degrees on the middle and ring fingers and the big toe, and miss it by a roll about the long axis on the others: 10 degrees on the index finger, -17 on the little finger, -6 on the thumb, 8 to 19 on the small toes (the tilt of the chord between the folds, `survey.json`). A nail therefore cannot take its facing from the frame alone; it reads the roll from the digit's own skin.

## What others do

| System | How nails are carried | Read |
| --- | --- | --- |
| MakeHuman base mesh in MPFB2 | A quad patch welded into the one skin: vertex groups `fingernails` (168 vertices) and `toenails` (270), no separate shell, no nail morph target; the material is the skin's copied into a slot of its own and routed by mask textures. Fingernail vertices are rigid on the distal bone (least dominant weight 0.974); toenails are blended across the toe's bones | Group lists, the base mesh's faces and one weight file parsed by a subagent; morph targets by name only |
| Anny | The same mesh and weights, no handling of its own | Loader and data folder searched |
| Dust3D, Blender's skin modifier | No notion of a nail or of a rigid shell on a limb tip | Searched, not read in full |

## Published proportions

| Quantity | Value | Source and how it was read |
| --- | --- | --- |
| Nail width (between the lowest points of the lateral grooves) over the breadth across the distal interphalangeal joint, women | Thumb 13.2 / 18.8, index 11.1 / 15.4, middle 11.5 / 15.1, ring 10.7 / 14.4, little 8.8 / 12.0 | Jung JW et al., Fingernail configuration, Arch Plast Surg 2015;42(6):753-760, table 1, 150 Korean women; the table read in the paper |
| Width over length from the proximal fold's groove to the fingertip, women | 0.91 for every finger | The same table |
| Radius of the plate at its crown | Women: thumb 9.6, index 7.4, middle 7.3, ring 6.8, little 5.2 mm; 0.59 to 0.75 of the width over both sexes | The same table; Murdan S, Int J Cosmet Sci 2011;33(6):509-513 gives 5.3 to 10.4 mm for women (preprint table read) |
| Plate thickness, fingers I to V | 0.48, 0.47, 0.47, 0.45, 0.42 mm | Bellinato F et al., Arch Dermatol Res 2023;315(3):593-600, ultrasound; extracted text |
| Second toe | Distal matrix width 8.80 mm, nail bed length 5.68 mm | Palomo-Lopez P et al., Diagnostics 2020;10(3):147, 50 cadaver toes; extracted text |
| Hallux nail width, women | 13.9 mm at its root | Jung DJ et al., Arch Plast Surg 2015;42(2):207-213; extracted text |
| Plate hidden under the proximal fold | 3.9 mm (thumb), 4.1 mm (index) | Michelucci A et al., Diagnostics 2023;13(16):2716, patients; extracted text |
| Angle between the plate and the proximal fold's skin | 171.4 degrees, SD 5.5 | Cited from Sinniah and Omar after Bentley 1976; a secondary citation, the paper not obtained |

Not found: a longitudinal radius of the plate, the depth of the proximal or the lateral folds on healthy digits, a toenail's width against the toe's skin breadth, the lengths of toenails 1 and 3 to 5, toenail thickness from a primary source. Each of these enters the law as a declared estimate.

## Binding or attachment

Three constructions were weighed against what the nail unit is: a rigid plate of another material that grows out from under a fold of skin, lies in a groove between two more folds and ends free over the fingertip.

| | A feature of the digit's skin | A part of its own, attached by an operator | A rigid part beside the skin |
| --- | --- | --- | --- |
| How | Inflection lines for the lateral folds on the distal family, or a relief | A plate family in the distal segment's frame, merged onto the digit along the curve where it comes out through the skin | A loose shell placed in the frame, not sewn |
| Folds | The lateral folds run along the digit and could be inflection lines of a refitted wall; the proximal fold runs across it, which no longitudinal line draws, and a relief draws a fold only as fine as its net and the mesh (lofting skill: a roll needs samplings a quarter of it apart) | The engine traces the curve and spans it with a blend of stated chord, exact at any mesh | None: an open edge or an interpenetration |
| Rig | The nail deforms with the skin's weights | The plate's frame is the distal segment's; every vertex the plate owns moves with that one bone | The same, but the skin under it moves apart from it |
| Material | A region of the digit's chart has to be declared and kept through every refit | The plate is a face of its own name; its triangles carry that owner | The same |
| Variety | A longer or thicker nail is another fit | Length, thickness, the free edge's reach are the plate's own numbers | The same |
| The skin's rule | A form no cast sees belongs to its own family | "A part comes out through another's surface: a merge traced from a seed on shared landmarks" (the Human skill's Connections) | Two bodies, against one skin |

**Chosen: a part of its own, attached.** The plate is a conic family in a frame fixed to the distal segment and is merged onto its digit by the traced `join`. One thing of the first column stays, because it is true of the anatomy: under the plate the digit's own skin is the nail bed, lower than the tape wall that was fitted over the plate. That bed is a relief of the digit's family generated from the plate, so the two cannot part.

Why the plate cannot simply be merged onto the wall as it stands (tool, `survey.json`): the wall is the hull over the reference's nail, so a true plate lies on or under it everywhere (the generated index wall stands 0.41 mm over the reference's plate at 12 mm, 0.2 at 14, level at 16). A merge keeps only what stands outside the host; a plate under the wall would not show, and one lifted over it would rise out of the proximal fold with the wrong sign. Why it is not a cut: a cutter's convex body leaves a concave floor, and the plate is convex.

What a later rig needs: the plate's vertices bound to the distal segment alone, which its owner name gives; the bed and the folds are the digit's skin and take the digit's weights. What a later material needs: the owner `nail.<digit>` for the plate, and the blend's owner `fold.nail.<digit>` for the fold's rounding.

## The law

One function, `AutoMovieHumanNail.create` (`packages/human/src/generation/nail/AutoMovieHumanNail.ts`), for every nail; `AutoMovieHumanF1Nails` holds one row a ray with its segment and its proportions. A row holds what anatomy gives per ray and nothing fitted.

**One side.** Ten nails are made, on the stored side's hand and foot. The other ten are their mirror images in the median plane: the twin's plate is the reflection of the placed plate and the twin's bed the reflection the digit's own mirror makes. No row, reading or pass condition belongs to the other side; its frames check the mirror only.

**What a nail consumes of its digit.** The distal segment's frame at the pose: its origin, which is the last joint's centre (`index3`, `thumb3`, `bigtoe2` and their like), and two axes read as the distal and the dorsal direction (a hand's phalanx has Y proximal and X volar, a toe's X distal and Y dorsal, as the frames' rules state). And the digit family's own lofted skin from that joint to its tip, as a function of station and phase (`AutoMovieHumanNail.ISkin`). It reads neither the digit's knots, nor its cap's numbers, nor its root. A digit refitted proximally changes nothing a nail reads, and a tip whose dome is drawn by another law is read as it lofts: the fold, the pitch, the free edge and the bed all follow from that surface. The one condition is order: the digit's family is complete before its nail is made.

**Steps.**

1. Read the digit's breadth `B` across the last joint and its length `T` from that joint to the tip on the skin.
2. Width `W = width B`; the proximal fold stands `W / aspect` before the tip. Midway along the plate the edges may stand no farther under the crown than `wrap` of the digit's height there; a plate that would wrap farther is narrowed, and shortened with it. No f1 digit reaches the bound (`narrowed` reads 1 on all ten).
3. The nail's own frame, from the digit's skin. Its long axis runs through the middle of the skin's breadth at the fold and three quarters of the way on to the tip, since the segment's axis runs to the pad's far point and stands up to half a millimetre off the skin's middle. It is rolled about that axis until the skin stands equally high at both edges of the plate midway along it. It is pitched until its distal axis is the taut line over the dorsal skin from the fold's point: a plate is straight along its length and lies on the digit, so its line is the steepest rise of the skin's median profile seen from the fold, which is the skin's tangent there on a profile that only falls away. On a short toe whose back slopes all the way to its tip the line is raised until the plate's face stands half a fold over the skin three net cells before the tip, which the bed's zero rings need. The crown of the plate is that line one `fold` lower, and the skin's own fall toward the tip brings the plate out through it. The published angle between the plate and the fold's skin, 171 degrees with an SD of 5.5, checks the pitch.
4. Every section of the plate is the digit's own dorsal arc carried on that line: the crown on the line, the two edges as far under the crown as the skin's edges stand, on their mean, under the skin's crown there. The plate keeps its share of the digit's breadth where the tip narrows. A digit twists along its length (the big toe's two sides stand 2 mm apart in height at its fold and level midway), and the plate twists with it at one rate: each section is turned about the course by the straight line fitted to the turns that would level the skin's two edges. The upper face is the quarter ellipse through the crown and an edge; its side extreme stands outside the edge by three blend chords' share of the half width, under the lateral fold. The body under the face is as deep as that ellipse, so the bedded skin lies well inside it and the plate meets the skin along one curve. The face's radius at the crown is not an input: it is checked against the published radii.
5. The free edge stands at the last place, read back from the tip, where the crown is one `thickness` over the skin. The plate closes there in a cap one thickness long, its end face, shortened by halves where the tip's skin falls away so soon that the cap's pole would stand out of it. The course runs half a thickness over the shallowest section's floor, so the cap closes inside the digit.
6. The plate runs on under the proximal fold two ramps and closes there, covered.
7. The bed lowers the skin inside the outline (the two edges, an arc of radius `lunula W` for the proximal fold, the free edge) to half a fold under the plate's face over a C2 ramp two folds wide either side of the outline, on a net whose cells are a quarter of that ramp. On the outline the lowered skin and the plate agree; that is the curve the merge traces.

**Numbers.**

| Number | Value | Basis |
| --- | --- | --- |
| `width`, fingers | Jung's five ratios for women | Source; f1 is a woman |
| `aspect`, fingers | 0.91 | Source |
| `thickness`, fingers | Bellinato's five | Source |
| `aspect`, toes 2 to 5 | 8.80 / 5.68 | Source, the second toe's, taken for the four lesser toes |
| `wrap` | 0.40 fingers, 0.343 big toe, 0.317 toes 2 to 5 | Source: Ha GU et al., J Dermatol 2024;51(8):1117-1119, the plate's lateral tip under its apex over the height to the bottom of the distal phalanx (thumb 40.1 %, middle finger 40.2 %, hallux 34.3 %, third toe 31.7 %); extracted text |
| `fold` | 0.46 mm, one mean fingernail thickness | Estimate: no depth of a healthy fold was found; the reference's steps of 0.14 to 0.75 mm are not its basis |
| `lunula` | 1 | Estimate: the reference's fold arc reads 0.86 of the width on the index finger |
| `width`, toes | 0.65 | Estimate: no source relates a toenail's width to the toe's skin breadth |
| `aspect`, big toe | 1.1 | Estimate |
| `thickness`, big toe 1.38 mm, toes 2 to 5 0.46 mm | | A secondary citation for the big toe; an estimate for the others |
| Hidden root | Two ramps, 1.84 mm | Geometry: room for the fold's blend and the bed's ramp. The published 3.9 to 4.1 mm of hidden plate is not modelled: a straight root that long showed through a twisted toe's skin before the plate was given its twist, and nothing visible depends on it |
| Blend chord | 0.23 mm at most, a quarter of the ramp's half width | Geometry: the fold's rounding inside the ramp |

## Operators and premises

Per nail: one relief on the digit's family (the bed) and one traced `join` of kind `merge` (the plate onto the digit), named `fold.nail.<digit>`, seeded by a search along the plate's crown line (phase 0) over the first 0.7 of its stations, where it comes out through the bed at the proximal fold. Each rail's chord is a curvature width (`IAutoMovieConstructionCurvatureWidth`): half the radius of the turn the rail meets, 0.23 mm at most. G2, 96 columns, 4 rows, `grazing` 0.04 rad, `tolerance` 1e-12 m.

### Declared loop or traced merge

The law knows the outline, so the meeting curve could be declared (`IAutoMovieConstructionJoin.loop` with fold widths) instead of traced. Both were probed on all ten digits.

| | Traced merge, curvature widths | Declared loop, fold widths |
| --- | --- | --- |
| The curve | Traced by the engine from a seed found on the crown line | Solved by `AutoMovieHumanNailLoop` on the two lofted surfaces: along each ray of the outline's chart ellipse, the share at which the bedded skin's point stands on the plate's upper face or its cap; 96 shares |
| Probe | `13-36-27`: ten of ten with no diagnostic | `13-16-17`: none admitted. Nine `shared loop: the part has no jet at [station, phase] on the way to the loop point's foot`, at clock 0 or within 0.2 rad of it on six digits and at the free edge's corners (clock 5.2 to 5.6) on three; the tenth refused by the loop solve at a corner |
| Cause | - | The engine walks the part's chart to each loop point's foot and reads the part's jet there (code: `AutoMovieConstructionSharedLoop`, by its refusal). At the free edge the curve lies on the plate's closed end: on the index finger the foot stands at plate station 14.29 mm, past the last knot at 13.73 and the cap's pole at 14.20, where the polar chart has no jet |

The mixed join is made for a part whose wall runs on through the loop all round, a mound on its host. A plate ends: its free edge is its closed end, and the curve must cross it. So the declared loop cannot serve a nail as the kernel stands, and the traced merge is used.

**Kernel piece that would let it serve.** A join on a declared loop whose loop may run over the part's closed end, read in the cap's root parameter as the trace already reads it. Its need is this refusal on ten of ten digits. It is not built in this batch: the traced merge admits all ten.

**The corners.** The free edge's corners are the plate's own: its end face is a cap one thickness long, so the outline turns from the lateral fold into the free edge within about a thickness. The rails there are held by the kernel's curvature width, which is its rule for a rail on a turning curve (half the turn's radius); the 0.23 mm is the fold's rounding on the straight runs, a quarter of the bed's ramp, and is not the corner's radius.

### Premises

Taken from `IAutoMovieConstructionJoin`, `IAutoMovieLoftRelief`, `AutoMovieHumanConicLoft.part` and the probe's refusals (code, tool):

| Premise | Where it comes from | Today, probe `13-36-27` |
| --- | --- | --- |
| The plate's family lofts: two centres, no turn, `bilateral(0)`, a roll along its stations, a covered tip at its root and a cap at its free edge | `AutoMovieViewAxis.jointed`, `part` | Ten of ten |
| Every plate section star-shaped about its course | The course runs inside the shallowest section | By construction |
| The relief's three outer rings zero | `IAutoMovieLoftRelief` | `clipped` 0 on ten of ten (0.47 and 0.58 mm on two toes before the line's raise) |
| A relief may run into the digit's cap | Not stated by the interface; probed | The windows of all ten run to the tip's station (index 70.2 to 84.38 mm, the cap from 81), their last three rows zero, and loft |
| A closed loop near the seed; one curve only | `join`, traced | Ten of ten; `crossings left 4` on nine while the plate's body was one thickness deep |
| Transversal all round, over `grazing` | The ramp crosses the plate's face at about 35 degrees at the folds | No `transversal contact` |
| The curve keeps off the plate's pole | The cap's pole must end under the skin | Ten of ten; `rails` at the middle toe's pole before the course was deepened |
| Each rail placed; the blend's normal never reverses | `rails`, `unfolded blend` | Ten of ten |
| The plate's root under the skin all across it | The plate twists with the digit | Read on the owners frames: no lobe on the big toe since the twist |

## Cost

Read on the probe (`13-36-27`, each digit alone): a digit with its nail holds 2,500 to 5,700 vertices, the big toe 10,500, 48,200 for the ten together, because the bed's net cuts the digit's rings to 0.46 mm round the whole digit over the nail's length. What a digit holds without its nail in the figure was not read, so the added share of the figure's 750,000 vertices is at most 96,000 (13 %) for both sides and is read from the round. The law takes 0.4 to 0.8 s a digit and the realization of a digit with its join 1.1 to 1.8 s in the probe: about 6 s of law for ten digits and some 30 s for twenty joins, against a generation of 242 s. The figure's own numbers are read from the round.

## Test round

One unit test, `test/src/features/human/frames/test_human_nail.ts`: the law on a made digit (a cylinder closed by a hemisphere) against the cylinder's and the sphere's closed forms, with a too-short digit refused and a turned frame rolled back.

One figure round after the batch, the frames of the hand, the foot and the toes, plus `FamilyConicNail.ts --realize` for the close frames of every digit in its nail's frame (clay, owners, the reference beside both).

Pass conditions, the same for all ten nails; the other side is checked as their mirror only:

| Form on the reference | Read on the generated figure |
| --- | --- |
| A plate of its own curvature | The owner `nail.<digit>` present on the dorsal side of each distal segment. The plate's radius at the crown is reported against the published 0.59 to 0.75 of the width (Jung 2015) as a deviation, not a pass: it is the digit's own dorsal arc, and on the probe it runs from 0.37 to 1.10 of the width along the visible plates (flatter than published on the ring finger and toes 2 and 3, tighter toward every free edge) |
| A proximal fold: a step down onto the plate with a concave line across the digit | On the median cut in the nail's frame, a convex then a concave turn at the fold's station, the skin proximal of it higher than the plate by a fold |
| Two lateral folds: concave lines along the digit | On the section midway along the plate, one concave turn each side at the plate's edge |
| A free edge: a convex edge with the plate over the skin | On the median cut, the plate one thickness over the skin where it ends |
| No diagnostic | The figure's diagnostics unchanged from the round before |
| Nothing else moved | The hand's, the foot's and the toes' frames elsewhere as the round before |

A lump, a step, a crease or a dent the reference lacks fails the figure whatever its numbers.

## The dorsal skin as the nail sees it

Read on all ten digits in one run of the law alone (`2026-11-17T13-41-52.758Z-realize`, `realize.json`, `profile`): at each of the plate's stations in the nail's frame, the middle of the skin's breadth, the skin's height on that middle, and the turn about the long axis that would level the skin's two edges at that station alone.

| Digit | Middle off the axis, mm, least to greatest | Levelling turn at the fold, midway, at the free edge, degrees | Height at the fold, lowest between, at the last rise, mm |
| --- | --- | --- | --- |
| Thumb | -0.06 to 0.03 | 1.1, 0.3, -1.4 | 3.57, 2.91 at 18 to 19 mm, 3.23 at 24.5 |
| Index | -0.01 to 0.17 | -0.9, -0.3, 2.9 | 5.08, falling throughout |
| Middle | -0.02 to 0.11 | 0.6, -0.2, 1.1 | 5.87, falling throughout |
| Ring | -0.10 to 0.01 | 0.9, 0.1, -0.5 | 4.69, falling throughout |
| Little | -0.08 to 0.02 | 1.5, 0.5, -2.0 | 4.72, falling throughout |
| Big toe | -0.42 to 0.06 | -6.9, -0.6, 2.7 | 4.53, level to 20 mm, then falling |
| Toe 2 | -0.13 to 0.17 | 2.6, 1.7, -0.5 | 4.39, falling |
| Toe 3 | -0.25 to 0.19 | 4.0, 3.0, 1.0 | 5.53, falling |
| Toe 4 | -0.03 to 0.08 | 3.3, 1.3, -2.2 | 4.09, falling |
| Toe 5 | -0.22 to 0.31 | -8.1, -4.5, -4.8 | 4.36, falling |

What the readings say, for every digit at once:

- **Middle.** The axis through the middle of the breadth at the fold and three quarters on stays within 0.42 mm of the middle everywhere along every plate.
- **Twist.** No digit's dorsal skin is square to one direction along the whole plate. The fingers turn by 1 to 4 degrees from the fold to the free edge; the big toe by 9.6 degrees over 13 mm, nearly at one rate between 13.6 and 20 mm; the little toe stands 4.5 to 8 degrees off the roll read midway all along. A rigid plate lies on its bed along its whole length, so its sections' turn is the straight line fitted by least squares to the levelling turns of all its stations, from its root to its free edge: one mean and one rate from the whole stretch. The roll read midway only gives the frame those turns are measured in, and the fitted line corrects whatever it missed; no station is chosen for it.
- **Pitch.** The thumb's fitted dorsum dips 0.66 mm under the line from its fold to its last rise, and the other nine fall away throughout. The plate's line is the taut line over the whole profile from the fold.

What the fitted line leaves: the big toe's levelling turn is not straight at its root (-5.7, -6.3, -6.9, -7.1, -6.4 degrees over the first 4 mm), and the plate's root still shows as a lobe about 1.5 mm long on the lower side (`toe.big.dorsal.owners` of `13-36-27`, px 300-350 x 500-540).
## The law as rewritten once

After the measurement above the frame, the section and the free edge were rewritten together and run once. Where this section and "The law" differ, this section holds.

**The plate's frame, over the whole bed.** A rigid plate lies on its bed along its whole length, so no single station sets its frame. At nine stations from the fold nine tenths of the way to the tip: the long axis is the straight line fitted by least squares to the middles of the skin's breadth; the roll is the mean of the turns that would level the skin's two edges at each station; the sections' twist is the straight line fitted by least squares to those turns at the plate's own stations; the pitch is the taut line over the whole median profile from the fold. No roll is read at a chosen fraction.

**The plate's section is its own.** The upper face turns on the published radius at its crown (`radius`, Jung 2015 per finger for women: 9.6 / 13.2, 7.4 / 11.1, 7.3 / 11.5, 6.8 / 10.7, 5.2 / 8.8 of the width; 0.7 for the big toe from its published tip height; the fingers' mean for toes 2 to 5, an estimate) and its edge stands that circle's sagitta under the crown, whatever the fitted digit's back does. The face is the conic from the level crown to the upright side extreme that has this crown radius and passes through the edge. The bed is lowered to the plate. What joins the plate's edge and the lateral fold is the bed's ramp: from the skin down to the plate's edge, as high as the edge lies under the skin there (`under` in the readings, up to 1.4 mm); where the edge stands over the skin there is no fold and the edge is free.

**The free edge is the plate's own arc**, of the proximal fold's radius (`lunula W`), its apex where the crown stands one thickness over the skin. The plate's edges follow that arc's half chord toward the apex, the sections end one thickness before it and the cap closes on from there.

**The fourteen probe changes against the measurement.**

| Change | Stays | Ground |
| --- | --- | --- |
| Axis on the skin's middle | yes, now a least-squares line over nine stations | middle within 0.42 mm on all ten |
| Taut line for the pitch; free edge read back from the tip | yes | the thumb's dorsum dips 0.66 mm |
| Sections' twist a fitted line | yes | fingers turn 1 to 4 degrees, the big toe 9.6 |
| Roll read midway; roll read a quarter of the way | both withdrawn | the roll is the mean over the bed |
| Edges under the lower skin edge; edges at the skin's own drop | both withdrawn | the plate has its published arc |
| Published 4 mm hidden root | withdrawn; two ramps | nothing visible depends on it |
| Line raised until the bed lowers nothing three cells before the tip | yes | the relief's zero rings |
| Course deepened; cap shortened by halves | yes | the trace may not run over the cap's pole |
| Body one thickness deep | withdrawn | the bed met its underside |
| Wrap bound | yes, inactive on f1 | `narrowed` 1 on ten |
| Curvature widths | yes | the kernel's rule for a rail on a turning curve |

## The one run after the rewrite

Run `2026-11-17T13-48-20.206Z-realize`: ten digits, five views, reference, clay and owners, on ten sheets of five digits (`sheet.<view>.0` fingers in the order middle, ring, index, little, thumb; `sheet.<view>.1` toes big, 2, 3, 4, 5; cells 360 px, rows reference, clay, owners). All ten sheets were opened. Pixel regions are in the sheet.

| # | Digit | Seen or refused | Where | Measured cause |
| --- | --- | --- | --- | --- |
| 1 | Big toe | Plate left out: `stations ... are not at least two strictly increasing finite values`; the bed alone shows as a step, `sheet.dorsal.1` px 100-260 x 500-590 | diagnostics | The cap's start `edge - root` and the last knot `(root + (edge - root)) - root` stood one unit in the last place apart (12.567724016970091 and ...095). Fixed in the law after the run; not rerun |
| 2 | Thumb | Plate left out: `rails`, no rail at t 3.60, `the part's normal-section refinement did not converge` (plate station 14.57, the two normals 122 degrees apart); the bed alone shows a hollow with a pit, `sheet.dorsal.0` px 1560-1680 x 470-590 | diagnostics | On the free edge's arc, where the plate's sections narrow and its end face meets the skin steeply. Not traced further |
| 3 | Toe 5 | Plate left out: `unfolded blend` at t 2.42, share 1; the bed alone shows a dent, `sheet.dorsal.1` px 1580-1680 x 490-520 | diagnostics | At the far corner of the outline (t 2.42 of 2 pi is the first distal corner by the outline's lengths). Not traced further |
| 4 | Middle, ring, index, little finger | A dark tick at the free edge's corner where it meets the lateral fold | `sheet.oblique-twin.0` clay row, px 175-185 x 520-530, 538-548 x 520-528, 895-905 x 515-525, 1250-1262 x 512-522 | `under` falls below zero toward the free edge on each (least -0.38 to -0.54 mm): there the plate's edge stands over the skin and its side wall shows for a fraction of a millimetre before the cap |
| 5 | Middle, ring, index, little finger | The plate spans most of the digit's breadth and its distal end reads nearly square; the reference's nails are narrower ovals | `sheet.dorsal.0`, middle finger: plate px 120-240 of a digit px 105-262 (clay and owners rows) against the reference's px 125-235 with a round far end | The width is Jung's share of the breadth across the joint (0.72 to 0.76) on fingertips that taper more than that population's; the free edge's arc is 0.134 of the width deep, 1.5 mm, of which the cap takes the last thickness |
| 6 | Toes 2, 3, 4 | Plates present, short and wide, with a saw-toothed rim on the fold | `sheet.oblique.1` clay row px 500-560 x 520-545 and 850-905 x 520-545; `sheet.oblique-twin.1` px 1215-1250 x 580-660 | The bed's ramp is 1.84 mm wide and the toe's rings and phases stand one net cell, 0.46 mm, apart only inside the bed's window; the fold crosses them obliquely |
| 7 | All seven with a plate | Proximal fold a step with a U line, lateral folds as lines, a ledge at the free edge | `sheet.lateral.0` clay row (step at px 120-150 x 590-600 on the middle finger, ledge at px 125-150 x 470-490), `sheet.end.0` and `.1` owners rows (the edge a thin arc) | The forms the reference has; no defect |
| 8 | Big toe, earlier runs | The root's lobe | not observable in this run (plate left out) | The twist's fitted line misses the root's turn by about a degree; unverified after the rewrite |

Rows 2 to 6 are open. They are not chased one at a time: 2, 3 and 4 share the free edge's end (the arc, the cap and the edge leaving the skin) and are one piece of work; 5 is the width's covariate; 6 is the net's cell against the figure's vertex budget.

## The free edge's end, traced from the run's records

No rerun: read from `realize.json` of run `13-48-20` (`profile`, `readings`) and the join's records in the diagnostics.

What meets there. Along the lateral folds the curve is the plate's upper face against the bed's ramp. Toward the free edge the plate's edge rises over the skin (`under` below zero), so the curve leaves the face's edge, runs down the plate's side wall and then round the plate's closed end, where the cap meets the tip's dome. The plate's last section, one thickness before the apex, is still several millimetres wide, and the cap closes that whole width within one thickness. The end is therefore an ellipse in plan with the half width across and the cap's length along, and at its two ends, the free edge's corners, it turns on `cap^2 / half width`.

| Digit | Half width of the last section, mm | Cap, at most, mm | Corner's radius in plan, mm | Least `under`, mm | Run |
| --- | --- | --- | --- | --- | --- |
| finger.middle | 3.26 | 0.47 | 0.068 | -0.54 | admitted |
| finger.ring | 3 | 0.45 | 0.068 | 0.02 | admitted |
| finger.index | 3.16 | 0.47 | 0.070 | -0.38 | admitted |
| finger.pinky | 2.76 | 0.42 | 0.064 | -0.53 | admitted |
| finger.thumb | 3.48 | 0.48 | 0.066 | -1.00 | rails |
| toe.big | 5.18 | 1.38 | 0.368 | -1.18 | stations |
| toe.index | 3.01 | 0.46 | 0.070 | -0.08 | admitted |
| toe.middle | 2.72 | 0.46 | 0.078 | -0.2 | admitted |
| toe.ring | 2.71 | 0.46 | 0.078 | -0.44 | admitted |
| toe.little | 2.38 | 0.46 | 0.089 | -0.80 | unfolded blend |

Against that: the blend's chord is 0.23 mm at most and the curvature width holds each rail to half the turn's radius, so at a corner of 0.04 to 0.09 mm the rails stand 0.02 to 0.05 mm from the curve, on a curve that there passes from the face's edge to the side wall to the cap within a fraction of a millimetre. The thumb's refusal reports the two normals 122 degrees apart at plate station 14.57, on the cap; toe 5's fold is at the first distal corner; the fingers' tick is the side wall showing where `under` is negative before the cap. One cause as geometry: **the plate's corner is not a curve of the outline; it is the leftover of closing a wide section in a short cap, a tenth of a millimetre in radius, and the plate's edge is out of the skin when it gets there.** The saw-toothed rims of toes 2 to 4 are not this cause (they are the net's cell on the fold) and the squarer end is its plan view: the arc takes 1.5 mm of depth of which the sections cover all but the last thickness, then the cap squares it off.

**Design answer, decided and not yet built.** The corner belongs to the outline's rule: the lateral edge and the free edge's arc are joined by a fillet of stated radius, and the plate's sections follow that outline all the way down to a last section no wider than the cap is long, so the cap closes a round end and the corner the trace turns is the fillet's. In life the corner is where the lateral fold ends and the plate leaves the skin at the hyponychium, so the plate's edge must stay under the skin up to the fillet: the edge's height follows the skin's along the fillet instead of the crown's line. The fillet's radius has no published value found; it is an estimate to be stated with the rule, and it must be at least twice the blend's chord so the rails keep their full chord round it. This changes steps 4 and 5 of the law once; it has not been written into the law or run.

## Width against the reference

The generated digits are not broader than the reference at the last joint: the law's breadths against the reference's cut there (`survey.json` of run `12-28-41`) are middle 15.16 against 15.21 mm, ring 13.74 against 14.02, index 15.06 against 14.97, little 12.63 against 12.96, thumb 18.33 against 18.38, big toe 25.59 against 25.60, toe 2 15.55 against 15.53 (toes 4 and 5: the reference's cut runs into the neighbouring toe and gives no breadth). The wider plates are the nail's law: Jung's share of that breadth, 0.70 to 0.76 for women, against the reference's own 0.57 to 0.65 (chords of 7.3 to 10.4 mm on those breadths). The cause is the width's rule on this person, not the digit; nothing is asked of the body worker for it.
## The run after the free edge's change: refused, stopped

The decided answer was built as written (fillet of a quarter of the width between the lateral edge and the arc, five stations round the fillet and the arc down to a half width of one thickness, the edge held one fold under the skin up to the fillet, the body at least three thicknesses deep) and run once: `2026-11-17T13-59-36.930Z-realize`. The fillet's basis is the outline's description, a free edge worn round turning each corner over a quarter of the plate's width; it is an estimate.

**The join's premises do not hold for it. Four of ten admitted; before the change seven were.**

| Digit | Result | Premise's value |
| --- | --- | --- |
| Middle, little finger, toes 2 and 4 | admitted | - |
| Ring finger | `unfolded blend` | normal reverses at t 3.08, share 0.875 |
| Index finger | `unfolded blend` | t 3.08, share 1 |
| Thumb | `unfolded blend` | t 2.62, share 1 |
| Toe 3 | `unfolded blend` | t 2.09, share 1 |
| Toe 5 | `unfolded blend` | t 2.42, share 1 |
| Big toe | `traced loop`: `branch-distance`, `crossings left 4` at t 0 | the seed's line meets the skin four more times; its plate now lofts (the `stations` fix holds) |

Other readings of the run: the bed's net was clipped on seven digits (`clipped` 0.01 to 0.22 mm, 0 wanted); the plate's edge still stands over the skin toward the free edge (least `under` -0.44 to -1.47 mm).

All ten sheets were opened (dorsal, lateral, end, oblique, oblique-twin; fingers `.0` and toes `.1`; cells 360 px, rows reference, clay, owners).

| Seen | Where |
| --- | --- |
| The admitted plates' free edges are toothed | `sheet.oblique-twin.0` clay row, px 175-240 x 500-530 (middle finger) and 1250-1305 x 505-525 (little finger) |
| A nub at the apex of the free edge | `sheet.dorsal.0` clay row, px 170-190 x 462-475 and 1250-1265 x 462-475; `sheet.dorsal.1` px 530-545 x 460-470 and 1250-1262 x 458-468 |
| The lateral edges waver where they were straight | `sheet.dorsal.0` owners row, px 125-235 x 840-950 against the same cell of run `13-48-20` |
| Toothed free edges on the two admitted toes as well | `sheet.oblique-twin.1` clay row, px 525-580 x 480-500 (toe 2) and 1250-1305 x 490-520 (toe 4); `sheet.oblique.1` px 505-555 x 485-500 and 1215-1265 x 500-520 |
| The free edge from the end: a thin arc with a tooth at its middle | `sheet.end.0` owners row, px 120-240 x 862-890 (middle finger, tooth at px 172-180 x 862-870) and 1215-1305 x 872-900; `sheet.end.1` px 505-580 x 888-900 and 1220-1300 x 872-895 |
| From the side: the plate straight along the back, a step at the fold, the free edge's end a small hook | `sheet.lateral.0` clay row, px 125-150 x 470-600 (middle finger, hook at px 125-150 x 470-490) and 1215-1240 x 470-560 (little finger); `sheet.lateral.1` px 510-525 x 460-500 and 1215-1235 x 455-520 |
| On the refused digits the bed alone leaves pits and ticks at the free edge's place | `sheet.oblique.0` clay row px 870-890 x 495-510 (index), `sheet.oblique-twin.1` px 150-200 x 480-530 (big toe, three pits), `sheet.end.1` px 150-200 x 545-555 |
| Beds alone on the six refused digits: a hollow with a ridge | `sheet.dorsal.0` px 480-600 x 480-590, 845-955 x 480-590, 1560-1680 x 470-590; `sheet.dorsal.1` px 100-260 x 480-600, 860-940 x 470-510, 1580-1680 x 490-520 |

This is a finding, not a tuning target. No second change is made. Not traced: whether the teeth and the wavering come from the five stations standing within 0.6 mm of one another (the fields are natural cubics through their knots) or from the edge leaving the skin on the fillet. The law in the tree is this refused state; the state of run `13-48-20` (seven admitted) is the law without the fillet block, the end stations, the fold-held edge and the three-thickness depth.

## From the root: the plate as a part that runs on through its loop

Every refusal of the evening stands where the meeting curve reaches the plate's own end: `rails` and `unfolded blend` at the cap and its corners, `no jet` for the declared loop at the pole, more of both when the end was narrowed along a fillet. A part whose closed end lies on its own join loop is the representation's fault, not a setting's.

**The reading, before any probe** (code: `AutoMovieSolidSharedCurve.ts` lines 186 to 272, `IAutoMovieConstructionJoin`, `IAutoMovieConstructionFoldWidth`):

| Premise of the join on a declared loop | What the code does | The plate as it was | The plate running on |
| --- | --- | --- | --- |
| The loop on the host's chart, inside its domain | reads the host's jet at each loop point | holds: the loop is solved on the bedded digit | the same |
| The part's foot of every loop point, by Newton on the part's chart, needs the part's jet at every step and at the foot | `the part has no jet ... on the way to the loop point's foot` | fails at the free edge: the foot stands on the cap, at or past its pole (ten of ten, run `13-16-17`) | holds if the plate's wall runs on past the free edge: the foot stands on regular wall, the pole lying millimetres farther on, inside the digit |
| The foot within `tolerance` of the loop point | `shared loop` | the loop is solved as the crossing of the two lofted surfaces to 1e-9 of a share; between columns the engine reads it by a periodic cubic, so the tolerance must cover that spline's error, micrometres | the same |
| The part's kept side the same all round | `one kept side` | inside the loop the plate stands over the bedded skin everywhere, at the folds as at the free edge | the same; outside the loop the plate lies under the skin everywhere: under the folds, and past the free edge once it turns down into the pad |
| Each fold's radius under both surfaces' radii of curvature toward the fold | `fold radius` | the plate's crown radius is 5.2 to 9.6 mm; the bed's ramp turns on about 0.85 mm (1.5 folds over 1.84 mm on a quintic step) | the turn at the free edge is the plate's own, on the radius given below, 0.6 mm and more; a fold radius of 0.23 mm is under all three |
| No cleft | `cleft` as the turn nears pi | the folds turn 20 to 27 degrees at the proximal fold and 54 to 61 at the free edge on the reference's medians | the same |

So the bed stays: the join keeps the part inside the loop, and a mound must stand over its host there, while the tape wall is the hull over the plate. What changes is the plate's far end.

**The arcs.** Proximal fold and lateral folds: crossings, the skin's ramp standing over the plate outside the loop, a concave line. Free edge: a crossing, the plate standing over the skin inside the loop and turning down under it outside. No arc is tangent, so `reach` only guards the corners.

**The change, one.** The plate's family does not close at the free edge. Its course turns there, back and down by three quarters of a right angle toward the middle of the digit's pulp, on a turn whose half length is the course's depth under the crown, runs on a turn's half length and two millimetres, and closes there, covered. The sections past the turn are the free edge's own. The plate's upper face therefore rolls over a round end and goes into the tip's skin; the free edge is where it does. The fillet, the end stations and the narrowing toward the apex are withdrawn with the cap. The join is the declared loop of `AutoMovieHumanNailLoop` with fold widths (radius 0.23 mm, reach half of it); the traced merge and its curvature widths go.

**What may not hold, stated before the run.** The plate's body, as wide as the plate, turns back inside a fingertip that narrows; where its sides come out through the pad or the tip's sides the loop solve will find the skin over the plate too soon or the engine a second crossing. The round end's radius is the course's depth plus the turn's, 2 to 5 mm on these plates: a free edge that rolls over rather than ends in a ledge. Both are read on the run.
## The turning course: refused on paper and by its run

The run had already started when the order to check it on paper first arrived: the waiter found no fit alive at 23:23:04 and ran at once. Run `2026-11-17T14-23-05.157Z-realize`, declared loop.

| Reading | Value |
| --- | --- |
| Earlier two starts (half length = the course's depth, 3.06 mm) | `course: the turns' set-backs 7.38 and 0 overrun segment 1 of length 6.40`: the course itself refused |
| This run (half length one thickness) | no digit realized: the loop solve refused all ten, `the plate does not end by four times its outline at clock 0` - toward the free edge the bedded skin never comes over the plate's face |
| The bed's net | clipped on nine of ten, 0.015 to 2.2 mm |

On paper, the turn rule recorded in [Centres and courses](centres-and-courses.md) (`h > (15 / 16) theta r`, the half length against the turn's angle and the section's reach; read there, not in `AutoMovieViewAxis.jointed`, whose set-back integral I have not read): a turn of 135 degrees, 2.36 rad, of a section whose reach is the plate's half width, 4 to 8 mm, needs a half length over 8.8 to 17.7 mm. One thickness, 0.47 mm, is a twentieth of that; the course's depth, 3 mm, a third. The sections fold through the turn at either. The set-back I wrote as "about 2.4 half lengths" was a number read off one refusal and is withdrawn with the turn.

**So a turning course cannot carry the plate past its free edge.** The reason is the digit, not the kernel: past the free edge there is a millimetre or so of fingertip along the nail's axis, so a wall that runs on must turn through most of a right angle within about a plate's thickness, and a section 10 mm wide cannot turn that tightly about any course.

**What follows, on paper only; nothing below is built.**

- A straight course whose far sections narrow and sink inside the tip is the cap again: the course runs under the crown and leaves the digit within a millimetre of the free edge, so the closed end stands on the loop as before.
- The other way round holds on paper: at the free edge it is the skin that runs on, under the plate. The plate ends free, a short reach past the hyponychium, its closed end in the air and on no loop; the meeting curve then runs on the plate's upper face at the proximal fold, on its sides at the lateral folds and on its underside at the hyponychium, regular wall all round. It needs the plate's body to be a sheet one thickness deep at its far end (the visible free edge), which is the body that met the bed twice when it was one thickness deep everywhere (run `13-18-26`); so the body would be deep under the folds and thin only past the bed's end, and the loop solve would have to find the skin's foot on the plate's underside as well as on its face. Its premises against the join's code are not checked.
- The construction the other parametric bodies use (the nail as a region of the digit's own family, lateral folds as inflection lines, the proximal fold a declared crease, owner by chart region) has no join at all and so none of these refusals; it gives up the plate as a part.

The law in the tree is the turning-course state, which realizes no digit. The last state that realized digits is run `13-48-20` (seven of ten, traced merge).
## The straight course with its closed end under the skin, on a declared loop: paper

The supervisor's way on: a straight course whose far sections go under the fingertip's skin and close inside it. Read against the evening's record, that is the plate of run `13-48-20` (published arc, frame fitted over the whole bed, a cap one thickness long whose pole the skin covers) and one thing that was never put together with it: the declared loop. The declared loop was probed once, in run `13-16-17`, on the plate as it stood then, whose course ran midway down the shallowest section and whose cap's pole could stand out of the skin; its refusal named a foot past the pole (index: plate station 14.29 against a pole at 14.20). The rule that the pole must end under the skin came ten runs later and was only ever run with the traced merge.

Premises of the join on a declared loop (`AutoMovieSolidSharedCurve.ts` lines 186 to 272), for that plate:

| Premise | On paper |
| --- | --- |
| The part's jet at every step to the foot and at the foot | The foot at the free edge stands where the cap's upper face has come down to the skin: one thickness under the crown, while the pole lies the course's depth under it, 1.6 mm and more. On the cap's law (`g = sqrt(P(t))`) a ring one thickness down of 1.6 has `g` about 0.7, so the foot stands about half the cap's length from the pole on a ring some 3 mm in half width: regular chart, a jet |
| The foot within `tolerance` | Holds at the 96 columns, where the loop is solved on the two surfaces. Between columns the engine reads the loop by a periodic cubic through the shares; at the free edge's corners the true curve turns on 0.04 to 0.09 mm (the traced table) inside a column spacing of 0.4 mm, so the cubic cuts the corner. Whether the join checks the gap between columns I have not read; if it does, the corners are where it will refuse, and the value it reports is the finding |
| One kept side | Inside the loop the plate stands over the bedded skin all round |
| Fold radius under both surfaces' radii toward the fold | 0.23 mm against a crown radius of 5.2 to 9.6 mm and a ramp of about 0.85 mm; on the cap the surface turns on about its length, 0.47 mm (shorter where the cap was halved), which is over 0.23 mm only where the cap kept its length |
| No cleft | Turns of 20 to 61 degrees |

Not read: `test_construction_operator_pointed_cut.ts`; the supervisor reports that it admits a rounded-end lens on a declared loop and refuses a pointed one, which is this plate's rounded cap.

**The one probe**: the law restored to run `13-48-20`'s (the turning course, the fillet, the end stations, the fold-held edge and the three-thickness depth all withdrawn), joined by the declared loop of `AutoMovieHumanNailLoop` with fold widths (radius 0.23 mm, reach half of it, tolerance 5 micrometres as the tool had it in run `13-16-17`). Nothing is changed after it.
## The declared loop on the plate with its pole under the skin: refused at the corners

Run `2026-11-17T14-27-45.695Z-realize`, started 23:27:45 with no fit alive, 59 s. The law is run `13-48-20`'s; the join is the declared loop with fold widths. **None of ten admitted.**

| Digit | Refusal: `shared loop`, `the part has no jet at [station mm, phase] on the way to the loop point's foot` | Loop clock |
| --- | --- | --- |
| Middle finger | [13.80, 0.18] | 5.50 |
| Ring finger | [12.18, -1.15] | 5.89 |
| Index finger | [32.13, -130.15] | 5.37 |
| Little finger | [12.29, -6.54] | 5.56 |
| Thumb | [16.30, 1.23] | 0.79 |
| Big toe | [14.02, 1.48] | 0.85 |
| Toe 2 | [7.18, -1.66] | 6.22 |
| Toe 3 | [7.15, -1.68] | 5.96 |
| Toe 4 | [8.43, -7.37] | 5.50 |
| Toe 5 | [7.01, 1.36] | 0.65 |

What it says against the paper. The free edge's middle now passes: no refusal stands at clock 0, where all of run `13-16-17`'s stood or nearly; a pole the skin covers gave the foot its jet there. The refusal has moved to the free edge's two corners, 0.4 to 0.9 rad either side of clock 0 (clocks 5.4 to 6.2 and 0.65 to 0.85), on every digit. It is not the gap between columns that I named before the run: the foot's Newton walk on the plate's chart leaves the chart there (stations at or past the plate's end, a phase of -130 on the index finger). At a corner the loop's point lies where the face's edge, the side and the cap meet within 0.04 to 0.09 mm, and the nearest-point walk from the neighbouring column's foot has no smooth way round it.

Other readings: the bed's net is not clipped on any digit; the plate's edge stands over the skin toward the free edge on all ten (least `under` -0.08 to -1.18 mm), which is where the corners are.

Sheets opened: `sheet.dorsal.0` and `sheet.dorsal.1`. Every digit shows its bed alone, a hollow with a ridged rim where the plate should be (fingers: clay row px 115-245 x 470-600, 480-600 x 480-590, 845-955 x 470-590, 1210-1310 x 470-590, 1560-1680 x 470-590; toes: px 100-260 x 480-600, 500-585 x 465-520, 860-940 x 465-515, 1205-1305 x 470-530, 1580-1680 x 490-520); no cell shows a plate's owner. The other eight sheets were not opened: with no plate in any of them they show the same beds from other sides.

**Where this leaves the construction.** Three joins have now been read on the same plate: traced merge with curvature widths (seven of ten, the three refusals and the corner tick all at the free edge's corners), traced merge with a filleted outline (four of ten), declared loop (none; the middle of the free edge admitted, the corners not). Every one fails at the same two points of the loop, where the plate's edge leaves the skin and meets its own end. Stopped here, as ordered; no further change.
## Decision revised: the nail as a feature of the digit's own skin

**What the evidence says about the representation.** A separate plate joined to the digit has been read four ways on all ten digits: traced merge (seven of ten; refusals and a tick at the free edge's corners, which turn on 0.04 to 0.09 mm), a filleted outline (four of ten), a turning course (refused by the turn rule: 8.8 to 17.7 mm of half length needed against 0.47), a declared loop (none; the foot's walk leaves the plate's chart at the corners). Each fails where a thin plate must end on the surface it is joined to. One thing has held on all ten in every run: the relief on the digit's own family, generated by the law in the nail's frame, which draws the proximal fold's U and the lateral folds by itself and was unclipped wherever the plate's line was not forced.

**So the first table's choice is reversed, on these measurements.** The nail is a feature of the digit's own skin: one relief of the digit's family, placed by the law in a frame fixed to the distal segment.

| Part of the relief | What it is |
| --- | --- |
| Inside the outline | The plate's own surface: the published radius at its crown across, straight along the taut line, twisted at one fitted rate with the digit |
| Border at the proximal and lateral folds | A C2 ramp two folds either side wide, lying outside the outline: the fold's wall, from the skin down to the plate |
| Border at the free edge | The ramp lies inside the outline: the plate, one thickness over the skin at its apex, comes down to the tip's skin over the last two ramps |

**What it gives up, stated.** The undercut under the free edge: a relief has one height at each point, so the plate cannot overhang; the hyponychium is the plate's surface running down to the skin. A nail longer than the fingertip. The free edge as a ledge: a step of 0.47 mm over 1.84 mm is a slope of 14 degrees, not an edge. A crisp fold: the folds are as wide as the ramp.

**What it needs.**

1. Net against the folds, by the lofting skill's rule (every sampling across a roll at most a quarter of it): the ramp is 1.84 mm and the cell 0.46 mm, the quarter exactly; the digit's rings and phases inside the window are cut to that cell.
2. An owner for the material. Read in the engine (`AutoMovieConstructionRealization.IMesh`): a vertex carries the index of the face that evaluates it and its chart point there, and faces are view parts and blends; a relief has a name and no face, so it owns no vertex. Nothing in the kernel is needed for the region itself: each vertex of the digit's face has its station and phase, and the law that made the relief maps a chart point to the nail's plan and says whether it lies inside the outline. Human publishes that predicate with the nail; a material reads it. If the mesh must carry the name itself, the kernel piece is a relief's window as an owner region, with a made case of a net on a tube whose inside vertices report the relief's name.
3. The tip. The relief is made from the digit's lofted skin, so it sits on the body worker's tip dome as on today's cap, made after it. The body's feature template (`AutoMovieHumanFeatureTemplate`, read: its header and record) places a feature in a segment's frame by a centre, two directions, two half extents and a height, with the one height law `h (1 - r^2)^3` over an elliptic footprint and the classes bone, tendon and pad. The nail is the same kind of thing, a form placed in a bone's frame that rides the bone, but not that record: its footprint is an outline with a straight side, its height is the plate's own surface against the skin, and its border is a ramp on one side and inside on another. It would be a class of its own with its own height law; the record is the body worker's and is not changed here.

**Binding.** The whole of the distal segment's skin follows one bone, so the nail's region is rigid with it.

**The kernel fact found on the way, with its made case.** A join, traced or on a declared loop, cannot serve a part whose closed end lies on its own join loop: at the end the loop turns on the cap's own leftover radius, a rail or a foot has no chart to stand on, and the join is left out. Made case: a lens whose section is 10 mm wide and closes in a cap 0.5 mm long, sunk half its thickness into a plane, so the loop runs over the cap; the join should either admit it by reading the cap in its root parameter round the pole or refuse it by name before tracing. The overhanging plate as a part of its own waits for that piece.

**The plate's family** is still returned by the law (`INail.plate`) and joined by nothing.
## The relief's one run

Run `2026-11-17T14-39-31.053Z-realize`, tool mode `--relief` (each digit with its relief, no plate), started 23:39:23 beside one long fit of the joints worker by the supervisor's leave, 46 s. All ten realize with no diagnostic; there is no join to refuse.

| Reading | Value |
| --- | --- |
| Crown radius over width | the published share on all ten, 0.59 to 0.73 |
| Greatest lowering | 0.76 to 1.69 mm |
| `clipped`, 0 wanted | 0 to 0.04 mm on toes 1, 2, 3; 1.1 to 3.7 mm on the five fingers and toes 4 and 5 |

All ten sheets were opened; the rows for the fingers' two sheets stand in the table below, the rest in "The other eight sheets".

| Question | Seen | Where |
| --- | --- | --- |
| Do the folds read as folds? | The proximal fold reads, but as a band across the finger's whole breadth, a collar, not a U inside it; one lateral fold reads as a groove along the plate | `sheet.dorsal.0` clay row px 105-260 x 575-605 (middle finger) and the same band on the other four; `sheet.oblique-twin.0` clay row px 150-200 x 520-610 |
| Does a 14 degree slope read as a free edge? | No. The plate runs into the tip with no line across it; the reference has a ledge there | `sheet.dorsal.0` clay row px 120-240 x 460-480 against the reference row px 125-235 x 100-125 |
| A lump, step or crease the reference lacks? | Yes: the finger's side beside the nail is cut away, a notch in the silhouette | `sheet.oblique-twin.0` clay row px 235-255 x 560-620 (middle), 590-612 x 560-640 (ring), 950-965 x 560-640 (index) |
| The plate | A flat panel with its own arc, as wide as the published share makes it; wider and squarer than the reference's oval | `sheet.dorsal.0` clay row against the reference row |

**Cause of the notch and of the clipping, measured:** outside the outline the ramp took the plate's face on down the plate's side as its target, millimetres under the skin, so at the window's border the net was still asked for 1.1 to 3.7 mm (`clipped`) and the skin beside the nail was dug away. Fixed in the law after the run: outside the outline the ramp's target is the plate's edge. **Not rerun**; the fix is checked by the unit test only (1 of 1, 1,449 ms, still over one second).

Open after this run, not fixed: the free edge does not read; the proximal fold runs the whole breadth because the plate is nearly as wide as the fingertip; the toes' sheets and the other views are unread.

### The other eight sheets

| Sheet | Seen | Where |
| --- | --- | --- |
| `dorsal.1` (toes) | The big toe carries the best nail of the ten: a panel with a U fold and both lateral folds, inside the toe's breadth. Toes 2 and 3: a small panel between two short dark grooves. Toe 4: a panel and a fold line. Toe 5: a faint band only | clay row px 100-260 x 480-585; 495-600 x 465-520; 855-950 x 465-515; 1205-1310 x 470-530; 1570-1690 x 500-540 |
| `oblique-twin.1` | Big toe: a gouge beside the plate on its lower side; toe 4: the same, with stepped facets down the toe's side | clay row px 105-140 x 540-605; 1215-1260 x 520-640 |
| `lateral.0` (fingers) | On all five a trench runs along the back beside the plate, as long as the plate and far deeper than a fold | clay row px 130-160 x 480-590, 495-530 x 485-585, 855-890 x 480-590, 1215-1250 x 485-585, 1600-1625 x 500-590 |
| `lateral.1` | The same trench, shorter, on every toe | clay row px 165-185 x 490-570; 510-530 x 470-520; 855-880 x 470-520; 1215-1240 x 470-530; 1575-1600 x 480-530 |
| `oblique.0` | The trench from above: a dark slot down one side of each finger's plate; the proximal fold a bright band | clay row px 195-215 x 520-640 and neighbours; band px 130-215 x 615-640 |
| `oblique.1` | Toes: the slot with a saw-toothed rim | clay row px 210-240 x 520-600 (big toe), 520-565 x 505-545, 870-915 x 520-550 |
| `end.0`, `end.1` | From the end every tip is a smooth dome; no line marks a free edge on any of the ten | clay rows |

The trench, the gouge and the side notch are one defect, the ramp's target running down the plate's side (fixed in the law after this run, unverified by a run).

### The free edge and the proximal fold within a relief: paper

**Free edge.** The engine's relief is one uniform cubic net (`IAutoMovieLoftRelief`), C2 everywhere, so a step is as wide as the net resolves: four cells by the lofting rule. To read as a ledge the ramp would be about one thickness wide, 0.47 mm, with cells of 0.12 mm.

| Way | What it takes | Cost or lack |
| --- | --- | --- |
| The whole net at 0.12 mm | cells a quarter of 0.47 mm over the whole window | sixteen times the controls; the digit's rings and phases inside the window follow the cell, and the phases round the whole digit: some fifteen times the 48,200 vertices of the ten digits |
| A second, small relief over the free edge's band alone | a net about 1.5 mm long and one plate wide at 0.12 mm, some 1,400 controls a digit | the rings are cut only inside that window, but a family's phases are one density round the whole digit set by its finest net (`AutoMovieHumanConicLoft.phaseCount`): 375 phases on a 45 mm girth instead of about 100, on every ring of the digit. Lack: a phase density local to a relief's window |
| A crease line in the height law | the net holding a declared crease along the free edge's arc | lack: a relief has no knot line of raised multiplicity; its net is uniform |

Decision: the free edge stays the slope in this batch and is recorded as a named feature the relief does not draw, with the two pieces that would draw it (a local phase density, or a declared crease in a relief's net). Neither is built.

**Proximal fold as a collar.** Two things in the law make it span the breadth, both read on the run: the plate's half width at the fold is 0.36 to 0.38 of the breadth across the joint on a fingertip already narrower than the joint, so with the ramp's 1.84 mm outside the outline the fold's wall reaches the finger's sides; and the fold's arc has the plate's width as its radius, so over the plate's width it sinks only 0.134 of the width, 1.5 mm on 11 mm, and reads straight. The radius is my estimate (the reference's arc read 0.86 of the width on the index finger); the width is the published share. Changing either to look right is a setting moved to a picture; the published basis for the arc's radius is what is missing, and it is asked for under "Open".
### The rerun on the ramp-target fix: the cause was not the one I named

Run `2026-11-17T14-44-51.456Z-realize`, `--relief`, 23:44:48 to 23:45:21 (33 s) beside the joints worker's one long fit. All ten realize, no diagnostic. **The clipping is not gone**: `clipped` reads 2.8 to 4.5 mm on the five fingers and toe 5, 1.5 mm on toe 4, 0 to 0.05 mm on toes 1 to 3 (before the fix 2.0 to 3.7, 1.1, 0 to 0.04). Greatest lowering 0.53 to 1.31 mm (before 0.76 to 1.69). No sheet of this run has been opened, so it is unobserved in form.

What the numbers say. Holding the ramp's target at the plate's edge took away the deep lowering down the plate's side and left, or raised, what the net is asked for at its border. The border on those seven digits is the skin's own side: the plate's half width plus the ramp's 1.84 mm outside it is more than the digit's half breadth there, so the ramp has not ended where the skin turns under, and there the skin's side lies below the plate's edge, so the relief is asked to raise it by millimetres. On toes 1 to 3 the plate is narrow against the toe (0.65 of the breadth) and the ramp ends on the back; they are clean. So the cause is the same as the collar's: **a fold's wall two folds wide either side, as the net's rule sets it, has no room outside a plate that the published share makes 0.72 to 0.76 of the breadth across the joint on a tip narrower than the joint.** The fix I made was to a symptom of it.

Not changed further. What would answer it is a decision, not a value: either the fold's wall lies inside the published width at the lateral folds as it does at the free edge (the plate's visible face is then narrower than published by the wall), or the wall is as narrow as a fold is, a thickness or so, which is the fine net and its cost again.
### The fold's wall by the room's rule, and strips: read before the change

**Decision taken from the supervisor.** Jung's width runs between the lowest points of the lateral grooves, so the plate keeps the published width and the fold's wall rises outside it. The wall's width is not the net's four cells: at each station it is the room the digit has beside the plate, half the skin's breadth less the plate's half width, and one thickness at least. It ends where the skin turns under, so the relief moves no skin past the digit's side: the trench, the clipping and the collar have that one root.

**The engine, read.**

| Question | Answer | Where |
| --- | --- | --- |
| May one family carry several reliefs, and do they add? | Yes. A family holds a list (`IFamily.reliefs`), and the composer adds each relief's height along its own axis to the base point, one after another | `AutoMovieHumanConicLoft.ts` line 81; `AutoMovieLoftReliefCompose.ts` lines 39 and 103 to 107 |
| Must a net's spacing be uniform? | Yes: a tensor-product uniform cubic B-spline over its window, three outer rings zero | `IAutoMovieLoftRelief.ts` lines 5 to 11 |
| How does the mesh follow a net along the digit? | The digit's layers are cut inside each relief's own station window to that relief's row spacing; outside it they keep their pitch | `AutoMovieHumanF1.ts` lines 2297 to 2330 (`leaf`) |
| How does it follow a net round the digit? | Not locally. The phases round the whole family are one density, the finest column of any of its reliefs, on every layer | `AutoMovieHumanConicLoft.ts` lines 708 to 716 (`phaseCount`) and 652 |

So: (a) the nail can be several reliefs. (b) A strip fine ALONG the digit (the proximal fold's, the free edge's) costs only the rings inside its own short window. A strip fine ROUND the digit (a lateral fold's wall) forces its phase spacing on every ring of the digit: at 0.12 mm on a 45 mm girth that is 375 phases instead of about 100 on some 65 rings, about 24,000 vertices a finger against 5,000, some 400,000 more on the figure for twenty digits. (c) A free-edge strip one thickness long is affordable: a window about 2.6 mm long at cells of 0.12 mm is some 25 rows by the bed's 45 columns, about 1,100 heights and some 20 more rings a digit; a ledge can be drawn. A lateral wall as narrow as a thickness cannot be resolved round the digit within that budget; it is drawn by the bed's net at 0.46 mm and is under-sampled wherever the room beside the plate is under 1.84 mm.

**The one change.** The lateral wall by the room's rule, in the bed's net. The free edge as two reliefs that add: the bed's slope two ramps long, which its net resolves, and a strip (`<bed>.edge`), fine along the digit, holding the difference between a step one thickness long and that slope. The proximal fold's ramp stays two folds wide outside the outline, where the digit has the room along its length.
### The run on the room's rule and the free edge's strip

Run `2026-11-17T14-49-02.018Z-realize`, `--relief`, 23:48:57 to 23:49:36 (39 s) beside the joints worker's one long fit. All ten realize, no diagnostic. Unit test 1 of 1, 1,161 ms.

| Reading | Value |
| --- | --- |
| `clipped`, 0 wanted | 2.1 to 4.0 mm on the five fingers, 2.8 and 4.2 on toes 4 and 5, 0.29 to 0.54 on toes 1 to 3 |
| Greatest lowering | 0.53 to 1.31 mm, as the run before |
| Vertices | unchanged on nine digits (the big toe 12,801 against 12,289): the strip's window lies past the digit's last knot, in its cap, whose rings the cap's own law sets, so the strip added no ring there |

Sheets opened: `sheet.dorsal.0` and `sheet.lateral.0` (the five fingers). Not opened: the other eight, and none of run `14-44-51`'s, the "before".

| Seen | Where |
| --- | --- |
| The nail now reads as a nail on all five fingers: a plate, a proximal fold as a line curved a little, a lateral fold as a rim down each side | `sheet.dorsal.0` clay row, middle finger: plate px 125-235 x 480-575, fold px 115-245 x 575-600, rims px 115-130 and 235-245 x 480-590; the same on the other four |
| The trench along the plate's side is gone: the back runs straight to a step at the fold | `sheet.lateral.0` clay row px 120-150 x 470-600 against the same cell of run `14-39-31` |
| A line across the tip where the free edge is, faint | `sheet.dorsal.0` clay row px 135-225 x 462-480 |
| The proximal fold still runs nearly the breadth, since the plate does | the same cells |

**What remains, with its measured place.** The clipping did not fall. On the toes whose plate ends well before the tip it is small and new (the strip's last rows); on the fingers and toes 4 and 5 it stands where it stood. The net's last three rows cover the last 1.38 mm before the tip, and the free edge stands 1.0 to 1.4 mm before the tip on those digits: inside those rows the plate's face, as wide as its last section, stands over a dome that has already fallen away at its shoulders, and the relief is asked to raise the skin to it by millimetres. That is the plate's far corners again, now as a relief: the least `under` of -0.4 to -1.5 mm read since run `13-48-20` is the same fact. The engine zeroes those rows, so what is drawn there is cut off, not clipped smoothly.

No further change. What the measurements ask for is the plate's outline toward the free edge following the dome's own breadth out to the apex (the sections' share of the breadth stops at the last section), with the free edge far enough from the tip for the net's zero rings, as the line's raise already keeps it on the short toes.

### The other eight sheets of that run, and the run before's dorsal sheet

All ten sheets of run `14-49-02` are now opened, and `sheet.dorsal.0` of run `14-44-51`, the "before".

| Sheet | Seen | Where (clay row) |
| --- | --- | --- |
| `dorsal.1` (toes) | Every toe carries a plate with a rim down each side and a fold line behind it. On toes 2 and 3 the fold's two corners are square, a bracket and not a U. Toe 4: a level band across the toe behind the fold. Toe 5: a small panel with a nick in its far corner | big px 105-245 x 475-580; index px 490-600 x 468-525, corners px 490-505 and 588-600 x 508-525; middle px 858-948 x 465-512; ring band px 1200-1330 x 520-560; little nick px 1640-1655 x 475-490 |
| `lateral.1` | A step at the proximal fold on every toe, and a small notch where the free edge meets the tip. Toe 4's side stands in lengthwise flat strips | big step px 150-175 x 560-580, notch px 155-175 x 478-490; index notch px 505-525 x 470-480; middle px 850-870 x 465-475; ring strips px 1215-1340 x 470-640 |
| `end.0` (fingers) | From the end the plate's face is a lighter crescent on the top of each dome with a thin ledge at one upper side; no line crosses the top where the free edge is | middle crescent px 130-240 x 500-560, ledge px 105-150 x 500-520; the same on the other four; thumb ridge px 1560-1690 x 520-560 |
| `end.1` (toes) | Big toe: a ledge across the top. Toe 2: a dimple. Toe 3: a pit on the top's far side. Toes 4, 5: short ridges | big px 100-240 x 520-560; index px 560-580 x 535-550; middle px 935-950 x 515-530; ring px 1230-1300 x 505-530; little px 1570-1640 x 505-530 |
| `oblique.0` | The lateral wall on the far side reads as a dark face along the plate, its upper rim toothed; the proximal fold is a bright line; the tip's dome runs on smooth past the plate with no ledge. Thumb: level bands on the back behind the fold | middle wall px 185-215 x 520-640, teeth px 180-210 x 520-540, fold px 130-215 x 615-640; ring px 545-570; index px 905-930; pinky px 1260-1285; thumb wall px 1650-1675, bands px 1560-1710 x 620-680 |
| `oblique.1` | Big toe: the wall as on the fingers. Toes 2 and 3: a dark pocket at the fold's corner. Toe 5: a crease | big px 205-240 x 520-600; index px 520-570 x 505-545; middle px 840-900 x 510-555; little px 1600-1640 x 520-560 |
| `oblique-twin.0` | A plate, a rim on the near side, a fold line; where the free edge meets the lateral rim a pointed corner stands on every finger | middle corner px 155-175 x 525-540; ring px 520-535 x 520-535; index px 870-885 x 525-540; pinky px 1235-1250 x 530-545; thumb px 1575-1590 x 575-590 |
| `oblique-twin.1` | Big toe: a V crease at the middle of the free edge, running on down the plate's near side. Toe 4: stairs down the toe's side. Toe 5: a V notch at the free edge | big px 120-170 x 505-530 and 120-140 x 530-600; ring px 1215-1260 x 560-650; little px 1600-1640 x 500-530 |
| `14-44-51` `dorsal.0` | The same panels as after, with the fold's band running to both sides of the silhouette; the rims beside the plate are wider and lighter | middle fold px 105-260 x 580-600, rims px 110-130 and 235-255 x 480-590 |

So besides the three tip-end symptoms the sheets hold: square corners of the fold on the narrow toes, a pocket there from the side, a pointed corner where the free edge meets the lateral fold, a V at the big toe's free edge, and lengthwise strips or stairs on toe 4.

### The digits on the body's tip dome: paper before the run

**Read in full:** `AutoMovieHumanTipDome.ts` (one function, `start(reach, pole, share, least)`: the station where the stretch left before the pole is `share` times the section's mean reach there, by bisection; `held` when the part is too short) and `test_human_tip_dome.ts`; the body note's "Tips" (the dome table) and its wiring row W3: shares 1.5 for the four fingers, 1.1 for the thumb, 0.8 for the toes, the reach as `AutoMovieHumanF1.rounded` reads it (the mean of a section's four extents), the earliest start the family's second knot. The record's fields are enough; nothing is asked of the body worker for this. The toes already carry the law at 0.8 through `rounded`; the fingers and the thumb still start their caps 3.1 to 3.9 mm before the pole. The probe applies W3 itself to its own copy of each digit's family, all ten by the one call.

**What the dome changes, by symptom.**

| Symptom | Its place today | With the dome, on paper |
| --- | --- | --- |
| `clipped` 2.1 to 4.2 mm | The free edge stands 1.0 to 1.4 mm before the pole, inside the net's last three rows (1.38 mm), where the plate's face stands over shoulders that fall away at once on a cap 3 to 4 mm long | A finger's dome is 1.5 reaches long, about 9 to 11 mm. The free edge is where the skin has fallen one fold and one thickness, 0.93 mm, under the plate's line: on a half ellipse `H` long and `R` high that is `H (1 - sqrt(1 - (1 - 0.93 / R)^2))` before the pole, about `0.47 H`, 4 to 5 mm, for `R` of 6 mm. The window's far border, 3.22 mm past the free edge, then lies before the pole and its last three rows stand where the law asks for nothing. Expected: none from the tip's rows on the fingers and the thumb. The toes' domes do not change, so toes 4 and 5 are not helped by this |
| The strip adds no rings | Its window lies in the cap, whose rings the cap's own record sets | Worse unless the rings follow: with the dome nearly the whole nail lies in the cap. A cap's rings stand at equal steps of the root of the distance to the pole (`AutoMovieHumanConicLoft.ts` lines 597 to 606), twelve where the record names none, so `2 sqrt(H d) / (N + 1)` apart a distance `d` before the pole: 1.6 mm at the base of a 10 mm cap, against the bed's cell of 0.46 mm |
| The free edge is a faint line | A step one thickness long is sampled by rings three times too far apart | It reads only if the cap's rings stand a quarter of the step apart where the step is |

**A second place of the clipping, found on paper.** The lateral wall by the room's rule ends at the skin's side, but the window is still walked to the plate's edge plus two ramps and three cells; on the big toe that is 7.15 + 1.84 + 1.38 = 10.4 mm against a side at 11 mm, so the wall runs out of the window, which is the small new clipping on toes 1 to 3 (I named the strip's rows for it without a measurement). And past the side the wall's share, a function of the lateral offset alone, reads the underside as the back.

**What the dome costs the nail, stated before the run.** The plate is straight along its length and its fold stands a width over 0.91 before the pole, so on a dome that long the plate leaves the skin 4 to 5 mm before the pole where it left it 1.0 to 1.4 mm before. Jung's length runs to the fingertip, not to the free edge, so no published number is broken, but the visible plate is shorter. If the sheets show it too short, the missing law is the plate's own curve along its length; it is not added in this change.

**The proximal fold.** The outline today is two straight edges closed by a flat arc of radius one width, which meets them at corners (the square corners on toes 2 and 3) and sinks 0.134 of the width. The folds are one groove round the plate, so the outline's proximal end is one curve tangent to both edges: the half ellipse with the plate's half width `e` across and `e / (2 lunula)` along, whose apex turns on the radius `lunula W` the law already states (an ellipse's end turns on `e^2 / b`). The wall's outer border is the ellipse with `e` plus the lateral wall (the room's rule) across and that depth plus two ramps along; the share falls from the outline to that border along the ray from the ellipse's centre, so the wall stays inside the digit's breadth all the way round the U. No new number.

**The one change.**

1. Probe: every digit's cap started by `AutoMovieHumanTipDome.start` at its kind's share (W3 on the probe's copy).
2. `AutoMovieHumanF1Nails.bedded`: the cap's rings follow its reliefs. For each relief whose window reaches into the cap, `N + 1 >= 2 sqrt(H d) / cell`, `d` the window's farthest distance before the pole inside the cap and `cell` that relief's row spacing; the greatest is taken. Expected on a finger: about 44 for the bed, about 140 for the strip, some 15,000 vertices a finger against 5,000. The root spacing spends most of them near the pole, where no relief needs them; a cap whose rings may be listed would spend a third. That is the lack to record if the cost shows.
3. Law: the proximal outline and its wall as above.
4. Law: the window is walked to the wall's end (the skin's side); a control past its own row's side, on the underside, holds zero.
5. Law: the reading `clipped` gains its place (`clippedAt`, along and aside in the nail's frame), so the next table names where instead of inferring it.

**The feature template, read in full** (`generation/frame/AutoMovieHumanFeatureTemplate.ts`, 245 lines, and `test_human_feature_template.ts`). Since my first reading of its header the record has gained two fields named for a nail's bed: `squareness`, a superellipse footprint `|x / a|^n + |y / b|^n = 1`, and `flat`, a plateau with a quintic ramp to the edge. What it holds and what a nail needs:

| The nail needs | The template has | Fits? |
| --- | --- | --- |
| A place on the distal bone that rides it | `centre`, `along`, `across` in a segment's frame; `place` gives the normal | Yes. The nail's frame is that record's `IPlaced` |
| A person's change | `at`: place and extent by the skeleton's two ratios, height by tissue for a pad | Yes for place and extent. The nail's own sizes come from the digit's breadth by the published shares, which is the same thing stated on the skin |
| A footprint: two edges that narrow with the tip, a half ellipse behind, an arc in front | One superellipse, the same on all four sides | No |
| A border that differs by side: the wall outside the outline beside and behind, the slope inside it in front, the wall's width the room beside the plate | One ramp, inside the footprint, `1 - flat` of the radius everywhere | No |
| A height that is a surface: the skin goes to the plate's face, down in the middle and up toward the free edge | One number at the centre times a profile | No |
| A second net over the free edge | One height field | No |

So: two records. The nail keeps its own law and its own record (`AutoMovieHumanNail.INail`) and shares the template's contract of place only, a centre and two directions in the distal segment's frame. **Request to the body worker: none for this batch**; the template is not asked to grow a nail class. What would let one record serve both later is a height given as a target surface over the footprint instead of a number, and a border width by side; neither is asked for now, and the two fields added for a nail's bed are not used by the nail.

Then one run of all ten, every sheet opened, the table. If `clipped` remains, the engine's rule is recorded and the work stops there: a relief's three outer rings of controls are zero by contract (`IAutoMovieLoftRelief.ts` lines 7 to 8 and 60; `AutoMovieLoftRelief.ts` line 9).
## Wiring, for the relief

Replaces "Wiring" below for the joints worker's declaration step. No join, no plate source.

1. In `constructionFrom`, before any digit is read, and after each digit's family has its tip and the body worker's tip dome: `const nails = assembled.digits.map((digit) => AutoMovieHumanF1Nails.create(digit.family, assembled.frames));`
2. The assembly every later line reads: each digit's family replaced by `AutoMovieHumanF1Nails.bedded(digit.family, nails[i])`. The twin's relief comes from the digit's own mirror.
3. Nothing at the tree's end: `AutoMovieHumanF1Nails.attach` is not called.

Owner region for the material: a vertex whose face is the digit's (`finger.<name>`, `toe.<name>` or its `.mirror`) belongs to the nail when its chart point, read in the nail's frame, lies inside the outline (within the plate's half width of the long axis, past the proximal fold's arc, before the free edge). The law publishes the outline as `INail.plan` and the predicate as `AutoMovieHumanNail.owns(nail, point)`, a point of the figure's frame in millimetres; it also asks that the point stand over the plate's back, since the digit's underside lies inside the same plan. Unit test: `test_human_nail`, scenario 7. A twin's region is the same predicate on the point reflected in the median plane.

`bedded` also sets the digit's cap rings from its two nets, so the family it returns is the one to loft; a caller that sets `ITip.rings` afterwards undoes that.
## The net against the fold's width

The lofting skill's rule: an edge with a roll is resolved when every sampling across it is at most a quarter of the roll. The bed's ramp is the roll: two folds either side of the outline, 1.84 mm wide. The net's cell is `NET` times the ramp's half width, 0.5 of 0.92 mm, 0.46 mm, which is the quarter exactly, and the digit's rings and phases inside the window are cut to that cell. The net is therefore at the rule's bound and was left as it is; the toes' toothed rims are not explained by the rule and remain open.

## The width against the published spread

The pass condition reads the published law, not the reference. Jung 2015, women, mean and SD of the nail width: thumb 13.2 (1.1), index 11.1 (1.1), middle 11.5 (1.1), ring 10.7 (0.9), little 8.8 (0.8) mm, on breadths across the joint of 18.8 (1.7), 15.4 (1.4), 15.1 (1.4), 14.4 (1.2), 12.0 (1.3). The reference's own chords (index 9.4, middle 9.6, ring 8.9, little 7.3 mm) stand 1.5, 1.7, 2.0 and 1.9 SD under those means on breadths within one SD of Jung's: one person at the narrow end of the spread. The law's widths (10.9, 11.5, 10.2, 9.3 mm) are Jung's share of this person's breadth and stay.
## Wiring

The nails land in the single whole-figure round with the joints, the body and the head. `AutoMovieHumanF1.ts` is the joints worker's file; the request is three statements in `constructionFrom`, applied in its declaration step:

1. First statement of the function, before `sources` are filled and before any digit is read (the fan seams, the thumb's capsule and the split's children all read `placed.digits`): make the nails from the digits as they will be lofted, that is after `DIGITS` and `rounded` have given each digit its tip and after the body worker's tip dome law is in each digit's family. `const nails = assembled.digits.map((digit) => AutoMovieHumanF1Nails.create(digit.family, assembled.frames));`
2. Next, the assembly every later line reads: `const placed = { ...assembled, digits: assembled.digits.map((digit, i) => ({ ...digit, family: AutoMovieHumanF1Nails.bedded(digit.family, nails[i]) })) };` with the parameter renamed `assembled`. The twin's bed comes from the digit's own `twin`.
3. Last statement before the return, after the nostrils' cuts: `root = AutoMovieHumanF1Nails.attach(root, sources, nails, (name) => name + ".mirror");` It adds twenty `fold.nail.<digit>` joins and twenty `nail.<digit>` sources.

Order against the tips: a nail reads the digit's lofted skin, so a digit whose tip changes after statement 1 has a nail made for the old tip. `FamilyConicNail.ts --figure` performs the same three steps outside that file and has not been run; it is not run while the joints queue runs.
## Open

Owed, in order: the free edge's end as one piece of work (rows 2, 3 and 4 of the run's table), then one run of all ten; the whole figure in the shared round ("Wiring"). The unit test passes on the law as it stands (`test_human_nail`, 1 of 1, 2.5 s, which is over the one second a Human test is allowed: the frame's fit reads nine rings of the made skin on each pass).

Earlier notes, kept for their frames; the run's table above supersedes them where they differ:


- The big toe's root lobe above.
- The free edge's corners show a small notch where the cap meets the lateral fold (`finger.middle.oblique-twin.clay` of `13-28-55`, px 425-435 x 355-375). Not yet traced to its curve.
- The ramp beside a lateral fold reads in steps where the digit's rings cross it obliquely (the rings stand one net cell apart), and level bands cross the toe proximal of the nail where the bed's window cuts the digit's rings finer than the rest (`toe.big.dorsal.clay`, px 220-700 x 600-790, seen by the supervisor).
- The plate's distal end is as wide as the digit's breadth allows and its end face is square across, where the reference's narrows and rounds.
- The toes' width share, the big toe's aspect and the folds' depth are estimates; a published source replaces each when found.
- The plate's radius at the crown follows the fitted digit, not the published radii; a wall whose dorsal arc is laid by the published radius would close that.
- The line under the free edge: on the index finger's median cut of probe `13-36-27` the plate ends in convex turns of 24, 12, 15, 12 and 8 degrees and meets the skin in concave turns of 8, 12 and 7 degrees 0.68 mm lower. The other nine cuts are written to `realize.json` and were not read one by one.