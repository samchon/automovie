# The face in one shot

The investigation that precedes one implementation batch for the whole head of the f1 figure: the skull's wall, the forehead and brows, the eyes with their lids, the cheeks, the nose, the mouth, the chin and jaw, the auricle, and how each of them meets its neighbours. [Every joint in one shot](joints-one-shot.md) holds the body's joints and the kernel's operators with their premises, and [Centres and courses](centres-and-courses.md) holds how a course follows a person. This note does not repeat them.

**State of this note.** The face work is paused. Nothing of the figure is changed: no family is fitted, no node of the tree is declared, and no shared file but the Human package's barrel (seven export lines) is edited. What exists is the instrument, its readings, pure modules with unit tests and this plan; [State at the pause](#state-at-the-pause) lists it with what is unfinished and the first steps on resumption. Every statement carries how it was obtained, and what is not measured is said where it stands and collected under [Risks](#risks).

| Mark | Meaning |
| --- | --- |
| code | Read by the author in the named file |
| tool | Printed by `test/src/reference-conics/FamilyConicFace.ts` into `packages/human/.shots/face-one-shot-20261117/<file>` |
| frame | A render opened by the author, with the pixel region |
| source | A publication, with its read status under [Sources](#sources) |
| joints | Taken from [Every joint in one shot](joints-one-shot.md), not repeated by the author |

Round `08-45-34` is `packages/human/.shots/family-conic-figure/2026-11-17T08-45-34.287Z/case-f1`. Coordinates are the reference frame's millimetres: forward +X, up +Y, +Z the stored side.

**One side.** Every paired part is measured, designed and fitted once, on +Z, and its twin is the declared reflection in the head's median plane. The reference's own sides differ (its eyeballs' centres stand at `[90.8, 1594.0, 31.5]` and `[92.25, 1594.9, -31.5]`, tool `components.txt`); a difference on -Z that comes from that is no defect.

## The head today

Read in `AutoMovieHumanF1Trunk.ts`, `AutoMovieHumanF1Placing.ts` and `AutoMovieHumanF1Frames.ts` (code).

The head has no family. It is the top of the trunk family: level sections of a `bilateral(1)` tape hull about the vertical line `x = 0, z = 0`, station `s` at height `780 + s` mm, closed at the crown. Everything inside the hull is a height net moved along one direction of the head's frame:

| Net | Stations (heights, mm) | Phases, rad | Rows by columns | Spacing on the skin, mm | Moved along |
| --- | --- | --- | --- | --- | --- |
| `trunk.head` | 620 to 906 (1400 to 1686) | -2.99 to 2.99 | 59 by 109 | 4.9 by about 5 | -X |
| `trunk.head.back` | 620 to 906 | 2.14 to 4.14 | 60 by 39 | 4.8 by about 5 | +X |
| `trunk.crown` | 886 to 918.88 | all | 36 by 83 | 0.9 by polar | +X |
| `trunk.collar` | 680 to 734 (1460 to 1514) | -2.99 to 2.99 | 39 by 131 | 1.4 by about 3 | -X |
| `trunk.face` | 690 to 890 (1470 to 1670) | -1.2 to 1.2 | 81 by 69 | 2.5 by about 3.5 | -X |
| `trunk.mouth` | 722 to 758 (1502 to 1538) | -0.5 to 0.5 | 21 by 37 | 1.8 by about 2.9 | -X |
| `trunk.eyes` | 792 to 826 (1572 to 1606) | -0.8 to 0.8 | 20 by 73 | 1.8 by about 2.3 | -X |
| `trunk.chin` | 690 to 734 (1470 to 1514) | -0.8 to 0.8 | 33 by 41 | 1.4 by about 4 | 45 degrees up and back |

Two things are parts. The nose is one family on a course along +X at 1,556 mm from 108 to 132 mm, joined by a port on a recorded loop with a recorded rail and four recorded depth profiles, with a cutter for each nostril. The ear is a plate, two tubes and a cutter (joints).

The frame tree gives the head an origin at the bitragion midpoint with axes parallel to the thorax's, the nose a frame at subnasale and the ear one at tragion. No eye, mouth or mandible has a centre or a frame.

## What was measured

One instrument, tracked: `test/src/reference-conics/FamilyConicFace.ts`. It reads the reference's head mesh and nothing of the figure. All readings are light: twenty-seven readings took under two minutes, and none builds a figure or a fit.

| Mode | Reads |
| --- | --- |
| `--components` | The mesh's connected pieces and the open rims of the skin |
| `--outer` | Only skin that sees the outside along one of 64 directions past the skin and both eyeballs, so the mouth's lining, the vestibules and the sockets are left out |
| `--profile` | The front profile in a sagittal plane and its local extremes |
| `--cast` | Parallel rays on a grid: how many times each enters the skin within a depth, and whether its first face stands within 15 degrees of it |
| `--radial` | Rays square to a trial course: whether each meets the skin once, the star-shape of [Lofting](../../../../.agents/skills/3d-modeling/crafting/lofting.md#one-section-family) |
| `--wedge` | The skin's turn across every fold of a plane cut, at 3, 6 and 12 mm |
| `--stills` | The reference in clay with the rims and typed marks and lines over it |

### The reference's head

The mesh is 219 pieces: the skin (49,560 triangles), the mouth's interior, two eyeballs 30 mm across, the teeth and the lashes. The skin is open at the neck and at both lid fissures, whose rims are 78 and 81 mm long. Its lips and nostrils are not open: the skin runs on through them into closed pockets (tool `components.txt`). On the outer skin the lips' contact line is a rim 44 mm wide between `[104.3, 1519.3, 22.1]` and its twin (tool `o-components.txt`; frame `o-face.front.png`, the red line px 350-545 x 600-615, bowed, with a corner at each end).

Median profile (tool `profile-z0.txt`), each a local extreme of the profile by Farkas's definition:

| Landmark | x, y |
| --- | --- |
| Glabella | 118.4, 1617.5 |
| Nasion | 115.7, 1598.5 |
| Pronasale | 136.6, 1557.0 |
| Subnasale | 120.6, 1538.0 |
| Labrale superius | 123.3, 1530.5 |
| Stomion | 113.4, 1522.0 |
| Labrale inferius | 119.4, 1512.0 |
| Sublabiale | 109.8, 1504.0 |
| Pogonion | 110.6, 1497.0 |
| Menton, cervical point | The profile stands at 99.9 mm at 1,478 and at 59.4 mm at 1,476: the floor under the jaw is level within 2 mm over 40 mm |

The marks were drawn over the reference and opened (frames `o-axes.left.png`, `o-axes.front.png`): each median mark sits on its feature, the corner marks on the lips' corners, the alar mark in the alar groove.

### Where today's nets cannot hold the skin

Rays along -X, the direction `trunk.face`, `trunk.eyes` and `trunk.mouth` are moved along, over the window z -80 to 80, y 1,470 to 1,640, 1 mm apart (tool `o-cast-front.txt`):

| Region | Rays that enter the skin again | What hangs over, air under it |
| --- | --- | --- |
| Each lid fissure | 85 and 86 | The lid margin, up to 3.5 mm thick over 1.3 mm of air |
| Each nostril | 43 and 39 | The tip's and the ala's wall, 9.7 mm, over 9.5 to 11.3 mm of air |
| The lips' line | One row at 1,522 mm, z -12 to 12, and 17 rays at the corners | Two sheets in contact: air 0.0 to 1.2 mm |
| Chin over the neck | 161 | The chin |
| Each ear | 124 and 128 | The auricle |

And 1,539 of the 27,531 first faces stand within 15 degrees of the ray: the sides of the cheeks and the flanks of the nose. A height moved along -X there slides along the skin instead of standing on it.

Sizes against the nets' spacing: the lid margin is 1.9 to 2.8 mm thick (tool `o-radial-eye-canthal-*.txt`), the lips meet in a line of no width, the alar groove turns 71 to 77 degrees within 6 mm. [Lofting](../../../../.agents/skills/3d-modeling/crafting/lofting.md#fitting-and-verification) asks a sampling of a quarter of a roll; the nets stand 1.8 to 3.5 mm apart.

### The generated head, before

The stored trunk family's own skin over stations 620 to 905 (its wall with its nets, every millimetre and half degree), read by the same modes (`--mesh=trunk`; tool `g-cast-front.txt`, `g-wedge-sagittal.txt`, `g-wedge-level.txt`, `g-profile-z0.txt`). The nose and the ears are other families and are not in this reading. These are the round's values before.

| Reading | Reference | Generated |
| --- | --- | --- |
| Median profile's extremes: pogonion, sublabiale, labrale inferius, stomion, labrale superius, subnasale | 110.6 at 1,497; 109.8 at 1,504; 119.4 at 1,512; 113.4 at 1,522; 123.3 at 1,530.5; 120.6 at 1,538 | 110.7 at 1,496; 109.9 at 1,504; 119.4 at 1,511.5; 114.2 at 1,521; 123.3 at 1,531; 120.6 at 1,538 |
| Rays along -X that enter twice at a lid fissure | 85 and 86 | 0 |
| The same at the lips' line | One row, air 0 to 1.2 mm | 0 |
| First faces within 15 degrees of the ray | 1,539 | 1,483 |
| Lips' line in the median plane | An open contact line between two ridges | A valley turning 107 degrees at `[114.5, 1522]`; 94 at z 5, 83 at z 10, 82 at z 21 |
| Lids at z 31 | Two margins with the globe between | A valley of 57 degrees at 3 mm (31 at 6) at `[106.8, 1596]` between two ridges of 21 and 26 |
| Labiomental sulcus | 58 | 60 |
| Lower lip's roll | 76 | 75 |
| Upper vermilion's edge | 42 | 47 |
| Subnasale | 54 | 44 |
| Medial canthal hollow, z 10 and 15 | 29, 39 | 28, 44 |
| Lid to cheek, z 31 | 21 | 20 |
| Upper lid sulcus, z 31 | 11 | 11 |

Frames of that loft, opened (`g-face.front.png`, `g-face.left.png`, headed "generated trunk family alone"): front, the lids as reliefs with no fissure (px 250-380 x 290-350 and 520-670 x 285-345), a stump where the nose's family sits (px 400-480 x 370-400), the lips as two bands with a dark notch between (px 340-560 x 600-625), terraces on the chin (px 360-600 x 670-790); left, the same notch in profile (px 480-545 x 560-650), the lids (px 420-490 x 285-345), the terraces under the chin (px 380-490 x 690-780) and a smooth recess with no auricle (px 20-160 x 300-560).

The generated head holds the median profile within 1 mm and every shallow fold within 10 degrees. What it lacks is what one height a ray cannot be: the fissure between two lid margins and the lips' contact line, each drawn as a notch of the net.

### Every fold's turn

At 6 mm either side of the fold's floor, in the plane named (tool `o-wedge-sagittal.txt`, `o-wedge-level.txt`, `o-wedge-eye.txt`, `o-wedge-lips.txt`, `o-wedge-cheek.txt`). A plane oblique to a fold reads it wider.

| Fold | Plane | Floor | Turn, degrees |
| --- | --- | --- | --- |
| Alar groove | Level 1,548 and 1,552 | 111.0, z 18.6 | 71, 77 |
| Alar base on the lip | Sagittal z 15, 16 | 114.3, 1543.1 | 82, 66 |
| Supra-alar crease | Sagittal z 15 | 115.6, 1560.5 | 69 |
| Subnasale | Median | 120.7, 1538.8 | 54 |
| Labiomental sulcus | Median; z 8, 16, 21 | 110.2, 1505.7 | 58; 47, 26, 20 |
| Lower lip's roll (a ridge) | Median | 118.9, 1509.8 | 76 |
| Upper vermilion's edge (a ridge) | Median | 123.3, 1529.7 | 42 |
| Medial canthal hollow | Sagittal z 10, 15 | 105.4, 1585.3 | 29, 39 |
| Lid to cheek | Sagittal z 25 to 43 | 103.4, 1579.8 | 16 to 21 |
| Upper lid sulcus | Sagittal z 31, 37 | 110.3, 1608.6 | 11, 13 |
| Nasolabial | Level 1,530 and 1,540 | 114.6, z 19.6 | 10, 11 |
| Behind the ear | joints | - | 80 to 111 |
| Jaw to neck | joints | - | 44 to 59 |

f1 has no nasolabial fold and no upper lid crease as a fold: both are slopes under 15 degrees. The sulcus under the lower lip stands 4.9 mm behind the line from labrale inferius to pogonion (profile), inside Legan and Burstone's 4 +- 2 mm (source).

### Star-shape of every candidate course

A ray square to the course from a course point should meet the outer skin once. Counts are rays that meet it more often, by where they are.

| Part | Course tried | Folded rays | Where |
| --- | --- | --- | --- |
| Wall | Today's vertical line `x = 0` (`o-radial-wall-trunk.txt`) | 111 and 109; 11; a few | Ears; one station under the chin, 1,478 mm, phases -10 to 10 degrees; lid margins, nostrils |
| Wall | Vertical through the head's origin, `x = 20` (`radial-wall-origin.txt`) | The same pattern, 15 at 1,478 | - |
| Wall | Through the origin `[20, 1563, 0]` leaning 17.2 degrees forward, the neck's lean (`o-radial-wall-forward.txt`) | None under the jaw: every station from -110 to -42 has 180 of 180 rays once | The front reach grows from 63.9 mm at station -70 to 101.0 at -58; ears, lid margins and nostrils as above |
| Wall | Leaning 17.2 degrees back (`radial-wall-backward.txt`) | 177 at stations -104 to -92, and more above | The chin stands as an island |
| Eye | Through the globe's centre along endocanthion to exocanthion, `[-0.240, 0.194, 0.951]` (`o-radial-eye-canthal-left.txt`) | 143 of 5,929, all within the fissure's window, cover to 1.9 mm | The margins' own thickness; outside the fissure every ray meets the lids once |
| Eye | Through the globe's centre along Z (`o-radial-eye-z-left.txt`) | 163, 78, 24 | The same and the lateral end |
| Lips | The transverse line `[100, 1520.5, z]`, z to +-38 mm, phases -95 to 45 degrees (`o-radial-muzzle.txt`) | 76 of 10,857 | At 41 to 45 degrees, the nose's base, outside the lips |
| Nose | Today's course along +X (`o-radial-nose-forward.txt`) | 122 and 122 | Both alae, stations 9 to 19, phases 96 to 140 degrees |
| Nose | From `[109, 1538, 0]` along subnasale to nasion (`o-radial-nose-frame.txt`) | 96 and 95 | Only the nostrils' cavities, stations 8 to 16 |
| Nose | Vertical through `x = 110` (`o-radial-nose-vertical.txt`) | 108 and 104 | Only the nostrils' cavities |
| Nose | Transverse through the alae (`o-radial-nose-transverse.txt`) | 531, 290, 281 | Almost everywhere |
| Auricle | Its plane normal (joints) | 8 lines of about 1,300 | The rim's top curl |

The trial lines were drawn over the reference and opened (frame `o-axes.front.png`: each eye's line through its fissure from corner to corner, the mouth's line along the lips' line 12 mm past each corner; `o-axes.left.png`: the nose's line inside the nose from the lip to the brow, the wall's line from behind the jaw's angle through the tragus to the crown).

## Every part and connection side by side

Frames are `<region>.<view>.<pass>.png` of round `08-45-34`, each beside its `reference` pass.

| Part or connection | Kind | Today: representation, whose skin | Where its form lives | How its border is obtained | Defect seen (frame) | Cause, measured | Orthodox construction | Hypothesis: a function of |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Vault, scalp | Wall | Trunk hull, `trunk.head`, `trunk.head.back`, `trunk.crown` | Net grids | Net windows by station | Level lines across the back of the vault, px 180-330 x 150-330 of `head.left.clay` | Level stations 4.9 mm apart on a hull | One closed surface, pole on the scalp (Birn, source) | The head's course and frame |
| Forehead, glabella, brow ridge | Wall with ridges | `trunk.face` | Net grid | The same | Brow reads as a soft step, px 250-650 x 330-380 of `head.front.clay` | A net 2.5 by 3.5 mm | Brow ridge as a named curve (Katina, source) | Head frame; the orbit's upper rim |
| Temple, zygoma, cheek | Wall | `trunk.face`, `trunk.head` | Net grid | The same | Facets on the cheek's side, px 100-250 x 380-560 of `mouth.front.clay` and `eyes.front.clay` | One cast along -X at phases to 69 degrees: 1,539 grazing first faces | Cheek surfaces follow the skin's contour between the rings (Inspired 3D, source) | Head frame; zygion, gonion |
| Orbit, lids, canthi | Sheet over a globe, with an opening | `trunk.eyes` | Net grid | Window 792 to 826 | A relief with no margin and no fissure, px 130-340 x 430-520 of `eyes.front.clay`; reference px 150-350 x 440-530 has both | 85 rays enter twice; margin 1.9 mm against a 1.8 by 2.3 mm net | A ring round the opening; lids ride the globe and pivot at its centre (MPFB2, source) | The globe's centre and the canthal line |
| Fissure, lid margins | Opening | None | - | - | Absent | No operator | Edge of an opening (Katina's lid curves cross at the canthi) | Two margin phases about the canthal line |
| Lid to cheek, lid to brow, medial hollow | Borders of the eye's unit | Inside `trunk.eyes` and `trunk.face` | Net grids | - | Smeared | Turns of 11 to 39 degrees under the net's spacing | Unit borders: orbicularis retaining ligament below, supratarsal fold above (Kirwan, source) | The orbit's rim, fixed in the head |
| Nose: dorsum, sidewalls, tip, columella | Mound | `nose` family on a +X course | 20 fields, 3 nets | Recorded loop, rail, profiles | Straight flank, px 250-420 x 250-560 of `nose.low-oblique.clay` | The course's sections fold at the alae (244 rays) | Nine subunits bordered by ridges and valleys (Burget and Menick, source, abstract) | Nose frame: nasion, subnasale, pronasale |
| Alae, alar groove, soft triangles | Shell with a fold | The same family; the groove a band's depth profile | Recorded profiles | Recorded | No wing, no groove; reference px 760-800 x 400-560 | As above; the groove is a strip's profile (joints) | The groove at the junction of lateral crus and lobule (source, snippet) | The nose's own lines along its course |
| Nostrils, rims, sills | Opening | Cutter drawn in by its rim | Cutter family | Traced | A ledge, px 410-580 x 455-580 | A fixed-chord blend on 48 columns (joints) | Radial curves round the nostril | The nostril's axis in the nose frame |
| Nose to forehead, cheek, lip | Mound's border | Port band | Recorded | Recorded | Collar lines px 380-480 x 620-760 | A strip between unshared curves (joints) | Lateral aesthetic line, alar crease, sill (Kirwan) | A surface through nasion, alar bases, subnasale in the head frame |
| Upper lip, philtrum, cupid's bow | Roll on a ring | `trunk.mouth`, `trunk.face` | Net grid | Window 722 to 758 | A level slab, facets, px 180-750 x 330-470 of `mouth.front.clay`; reference bow px 380-520 x 400-470 | Net 1.8 by 2.9 mm; the edge is a ridge of 42 degrees | Ring of orbicularis oris; philtrum ridges and labial seal as named curves (Katina) | The muzzle line through both modioli |
| Lower lip | Roll | The same | Net grid | The same | A slab, px 180-750 x 530-620 | The same; its roll turns 76 degrees | The same | The same line, on the mandible |
| Lips' line, corners | Opening between two sheets | None: a slot of the net, px 180-750 x 470-530 | Net grid | - | Straight level slot; the reference's line is bowed with corners at px 190 and 720 | Two sheets in contact, air 0 to 1.2 mm: one height a ray | The skin opens along the contact line (the package's `IAutoMovieHumanMouthExpression`) | The line's phase about the muzzle line; maxilla and mandible |
| Labiomental sulcus | Fold | `trunk.chin`, `trunk.mouth` | Net grids | - | Present, soft | 58 degrees within 6 mm on a 1.4 to 1.8 mm net | Unit border between lower lip and chin (Kirwan) | The lips' lower border |
| Chin, jaw line, jaw angle | Wall on the mandible | Hull, `trunk.chin`, `trunk.collar` | Net grids | - | Close to the reference in `head.left.clay`, `head.front.clay` | - | Mandible curve, a ridge across the lower jaw (Katina) | Mandible frame |
| Floor under the jaw, head to neck | Sheet between two frames | Level sections | Hull and `trunk.collar` | - | A level line under the jaw (joints) | A level floor in level sections: one station folds, 11 rays | Neck as its own column (joints) | The neck's course continued into the head |
| Auricle: rim, scapha, antihelix, bowl, tragus, lobule | Folded sheet | Plate, tubes, cutter | Families and traces | Traced | Hook px 520-560 x 260-390 of `ear.left.clay`, shards, saw-toothed lobule | Tubes on a plate (joints) | One surface for the ear's centre, detail radiating (Inspired 3D) | The ear's frame and plane |
| Ear's root | Mound with a fold | Traced merge | - | Traced | joints | joints | - | Kept by the joints batch |
| Globe in its socket | Rigid part in contact | None | - | - | None in the figure | - | A sphere under the lids (UMBC, MPFB2) | The globe's centre |
| Mandible on the skull | Hinge with a slide | None: the stickman turns a jaw bone | - | - | - | No frame | Rotation of about 24 degrees with translation; the axis is not in the condyle (source) | The condylar line |

### Read down the columns

| Repeated cause | Rows | One answer |
| --- | --- | --- |
| A form that folds back, or two sheets in contact, is carried as one height a ray | Lids, fissure, lips' line, nostrils, auricle | The part is a family on a course it is star-shaped about, and its opening is a cut by a cutter on the opening's own axis whose rim is a fold of stated radius |
| A line the eye reads (a margin, the lips' line, a vermilion edge, the alar groove) lies across a net coarser than the line is sharp | Lids, lips, alae, labiomental sulcus | The family's course runs along those lines, so each is a longitudinal control curve: an outline, an inflection line or a declared crease |
| One cast direction serves a window that turns through 138 degrees | Cheeks, flanks of the nose | The wall is fitted to the skin itself; what relief remains is moved along its own region's normal |
| A part has no centre and no frame | Eyes, mouth, mandible | Centres first: the globe's centre and canthal line, the modioli, the condylar line, each in the head's frame |
| A border is recorded, or is a window in the trunk's stations | Nose's loop and profiles, every net window | The border is the host's skin cut by a surface fixed in the head's frame through published landmarks |
| A level section meets a level floor | Floor under the jaw | The head's wall on the neck's course, to which that floor stands at 17 degrees |

## Centres and frames

All in the head's frame, each placed from published measures. f1's values are the reference's own, read by the definition.

| Centre or frame | Definition | f1 | Basis |
| --- | --- | --- | --- |
| Head origin | Bitragion midpoint | `[20, 1563, 0]` (code; tragion read at the tragus's crest) | Exists |
| Frankfort axes | From tragion and the skin's orbitale | Not measured: the lid to cheek valley `[103.4, 1579.8, 31]` stands 9 degrees above the level through tragion | See [Risks](#risks) |
| Neck and head course | The line from the neck's base centre through the head's origin, continued to the crown | Leans 17.2 degrees forward (joints: 0.31 mm a millimetre) | joints |
| Ring to the neck | The plane square to that course through the cervical point, the corner of the floor under the jaw and the neck's front (Legan and Burstone's C) | Station -71 from the origin | Tool: the front reach starts to grow at station -70 |
| Globe centre | Interpupillary breadth apart; corneal apex a Hertel distance ahead of the lateral orbital rim; radius half the axial length | `[90.8, 1594.0, 31.5]`, radius 15.1 (the reference's eyeball is 30 mm across) | Interpupillary 61.7 +- 3.6 (ANSUR II women); Hertel 15.4 (white women); axial 23.5 (sources) |
| Canthal line | Through the globe's centre along endocanthion to exocanthion | Direction `[-0.240, 0.194, 0.951]`: 11.5 degrees up, 14 degrees back | Fissure 29.7 +- 1.6 by 11.6 +- 1.0 mm (Gao 2025); tilt 4.1 degrees (Rhee, via Faderani) |
| Muzzle line | The transverse line through the incisors' front, which stands the lips' margin tissue behind stomion; it reaches each side to cheilion's station | `[100.65, 1522, z]` by the rule; measured star-shaped at `[100, 1520.5, z]`; cheilion `[104.3, 1519.3, 22.1]` | Tissue 12.0 and 13.5 mm at the upper and lower lip margins (Hona and Stephan 2024); modiolus (snippet, provisional) |
| Mandible frame | Origin the midpoint of the condylar line, Z along it | Not placed | Opening is about 24 degrees of rotation with translation, 17.2 of 51.2 mm pure hinge (Woelfel 2014) |
| Nose frame | Origin subnasale, Y to nasion | Exists | Farkas |
| Nostril axis | From the nostril's mouth up the vestibule, in the nose frame | Today's cutter course | Exists |
| Ear frame | Origin tragion, Y the long axis, Z the plane normal | Exists | - |

### Landmarks and where each definition is read

No definition enters a law from recall. A landmark marked provisional keeps the rule written here until its source is read.

| Landmark | Definition used | Read in |
| --- | --- | --- |
| Nasion, pronasale, subnasale, labiale superius, stomion, labiale inferius, sublabiale, cheilion, crista philtri, alare, endocanthion, exocanthion, tragion, gnathion | A greatest curvature on one anatomical curve, or the crossing of two (the lid curves at the canthi, the mid-line upper lip and the labial seal at stomion, the mid-line chin and the mandible at gnathion) | Katina 2015, tables 2 and 3 |
| Sublabiale as the sulcus's deepest point; the sulcus's depth from the line labrale inferius to pogonion | Naini 2017, quoting Legan and Burstone | Full text |
| Subnasale, labiale, stomion, cheilion, crista philtri as measured between | The Spanish norms (PMC6714104) and Dolci 2021 (PMC8304677) use these landmarks; their definitions are Katina's rows above | Full text, by a research subagent |
| Pogonion | "The most anterior mid-point of the chin" | Katina 2015, body text, following Farkas 1994 |
| Alar base | Alare crest, "the facial insertion of each alar base"; the alar curvature point lies "along the crescent-shaped crease or fold formed where the alar cartilage meets the skin of the cheek", at its most posterolateral position | Katina 2015, table 2; FaceBase 3D Facial Norms notes, quoting Kolar and Salter 1997 (page read). The tool's rule for it is not written yet |
| Cervical point | "The innermost point between the submental area and neck" (Legan and Burstone's C); the tool reads the median cut's point farthest behind the chord from pogonion to the neck's front 60 mm below it | A lecture reproduction of Legan and Burstone 1980, with two peer-reviewed papers that use the same landmark (PMC7450202, PMC6144759); the original not obtained |
| Glabella | Provisional. "The most prominent point between the eyebrows, above the nasal root" | An unattributed table in an open paper (PMC12334920); Farkas 1994 not obtained |
| Menton | Provisional. "Lowest point on the contour of the soft tissue chin" | The same lecture reproduction |
| Orbitale | Provisional and not read on the skin. "The lowest point of the orbital margin" | PMC12334920, unattributed; see [Risks](#risks) |
| Modiolus | 14.4 mm lateral of the mouth's angle and 1.6 mm below the level through it, palpated, 200 sides of 100 Korean students | Abstract of The Location of the Modiolus in Living Korean (Korean J Phys Anthropol 2013); no deviation given |
| Gonion, zygion | Not used by a law of this note | - |

## The design, decided

### The head's wall

One family, `head`, on the neck and head course from the ring at the cervical point to the crown, sections square to the course, `bilateral`, fitted to the skin itself with the eyes', the nose's, the lips' and the ears' skin left out by their dividing surfaces. It owns the vault, the forehead with the brow ridges, the temples, the zygomatic mass and the cheeks, the chin, the jaw line and angle, and the floor under the jaw, and it runs on beneath every part that sits on it. A brow ridge and a zygomatic prominence that the wall's fields miss are reliefs, each moved along its own region's normal.

Basis: about this course no station folds under the jaw, where the level sections fold at one (tool). The course is straight at rest; the head's joint centre lies on it, 71 mm above the ring, so a nodded head is a turn of this course at that centre and the skin between the ring and the skull's base takes the turn's own weights.

Symmetry: a `bilateral` family is fitted as one half with its front and back extremes on the median plane and reflected.

### The ring to the neck

The joints batch makes the neck a family whose top is "the head's skin cut by the plane square to the neck's course through the head's origin". Drawn on the reference, that plane leaves the head through the upper lip and the occiput. The ring moves down the same course to the cervical point: below it every section holds the neck alone (reach 44.2 to 63.2 mm at station -72), above it the jaw enters. The neck and the head keep one course there, so the two families share one ring as equal ends of a continuation. The ring, the neck and the continuation stay the joints batch's; the head's wall above the ring is this batch's.

### Three openings, one construction

The eye, the mouth and the nostril are the same construction: a family on the line its skin is star-shaped about, whose course runs along the lines the eye reads, and an opening cut out of it by a `diff` on a declared loop, whose rim is a fold of stated radius. Only the cutter's wall inside the host is kept, and that wall is the lid margin, the lip's inner face or the nostril's wall.

**The loop is declared, never traced.** Each opening's loop is a curve the part's own law generates on the part's chart: the two margin phases about the canthal line, the lips' line about the muzzle line, the nostril's rim in the nose's chart. The cutter is that curve carried inward along the opening's axis, so one owner supplies the loop to both surfaces. Read in the engine: `AutoMovieEngineConstructionSharedLoop.create` serves a `diff` as it serves a `merge` (it keeps the part `inside`, and the width laws take `diff`), and the loop is `IAutoMovieConstructionPort.ILoop`, an ellipse on the host face's chart with one share a column joined by a periodic cubic, one C2 curve. The made case `test_construction_operator_pointed_cut` (test, `test/src/features/geometry/construction/operator`), run red first:

| Made loop on a plane, 64 columns, rim radius 0.5 mm | Result |
| --- | --- |
| A lens of two arcs of radius 20 mm on a 30 mm chord, its two ends points | Refused as `shared loop`: at the column beside a point the cutter's foot does not settle in 40 steps. A corner is not a C2 curve |
| The same lens with each end rounded on a circle of 3 mm tangent to both arcs | Admitted with no diagnostic; both rails stand on the fold's closed-form points, 0.5 mm from the loop, within 1e-6 mm |

So every opening's loop ends in a rounded end, not a point, and the same answer holds for all three. The end's circle spanned 1.9 columns in the admitted case; the column count of an opening follows from its smallest end radius by that span. No tolerance is involved.

**Which openings f1's rest figure has.** Both lid fissures and both nostrils. The mouth is closed: the reference's lips meet along a line with 0.0 to 1.2 mm of air. At rest the `lips` family therefore carries the line as a crease alone and the tree holds no oral cutter; the cutter exists as the expression's and the jaw's function and enters the tree when the opening is positive.

**Eye.** A family, `eye`, on the canthal line, from 8 mm past endocanthion to 8 mm past exocanthion, sections square to the line. Its front arc is the lids as one closed sheet: from the brow's lower edge over the upper lid, across the closed fissure, over the lower lid to the cheek. Along it run the upper lid sulcus as an inflection line, the two margins, and the lid to cheek valley as an inflection line. Between the sulcus and the lower margin its radius is the globe's radius plus the lid's thickness, a prior. The fissure is cut by a cutter, `fissure`, on the eye's forward axis: its loop is the two margin lines closed by a rounded end at each canthus, with the margin's roll as the rim's radius. The globe is a sphere of its own at the globe's centre, in contact and not sewn.

A blink is the upper margin's phase about the canthal line moving to the lower margin's: both the sheet and the cutter are functions of that phase and of the globe's centre.

**Mouth.** A family, `lips`, on the muzzle line from cheilion to cheilion, closed at each corner, sections square to it. (It first ran on to each modiolus; the body work's made case on a fading groove, below, moved its ends to the corners.) Its front arc is the closed mouth: the upper lip's skin from under the nose, the upper vermilion's edge, the lips' line, the lower vermilion's edge, the lower lip's skin to the labiomental sulcus. The two vermilion edges and the lips' line are its longitudinal curves; cupid's bow is the upper edge's phase as a function of the station, lower at the median and highest at the philtral crests; the philtrum is the upper lip's radius as a function of the station. Both ends close inside the cheek. When the mouth opens, the opening is cut by a cutter, `oral`, on the mouth's inward axis from corner to corner, whose loop is the lips' line parted and whose ends are rounded at each corner. The chin is not this family's: it is the wall's, below the sulcus.

The upper arc is fixed in the head and the lower arc in the mandible, with the modioli between the two. An opened jaw turns the lower arc and opens the cutter.

Symmetry: the family crosses the median plane; its control curves are even functions of the station, fitted on stations from the median to +Z and reflected, and its section at station 0 is the shared median curve.

**Nose.** One family, `nose`, on a course parallel to subnasale to nasion inside the nose, from under the columella's base to above nasion, sections square to it, `bilateral`. The dorsum and the columella are its front outline, the sidewalls and alae its side outline, the alar groove an inflection line. No ala is a family: on this course only the nostrils' cavities fold (tool). Each nostril is cut by its cutter as today, with the rim's radius as the fold's width (joints).

### How the parts meet

Each of `eye`, `lips`, `nose` and the auricle sits on the wall as a part on a host's side: a `merge` on a declared shared loop, each rail by the fold's law `hypot(reach, R tan(beta / 2))` (joints). Each loop is the host's skin cut by a surface fixed in the head's frame:

| Loop | Cutting surface | Arcs, with the turn measured on f1 |
| --- | --- | --- |
| Orbit | An elliptic cylinder about the eye's forward axis through the globe's centre, semi-axes half the orbit's breadth and height (40.5 by 37.3 mm, Van der Walt 2025) | Brow 11 to 13 degrees, lid to cheek 16 to 21, medial hollow 29 to 39, lateral under 15: tangent or shallow all round |
| Mouth | The wedge about the muzzle line between the half plane through sublabiale and the one through subnasale, closed by a plane at each modiolus's station. A cylinder through sublabiale would cut the upper lip off: labrale superius stands 25.2 mm from the line and sublabiale 18.4 | Sulcus 58 degrees at the median to 20 at z 21; cheek side 10 to 11; under the nose hidden beneath the nose |
| Nose | The plane through both alar bases parallel to subnasale to nasion, between the levels of those two. Two planes through nasion and subnasale, one through each alar base, were read first and kept 1,662 vertices, 578 of them the eye's (the cheek and the lower lid stand in front of such a plane) | Alar groove 71 to 77, alar base on the lip 66 to 82, subnasale 54, forehead and sidewalls tangent |
| Ear's root | joints | 80 to 111 behind, tangent in front |

Order: the wall; the lips and the eyes onto the wall; the nose onto the wall with the lips and the eyes, since its base stands on the upper lip and its root beside the lids; the auricles; then the cutters.

**The surfaces bound each other.** Read alone, two pairs of surfaces cross inside the skin. The eye's cylinder reaches 20.25 mm from the globe's centre along the canthal line, which runs forward as it runs medially, so beside the nose's root its medial end stands ahead of the nose's plane: 10 vertices at x 107.5 to 108.2, y 1,596.4 to 1,597.8, at most 0.8 mm ahead of the plane (x 107.4 there). The lips' upper half plane and the nose's lower level both pass through subnasale, so the one vertex within rounding of it, `[120.8, 1538.2, 1.6]`, is held by both. Neither is ordered by precedence. As the joints' dividing surfaces do, each surface is declared once and read by both neighbours with opposite signs: the eye's region is the inside of its cylinder behind the nose's plane, the lips' region the inside of their wedge outside the nose's region, and the wall's the outside of all three. The three regions and the wall are then complements by construction.

Whose skin each surface makes it, counted on the reference's outer skin on +Z above the ring, every pair at once (tool `o-divides.txt`; the landmarks by rule in the same file, the alar base `[111.6, 1545.0, 18.2]` among them; the clips are `FamilyConicHeadParts.build`):

| Kept by | Vertices | Box |
| --- | --- | --- |
| Wall | 5,922 | The rest of the head above the ring |
| Eye | 1,387 | x 90.7 to 112.5, y 1,576.2 to 1,611.6, z 14.9 to 53.2 |
| Nose | 1,270 | x 108.4 to 136.6, y 1,537.7 to 1,598.4, z 0 to 23.0 |
| Lips | 1,036 | x 102.4 to 123.4, y 1,505.0 to 1,537.8, z 0 to 35.9 |
| Nose and eye, each surface read alone | 10 | Beside the nose's root, x 107.5 to 108.2, y 1,596.4 to 1,597.8 |
| Nose and lips, each surface read alone | 1 | At subnasale |
| No part | 0 | - |
| With the nose's surface bounding the eye's and the lips' regions | Wall 5,922, eye 1,387, nose 1,281, lips 1,036; two parts 0; no part 0 | - |
| The same with the lips ending at cheilion, as decided (`o-divides-ruled.txt`) | Wall 6,188, eye 1,387, nose 1,281, lips 770 (z to 22.1); two parts 0; no part 0 | A vertex that stands exactly on a shared surface (cheilion itself, on the lips' end plane) is the part's, not the wall's |

The auricle is not in the count: its root surface is the joints batch's and is not declared yet.

Every fold of the face turns less than the 2.8 rad the join's operator test admits (joints). The lips' line and the lid margins are no folds between walls: they are the cutters' rims.

### The auricle

The joints batch makes the plate one sheet with its root join. Its lateral face's form is this batch's: height nets along the plane normal in the ear's frame for the rim, the scapha, the antihelix with its two crura, the triangular fossa, the bowl, the tragus, the antitragus and the lobule, one template scaled by the ear's length, breadth and protrusion. The rim's top curl is drawn as a steep wall (joints).

### Taken over from the joints note

| Row of the joints note | Owner now |
| --- | --- |
| Nose and alae: the alae as two new families | This batch, changed: no alar family; one nose family on the nose frame's course |
| Nose's shared-loop join, nostril cuts | This batch |
| Ear ridges and bowl as nets on the plate | This batch (the nets); the plate as one sheet and the root join stay with the joints batch |
| Lids, lips, mouth corner (out of the joints inventory) | This batch |
| Neck family, both of its rings, their continuations | Joints batch, with the upper ring moved to the cervical point |
| `trunk.collar` when the neck is split off | Joints batch; the trunk family ends at the neck's base ring, and every `trunk.head*`, `trunk.face`, `trunk.mouth`, `trunk.eyes`, `trunk.chin` and `trunk.crown` net goes with this batch |

### The eye's and the lips' sections on paper

Read in `AutoMovieHumanConicSection.ts` (code, lines 20 to 231). A section is one closed chain of conic arcs through anchors, and every anchor carries one tangent that both its arcs share: an extreme (`u`, `v`), a median (`m`), an inflection (`i`) or a feature (`f`, a point on a feature line with its own offset and heading as fields along the stations). No anchor is C0. A shoulder is held under 0.85 because one near 1 turns within a millimetre and draws a crease.

So the lips' line cannot be a crease of the layout, and the risk this note carried is settled: at rest the line is a groove, a feature run of an inflection, a concave floor and an inflection on the `lips` layout, its floor where the two lips meet and its two inflections one rim radius either side. The reference's line is no wider than its mesh shows (air 0.0 to 1.2 mm), and the generated net draws it today as a notch turning 107 degrees within 6 mm. The two vermilion edges are convex feature lines of the same layout. The lids need no crease: with the fissure cut out, the sheet's lines are the upper lid's sulcus and the lid to cheek valley, each a groove of `inflected`, and the two margins are the cutter's rim.

| Family | Sections at 1 mm | Rays that meet the outer skin once (the layout's premise, star-shape) | Longitudinal lines, as phases about the course on f1 |
| --- | --- | --- | --- |
| `eye` | 49, stations -24 to 24 from the globe's centre | Every ray outside the fissure's window; inside it 143 rays cross the margins' own thickness, which the cutter removes | Margins at the fissure's edges, phases -40 to 16 degrees at the widest; sulcus above, valley below |
| `lips` | 77, stations -38 to 38 | 10,781 of 10,857; the rest at 41 to 45 degrees, the nose's base, outside the wedge | Subnasale 38.7 degrees, labrale superius 20.6, the line 0, labrale inferius -28.2, sublabiale -63.1 (arithmetic on the median landmarks about `[100.65, 1522]`, not a tool reading) |

How many of those sections are admitted chains in the layout is the fit tool's precheck, which runs when the joints queue is idle; it is not read yet.

**How each feature line ends.** The body work's made case (`test_human_conic_lined_fade`, read with its log entry) shows that a groove which ends between two stations by blending to the smooth section is refused by the layout ("the tangent lines meet behind the start"); it is admitted only when it narrows, its width, depth and turn going down together, and on one layout it keeps a remainder (0.6 mm deep and 5.5 mm wide at a quarter of its width in that case). So every feature line of the head either leaves its part's domain or narrows to a remainder where the part is hidden:

| Line | Where it ends in life | How it ends in the family |
| --- | --- | --- |
| Lips' line; both vermilion edges | The mouth's corner | With the family: `lips` closes in a tip at each cheilion, and the cap shrinks the whole section, lines and all, to its pole. Carried to the modiolus as first designed, the line's remainder would lie across 14 mm of cheek |
| Upper lid's sulcus; lid to cheek valley | Past each canthus | Each narrows from the canthus to a remainder and runs on to the family's end, 8 mm past the canthus, which lies outside the orbit's cylinder and inside the wall. On f1 they turn 11 to 21 degrees, so the remainder is under the reading's step |
| Alar groove | It does not end: above the ala it runs on as the valley between the nose's flank and the cheek to the medial canthal hollow (turns at 6 mm: 71 and 77 at the ala, 45 at 1,560, 16 at 1,570, 31 at 1,580, 35 at 1,590) | One line over the nose's whole domain, narrowing to its least at 1,570 and leaving the domain at nasion's level and at subnasale's |
| Dorsum, columella, the nose's breadth | Outlines, no groove | - |
| Philtrum; cupid's bow | Not lines along the course | The upper lip's radius and the upper edge's phase as functions of the station |

A made case of this on the lips' own layout (a groove on a section that closes in a tip) is not written yet.

### Each declaration's premises against today's values

Premises are those of the joints note's operator table, taken there from the interfaces' admission paragraphs; `IAutoMovieConstructionJoin` was read again for this note.

| Declaration | Premise | Value today | What makes it hold |
| --- | --- | --- | --- |
| `head`, `eye`, `lips`, `nose` families | Every section star-shaped about the course, between stations as well | Measured on the reference: see the star-shape table | The courses above |
| `lips` at the line | A section's notch must keep a margin from the ray | The two sheets lie along the ray: air 0 to 1.2 mm | The closed surface carries a crease at the line and no notch; the faces behind it are the cutter's wall |
| Each `merge` with `loop` | Loop within `tolerance` of the part's face | Not readable: no family exists | Complementary clips of one surface, as the joints note's rule |
| The same | `one kept side` | Not readable | Each part's course starts inside the wall |
| The same | Fold radius under both surfaces' radii; `cleft` under 3.0 rad | Largest turn 82 degrees (1.43 rad) | - |
| `nose` on wall and lips | The loop crosses from one host face to the next | Not read | The mixed join's scenario 6 (joints) |
| `fissure`, nostril `diff` with `loop` | The loop one C2 curve with a positive share at every column | A pointed lens is refused, a lens with 3 mm ends admitted (made case) | Rounded ends |
| The same | Loop within `tolerance` of the cutter's face; one kept side | Exact by construction in the made case | The cutter is the loop's curve carried inward |
| The same | Fold width positive; rails placed, blend unfolded | Admitted at 0.5 mm on a plane; on a lid over a globe not read | Rim radius under the sheet's radius of curvature |
| Today's nostril `diff`, traced | A closed loop near the seed, transversal all round | Admitted on 48 columns, 128 refused by the triangulation (joints) | Replaced by the declared loop |
| Continuation at the ring | Equal-order ends share a ring | Not read | One course, one plane (joints batch) |

## The lists

### Representation and law changes

| Change | Module |
| --- | --- |
| Frames `eye`, `mouth`, `mandible` and the Frankfort axes; points for the globe's centre, canthi, modioli, cervical point | `AutoMovieHumanF1Frames`, `AutoMovieHumanF1Placing`, `AutoMovieHumanF1Landmarks` |
| Families `head`, `eye`, `lips`, `nose` (new course), cutters `fissure`, `oral`; the globe | New files `AutoMovieHumanF1Head`, `...Eye`, `...Lips`, `...Fissure`, `...Oral`; `AutoMovieHumanF1Nose` rewritten |
| The trunk ends at the neck's base | Joints batch |
| The tree: four shared-loop joins a side or median, three cuts, the continuation | `AutoMovieHumanF1.constructionFrom`, edited by the joints worker's hand or after its batch, by agreement in the logs |
| Priors, each with its source in its comment: lid thickness, margin radius, rest gap of the lips, nostril rim radius, orbit semi-axes, modiolus offsets | A new `AutoMovieHumanF1FacePriors` |

### Fit runs

One at a time, after the joints queue; costs scaled from the joints note's one timed fit (318 sections, 28 minutes).

| Family | Sections | Cost |
| --- | --- | --- |
| `head` wall | About 250 at 1 mm | 25 min |
| `eye` (+Z only) | 48 | 5 min |
| `lips` (median to +Z) | 37 | 5 min |
| `nose` | 62 | 6 min |
| `fissure`, `oral` cutters | Laws of the margins' and the line's curves, no fit | - |
| Auricle's lateral nets | One net family | 20 min |
| Brow and zygoma reliefs on the new wall | Two windows | 10 min |

The fit tool needs each part declared with its clip. `FamilyConicBody.ts` is held by the joints worker; the head's declarations are `FamilyConicHeadParts.build` (courses, domains, layout kinds, complementary clips), adapted to the tool's `IPart` once the joints worker exports it.

The queue, in order, to start when the joints queue is idle (`joints-batch-20261117/queue.log`), each run named in the progress log before it starts. From `test/`, after `pnpm conic:build`; the part names are those of `FamilyConicHeadParts`, and the exact flags of a head part stand on the exported `IPart` and are completed then:

| # | Command | What it answers |
| --- | --- | --- |
| 1 | `node .shots/esbuild/FamilyConicBody.cjs lips --precheck`, then `eye`, `nose`, `head` | For every 1 mm section of the part's clipped skin: whether it is an admitted chain on the part's layout, with the station and the layout's own refusal where it is not. No fit runs before all four are read |
| 2 | `node .shots/esbuild/FamilyConicBody.cjs head` | The wall, about 290 sections |
| 3 | `node .shots/esbuild/FamilyConicBody.cjs nose` | 62 sections on the new course |
| 4 | `node .shots/esbuild/FamilyConicBody.cjs eye` | 49 sections, +Z only |
| 5 | `node .shots/esbuild/FamilyConicBody.cjs lips` | Stations from the median to cheilion, reflected |
| 6 | `node .shots/esbuild/FamilyConicBody.cjs head --wall=stored --refit-reliefs=head.brow,head.zygoma` | The two reliefs on the fitted wall |
| 7 | `node .shots/esbuild/FamilyConicBody.cjs plate` with its lateral nets | With the joints batch's plate |

`--precheck` exists (code, `FamilyConicBody.ts` lines 2206 to 2230): it builds the part's sections and their tables and stops before the fit, logging for every section a `family-body-closed` row with its closure, its clearance and `admitted`, and a `family-body-observed` row with the sections read, skipped and missed. The head queue's first command is therefore `node .shots/esbuild/FamilyConicBody.cjs lips --precheck` once `lips` is a declared part of the tool.

### The three parts' lines on f1, each in its own frame

One run (`FamilyConicFace.ts --contours --outer`, tool `o-contours.txt`), +Z and the median plane. No part's law is written or rewritten before all three are laid beside their published shapes.

**Eye**, stations along the canthal line from the globe's centre, heights above that line: the table under [The eye's law against f1](#the-eyes-law-against-f1).

**Lips**, in the mouth's frame (origin `[100.6, 1522.0, 0]`, half length 22.1): height above the origin, then distance ahead of it. A crest is the lip's most forward point in the sagittal cut; the mesh carries no vermilion colour, so no vermilion border is read.

| Station | Valley under the nose | Upper lip's crest | Lips' line | Lower lip's crest | Valley under the lower lip |
| --- | --- | --- | --- | --- | --- |
| 0 | 16.0, 20.0 | 8.5, 22.7 | 0.0, 12.8 | -10.0, 18.7 | -18.0, 9.2 |
| 4 | 15.8, 20.4 | 8.8, 22.0 | -0.2, 13.1 | -9.7, 18.7 | -19.2, 9.0 |
| 8 | 16.2, 19.6 | 11.7, 20.8 | -0.3, 12.7 | -8.3, 18.3 | -20.3, 8.4 |
| 12 | 20.4, 15.8 | 9.9, 19.3 | -0.6, 11.3 | -8.1, 16.6 | -22.1, 7.1 |
| 16 | 21.1, 13.0 | 7.6, 17.2 | -1.4, 8.6 | -9.9, 13.6 | -25.4, 4.9 |
| 20 | 28.1, 9.4 | 4.6, 14.0 | -2.4, 5.5 | -8.9, 10.3 | - |
| 22 | 27.5, 9.0 | 9.0, 12.6 | -2.5, 4.2 | -8.0, 8.5 | - |

The lips' line is level within 0.6 mm to station 12 and falls 2.5 mm to the corner, drawing back from 12.8 to 4.2 mm ahead of the mouth's line. The upper lip's crest stands lowest at the median (7.9 at station 2), highest at station 8 (11.7), and falls to the corner: a bow whose crest lies 8 mm from the median. The row at station 22 reads the corner itself and its upper crest is not a lip's.

**Nose**, in the nose's frame (course from `[111.6, 1545.0, 0]` along subnasale to nasion, 60.7 mm): stations from subnasale's level.

| Station | Median outline ahead of the course | Sharpest valley on +Z: ahead, from the median plane, turn |
| --- | --- | --- |
| 0 | 8.4 | - |
| 8 | 18.7 | 6.8, 9.4, 59 |
| 12 | 23.7 | 5.4, 9.1, 113 |
| 16 | 25.6 | 8.6, 9.0, 127 |
| 20 | 25.6 | 1.5, 17.2, 59 |
| 24 | 24.1 | 3.8, 15.8, 32 |
| 32 | 18.8 | 3.0, 17.2, 17 |
| 40 | 14.8 | -2.3, 20.9, 22 |
| 48 | 11.3 | -5.0, 16.9, 44 |
| 56 | 8.5 | -0.6, 13.5, 27 |
| 60 | 8.3 | 0.6, 15.8, 24 |

The median outline rises from 8.4 mm at subnasale to 25.6 at stations 16 to 20, the tip, and falls in a nearly straight line to 8.3 at nasion (about 0.43 mm a millimetre from station 20 to 60). The valley beside the nose is read as one line from station 20 up: 59 degrees at the ala's top, 15 to 17 between stations 28 and 36, 44 at station 48 beside the medial canthus. At stations 8 to 16 the reading takes the nostril's rim (9 mm from the median plane, 113 and 127 degrees), not the alar groove, which the level cuts read at 71 to 77 degrees 18.6 mm out: a limit of this mode's box. The side outline this mode prints is the edge of the nose's region on its own plane, not the ala's breadth, and is left out here.

### The eye's law against f1

`AutoMovieHumanF1EyeLaw` was written with each margin as a parabola through both canthi with its apex at the fissure's middle, the middle at the globe's centre and the canthi on the canthal line. f1's margins, read in the eye's own frame (tool `o-margins.txt`, `--margins`: the skin's rim points by 2 mm bands of station along the canthal line from the globe's centre):

| | The law as written | f1 |
| --- | --- | --- |
| Canthi | On the line, at stations -L/2 and L/2 | Endocanthion at station -18.8, exocanthion at 15.8, both 3.3 mm below the line: the fissure's middle stands at -1.5 and the globe's centre 3.3 mm above the canthi's chord |
| Upper margin's apex | At the middle | 4.4 mm above the line (7.7 above the chord) at station -6 to -4, about 3.5 mm medial of the middle |
| Lower margin's lowest | At the middle | 9.4 mm below the line (6.1 below the chord) at station 0 to 4, about 3.5 mm lateral of the middle |
| Fissure height at the middle | The input | 13.3 mm (4.1 above, 9.2 below) |
| The lid's face from the line | `sqrt(rho^2 - s^2)`, one sphere | 16.9 at the middle (upper) and 16.0 (lower); 12.5 at station -11 and 10.8 at 13, within 0.3 mm of a sphere of 16.7 between stations -12 and 14; the medial canthus, 18.8 from the centre, lies outside that sphere |

So the law as written does not stay: the canthi do not lie on the line through the globe's centre, and medial of station -12 the lid leaves the globe's sphere toward the canthus. The sphere itself holds over the middle 26 mm.

The two apexes' skew is not a property of f1's margins. It is the canthal tilt read in a tilted frame: heights were taken square to a line that rises 10.2 degrees laterally, and an arch 30 mm wide and 7.7 mm high has its highest point against such a line where its own slope is `tan 10.2`, 3.5 mm toward the low end (`0.18 L^2 / (8 h)`), medial for the upper margin and lateral for the lower. In a level frame about the pupil both apexes stand within the reading's 2 mm band of the pupil's vertical. That is the frame the published contours use, and it is the frame the law must be written in.

### Published shapes beside f1

Read by a research subagent; the status of each source is its own (full text read, full text through a page reader whose tables want a spot check, or abstract).

| Shape | Published | f1 |
| --- | --- | --- |
| Canthi against the pupil's level | Medial canthus 3.7 mm (SD 1.1) below the pupil's centre, lateral canthus 1.9 (1.4) above the medial one, 320 white Dutch subjects (van den Bosch 1999, full text read) | Endocanthion 6.3 mm below the globe's centre's level, exocanthion 0.2 below it (world heights 1,587.7 and 1,593.8 against 1,594.0) |
| Canthal tilt | About 4.4 degrees from those two numbers; 9.3 (2.6) in Japanese women, 8.8 (3.2) in Koreans (page reader) | 10.2 |
| Upper margin's contour | A radial profile about the pupil's centre every 15 degrees, Korean women (Shin 2025, page reader): 4.62 mm straight up, 6.28 at 45 degrees temporal of it, 5.23 at 45 nasal, 12.15 at the temporal end and 9.12 at the nasal; its highest point 1.67 mm (1.02) temporal of the pupil. Brazilian and Spanish cohorts put it 0.2 to 0.8 mm temporal. No number was found for "nasal in Caucasians" | 3.8 to 4.1 mm above the canthal line at the centre's station; not yet read in a level frame |
| Lower margin's contour | A radial profile from one Chinese cohort whose scale is small and is used by ratio only; its deepest point 0.9 mm temporal of the pupil, flat within 0.04 mm; MRD2 5.2 to 5.6 mm against MRD1 3.5 to 3.65 (Adelaide, page reader) | 9.2 to 9.4 mm below the canthal line at the centre's station, 2.3 times the upper |
| Margins' arc over the fissure's chord | Upper 1.32 to 1.35, lower 1.10 to 1.12 (from Gao 2025's arcs and widths) | Not read |
| Philtral crests' spacing over mouth width | 0.245 to 0.26 in four groups (FaceBase, Jayaratne 2013) | The upper lip's forward crest is highest at station 8 of a half width of 22.1, which is the lip's fullness and not the vermilion's peak: not comparable |
| Lip heights: ls to sto, sto to li, sn to sto, sto to sl, ch to ch | 7.4 (1.4), 8.5 (1.9), 20.5 (2.5), 17.6 (2.3), 48.1 (3.5) mm, white women 20 to 40 (FaceBase) | 8.5, 10.0, 16.0 (arithmetic on the median landmarks), 18.4, 44.2 |
| Cupid's bow depth; the vermilion border's course; the lips' line's shape | Not found as numbers anywhere | The line level within 0.6 mm over the middle 24 mm, 2.5 mm lower at the corner |
| Nose: n to sn, sn to prn, their ratio | 54.7 (3.9), 20.2 (1.9), 0.37 (FaceBase women) | 60.7, 24.7, 0.41 |
| Dorsum's shape; columella to lobule; alar groove's course | Conventions in reviews only, no measured population | The median outline falls in a nearly straight line from the tip to nasion |

What the published shapes allow, and so the three laws' forms, decided together:

| Law | Frame | From published shape | From the person | Stays on f1 alone |
| --- | --- | --- | --- | --- |
| Eye | Level, about the pupil's centre; the result is turned into the eye's frame by the canthal tilt | The upper margin as Shin's radial profile scaled by MRD1; the lower margin's profile by ratio scaled by MRD2; the canthi's heights below the pupil | Fissure length and height (inputs today), the tilt | Where the lid leaves the globe's sphere toward the medial canthus |
| Lips | The mouth's frame | Crest spacing a quarter of the mouth's width; the four lip heights | Mouth width, the two vermilion heights (inputs today) | The bow's depth, the edges' course between crest and corner, the line's fall to the corner |
| Nose | The nose's frame | Height, protrusion and their ratio | The three nose inputs | The dorsum's line, the columella's, the groove's course |

Each row's last column is shape no source gave. It enters as f1's own curve in the part's normalised coordinates and is marked estimated, to be checked on the other references before it is called a law. None of the three laws is rewritten yet; the eye's module keeps its provisional mark.

### The three laws, written together, beside f1

`AutoMovieHumanF1EyeLaw`, `AutoMovieHumanF1LipsLaw` and `AutoMovieHumanF1NoseLaw` are pure modules with unit tests on made measures (`test_human_f1_eye_law`, `test_human_f1_lips_nose_law`). Nothing reads them. f1's side of each comparison is the instrument's reading (`o-contours.txt`), never a number in a module.

**Eye.** The law is written in the level frame about the pupil: each margin is a published radial profile taken as its ratio to the distance straight up (Shin 2025) or straight down (the Chinese cohort), scaled by the person's MRD1 and MRD2; the medial canthus stands 3.7 mm below the pupil (van den Bosch) and the lateral one above it by the fissure's length times the sine of the tilt. f1's rim in the same frame, as ratios (the sectors at 75 and 105 degrees hold no rim point):

| Direction from the nasal side | 0 | 15 | 30 | 45 | 60 | 90 | 120 | 135 | 150 | 165 | 180 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Published upper ratio | 1.97 | 1.57 | 1.30 | 1.13 | 1.03 | 1 | 1.17 | 1.36 | 1.66 | 2.11 | 2.63 |
| f1 (straight up 3.76 mm) | 2.51 | 1.90 | 1.38 | 1.32 | 1.10 | 1 | 1.20 | 1.67 | 2.47 | 3.17 | 4.11 |

| Direction | 195 | 210 | 225 | 240 | 255 | 270 | 285 | 300 | 315 | 330 | 345 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Published lower ratio | 2.10 | 1.64 | 1.34 | 1.15 | 1.05 | 1 | 1.00 | 1.08 | 1.26 | 1.64 | 2.41 |
| f1 (straight down 8.23 mm) | 1.71 | 1.42 | 1.30 | 1.10 | 1.04 | 1 | 1.03 | 1.07 | 1.28 | 1.84 | 1.85 |

The lower margin agrees with the published shape within 0.05 from 225 to 315 degrees. The upper margin agrees within 0.07 from 60 to 120 degrees and stands 1.2 to 1.6 times farther out toward both ends: f1's fissure is long for its height (15.5 mm to the temporal end against a 3.76 mm rise, where the published eye has 12.15 against 4.62), and no single scale of the published contour gives that. By the verification rule a published shape that misses the person is the wrong population's, and the person's own value enters by the published definition: the law takes the person's own radial profile as a measured input (`upperProfile`, `lowerProfile`, the same thirteen and eleven directions) and falls back on the published one. f1's two sizes are also far from the published means: MRD2 8.2 mm against 5.2 to 5.6, and the medial canthus 6.3 mm below the pupil's level against 3.7.

**Lips.** The law places the two vermilion edges from published lip heights, not from the reference: at the median the person's two vermilion heights above and below the lips' line (labiale superius to stomion, stomion to labiale inferius), the upper edge's crest an eighth of the mouth's width from the median (the published crest spacing of a quarter), both edges falling to the line at the corner. The bow's depth and the line's fall are inputs with no published prior, and the curves between the known points are declared polynomials. f1's mesh has no colour, so the reference cannot show a vermilion border; it checks only what geometry shows:

| | Law with f1's own inputs (width 44.2, heights 8.5 and 10.0, fall 2.5) | f1 |
| --- | --- | --- |
| Lips' line at stations 8, 12, 16, 20 | -0.33, -0.74, -1.31, -2.05 | -0.3, -0.6, -1.4, -2.4 |
| Upper edge at the median | 8.5 by its input | 8.5, labrale superius |
| Lower edge at the median | -10.0 by its input | -10.0, labrale inferius |
| Upper edge's crest | Station 5.5 | Not readable: the upper lip's most forward point peaks at station 8, which is the lip's fullness |
| Edges from the crest to the corner | Fall to the line | Not readable: the forward points stay 4 to 9 mm off the line to the corner |

**Nose.** The law gives the tip from the three lengths by the law of cosines and joins it to subnasale and to nasion by straight lines, a convention stated as one. With f1's lengths (60.7, 24.7, 46.6 by arithmetic on its landmarks) the tip stands 17.5 mm above subnasale and 17.4 ahead of the line; f1's outline, read ahead of a course 8.35 mm behind that line, is 17.25 ahead at stations 16 to 20. The straight dorsum stands 1.1 mm ahead of f1's at station 32, 1.9 at 40 and 2.1 at 48: f1's dorsum is slightly hollow. The straight columella stands 2.4 mm behind f1's at station 8: the lobule is fuller than a line. With the mode's rule corrected (the valley lateral of the nostril's rim), the alar groove reads 58, 75 and 73 degrees at stations 8, 12 and 16, 17.9 to 18.7 mm from the median plane, and runs on upward as tabled above; no law gives its course.

So the three laws agree with f1 where a published shape or a closed form stands behind them (the lower lid's middle, the lips' line, the nose's tip) and miss it where only a convention or another population's shape does (the upper lid's ends, the dorsum, the columella). Those stay inputs of the person.

### Templates: one record, widened

The auricle's lateral nets, the brow ridge and the zygomatic relief go on the body work's one record, `AutoMovieHumanFeatureTemplate`, widened by four things, and not on a second mechanism of the head's own. The reason: each of the four is a general lack and not the head's (a clavicle and a spinal furrow curve, tendons part at the wrist, a shin's crest falls differently to either side, and any ridge long against its wall's radius needs the wall's own normal), and a second generator of height nets would be a second representation of one thing with its own continuity rule at every footprint's edge.

| Lack | Fields asked for | Made case, closed form |
| --- | --- | --- |
| A centre line that is a curve | `through: V3[]` of three or more landmarks in the segment's frame in place of one `along`; the centre line is the C2 curve through them by chord length; `extent[0]` becomes its arc length | Three landmarks on a quarter circle of radius 30: a point 2 mm outside the circle reads the profile at `2 / half` whatever its angle |
| A branch | `joins: { template: string; end: "start" or "end" }`: that end lies on another template's centre line and has no ramp of its own there; where two footprints overlap the height is the C2 maximum of the two, not their sum | Two equal straight ridges in a Y: at the junction the height is `h`, not `2 h`, and the surface has no step along either centre line |
| A profile with two sides | `sides: [number, number]`, the half widths toward `across` and away from it, in place of `extent[1]` | Half widths 4 and 8: the points at +2 and -4 read the same height |
| The direction the height stands along | `stands: "frame" or "host"`: along `along x across`, as today, or along the host wall's own normal at each point of the footprint | A ridge of height `h` on a cylinder of radius `R`, half round it: its crest stands `R + h` from the axis at every phase |

On that record the head's templates are, as landmarks and spans (no fit read; no dimension inside the auricle was found published, so the spans' proportions are f1's own, estimated, until the other references are read):

| Template | Class | Frame | Span |
| --- | --- | --- | --- |
| Helix rim | Pad over cartilage | Ear, height along the plate's normal | A curve from the helix's root above the tragus over superaurale and postaurale to the lobule; two sides, rolled inward and ending in the free edge outward |
| Scapha | The same, a hollow | Ear | The curve one rim width inside the helix's |
| Antihelix with its crura | The same | Ear | A curve from the antitragus up; two branches from its upper end that join the helix's rim |
| Concha | The same, a hollow with a plateau | Ear | An ellipse between the antihelix, the tragus and the antitragus |
| Tragus, antitragus | The same, bumps | Ear | One footprint each |
| Brow ridge | Bone | Head, height along the wall's normal | A curve along the orbit's upper rim from above endocanthion to frontotemporale; two sides, steep toward the orbit |
| Zygomatic prominence | Bone | Head, along the wall's normal | An ellipse about zygion along the arch |

Published sizes for the auricle as a whole: length 59.4 (3.9), breadth 33.2 (2.8), protrusion 20.4 (2.7) mm, ANSUR II women.

### Kernel, Human and tool pieces

| Piece | Where | Made case that fails first |
| --- | --- | --- |
| A loop as a face's skin cut by a declared surface | Human: `AutoMovieHumanSkinCutLoop.shares`, written with its made case `test_human_skin_cut_loop` | A plane cut by a cylinder of radius 20 about a line tilted 0.6 rad: the shares against a circle are `1 / sqrt(cos^2 c cos^2 t + sin^2 c)`; a cylinder one hundredth wider must be missed; a ray out of reach and a centre outside are refused. It gives a loop's shares at the columns; the curve between columns is the engine's cubic |
| A `diff` on a declared loop for an opening with two ends | Engine: exists | Written and run: `test_construction_operator_pointed_cut`, red on its first run (the pointed lens refused, where this note first expected it admitted), green with the pointed lens expected refused and the rounded lens admitted on closed-form rails. No engine change is needed |
| The same `diff` realized through `AutoMovieEngineSolidBody.merge` and drawn | Engine | The rounded lens cut from a plane face: a two-manifold whose only free edges lie on reported boundaries, as the mixed join's sixth scenario reads a merge. Not written yet |
| A family that crosses its own plane of symmetry along the course, fitted on half its stations | Fit tool | A made spindle fitted on stations 0 to L and reflected: its fields' odd derivatives at station 0 are zero |
| A relief moved along a direction that is a field of the window, not one constant | Human | A net on a made cylinder moved along the local normal: a height of 1 mm stands 1 mm off the wall at every phase |
| The instrument's paired landmarks by rule (canthi, cheilion, alar base) | Tool, this note's `FamilyConicFace.ts` | - |

### Deletions

| Deleted | Replaced by |
| --- | --- |
| `trunk.head`, `trunk.head.back`, `trunk.crown`, `trunk.face`, `trunk.mouth`, `trunk.eyes`, `trunk.chin`; the trunk's knots above the neck's base | `head`, `eye`, `lips` |
| The nose's port, `NOSE_RAILS_MM`, `NOSE_PROFILES`, its recorded loop, the nose's `floor`, `under` and `side` nets | The nose's shared-loop join and its own lines |
| `ridge.helix`, `ridge.antihelix`, `cut.<concha>` and their families | The plate's nets (with the joints batch) |
| `FamilyConicConvertLids.ts`, `FamilyConicConvertChin.ts`, `FamilyConicConvertNose.ts`, `FamilyConicJaw.ts` if nothing else reads them | This note's instrument |

### The batch

1. Frames, points and priors, each with a unit test of its definition.
2. Kernel and tool pieces, each red first.
3. The fit queue, each family admitted alone by its star-shape and its join's premises before the next.
4. Families stored; the tree declared; the deletions.
5. The whole-figure round, shared with the joints, body and nails work: the head lands in that one round and has none of its own.

Steps 1 and 2 are written in new files. `AutoMovieHumanF1Frames`, `AutoMovieHumanF1Placing` and `AutoMovieHumanF1Landmarks` are shared: an edit is announced in the progress log after the joints worker's log shows the file free. Nothing is built on the neck's upper ring until the joints worker's log confirms its place.

### Wiring

What exists in new files, and the edits to shared files this note asks for in the joints worker's window. None of the requested edits is made yet.

| New file | Holds | Read by |
| --- | --- | --- |
| `src/generation/AutoMovieHumanF1FacePriors.ts` | Nine published measures, each with its source and read status | `AutoMovieHumanF1FaceCentres` |
| `src/generation/AutoMovieHumanF1FaceCentres.ts` | The eye's frame, the mouth's line, the ring's plane, the orbit's cylinder, the lips' wedge and the nose's two planes as functions of landmarks | `test_human_f1_face_centres`; `FamilyConicFace.ts --divides` |
| `test/src/features/human/frames/test_human_f1_face_centres.ts` | The six definitions on made points | - |
| `test/src/features/geometry/construction/operator/test_construction_operator_pointed_cut.ts` | The opening on a declared loop | - |

Two export lines were added to `packages/human/src/index.ts` for the two modules.

| Shared file | Requested edit |
| --- | --- |
| `AutoMovieHumanF1Placing.POINTS` | Add, in the `head` frame, each read by `FamilyConicFace.ts --landmarks` and re-based as the other points are: `stomion`, `cheilion`, `sublabiale`, `pogonion`, `cervical`, `globe`, `endocanthion`, `exocanthion`, and `alarBase` once its rule is in the tool |
| `AutoMovieHumanF1Landmarks` | One constant for each of those points with its rule in its comment, as nasion and tragion have |
| `AutoMovieHumanF1Frames` | Add under `head`: `eye` by `AutoMovieHumanF1FaceCentres.eye(globe, endocanthion, exocanthion, head X)`; `mouth` by `muzzle(stomion, cheilion, head X, head Z).frame`. The `mandible` frame waits for a hinge point read from a source |
| `AutoMovieHumanF1Placement.RIGID` | Add `eye` and `mouth` until a face rig turns them |
| `AutoMovieHumanF1Placing.POINTS`, for the mandible | Two more points on +Z: `tragusPosterior`, the posterior margin of the tragus, and `tragusCentre`. With `exocanthion` they give Beyron's hinge point, `AutoMovieHumanF1FacePriors.BEYRON_MM` ahead of `tragusPosterior` on the line from `tragusCentre` to `exocanthion`; the `mandible` frame takes the midpoint of that point and its twin as origin and the line between them as Z. The instrument has no rule for the two tragus points yet |
| The auricle's root surface | Not declared anywhere: `FamilyConicDivide.ts` holds the armscye, the hand's, the foot's and the hip's surfaces only, and the joints note gives it in words (the head's skin cut by a surface fixed in the skull's frame through the otobasia). The head's complement check needs it as one more signed measure with the wall on one side and the plate on the other, in `FamilyConicDivide.ISurface`'s shape, so that `FamilyConicHeadParts.build` reads it with the opposite sign for the wall |
| `AutoMovieHumanF1Placing.COURSES`, `DIRECTIONS` | Courses `head`, `eye`, `lips` and the new `nose` course with their `up` directions, when their families are stored |

### The one test round

The head's part of the shared round. Case f1. Cameras, each in curves, curves over clay, clay and owners beside the reference: `head` front, left, back, high and low oblique; `eyes` front, left, high oblique and one close view of the +Z eye from in front and from the side; `mouth` front, left, low oblique; `nose` front, left, low oblique, underside; `ear` left, back, high oblique; `neck` left and front for the ring. The twin's frames are opened only for the median seam and the twin joins.

| Part or connection | Form present on the reference | Number |
| --- | --- | --- |
| All | One piece, no diagnostic, no face of a foreign owner; a curve drawn for every lid margin, lip edge, the lips' line, the alar groove and the brow | Receipt |
| Lids | Two margins meeting at two canthi, the globe seen between them, a sulcus above the upper lid | Fissure 31 by 11 mm within 1.5 mm; margin 1.5 to 3 mm thick |
| Lid to cheek, medial hollow | A valley under the lower lid; a hollow beside the nose's root | Turns within 10 degrees of 21 and 39 |
| Nose | The alar wing with its groove; the supra-alar crease; a rolled nostril rim | Groove within 15 degrees of 74 |
| Lips | One bowed line with a corner at each end; cupid's bow; the philtrum; the lower lip's roll | Corners 44 mm apart within 1.5 mm; the roll within 15 degrees of 76 |
| Labiomental sulcus | A valley, deepest at the median | Within 10 degrees of 58; 4.9 mm behind the line within 1.5 mm |
| Cheeks, forehead | No facet, no level line | No ripple detector finding |
| Floor under the jaw | A level floor meeting the neck in one corner | No level fold |
| Auricle | Rim attached with a scapha inside it; the antihelix with two crura; tragus, antitragus; a smooth lobule | No tube, no cutter face in owners |
| Median seam | Nothing reads along the median plane on the forehead, the nose, the lips and the chin | - |

Findings of the round are fixed together by cause.

## State at the pause

What exists:

| Kind | Path | State |
| --- | --- | --- |
| Instrument | `test/src/reference-conics/FamilyConicFace.ts`: `--components`, `--profile`, `--cast`, `--radial`, `--wedge`, `--stills`, `--landmarks`, `--divides`, `--margins`, `--contours`, with `--outer` and `--mesh=trunk` | Compiles; every mode was run except the last patch's two additions (the level-frame margins and the corrected groove rule), which were run once |
| Part declarations | `test/src/reference-conics/FamilyConicHeadParts.ts` | Head, nose, eye, lips: course centres, domains, layout kinds, clips and an exact membership rule |
| Readings | `packages/human/.shots/face-one-shot-20261117/`: `o-*.txt` on the reference's outer skin, `g-*.txt` on the stored trunk family's loft, the stills | `o-contours.txt`, `o-divides-ruled.txt`, `o-margins.txt` are the latest |
| Human modules | `src/generation/AutoMovieHumanF1FacePriors.ts`, `...FaceCentres.ts`, `...EyeLaw.ts`, `...LipsLaw.ts`, `...NoseLaw.ts`; `src/generation/AutoMovieHumanSkinCutLoop.ts` | Compile; nothing in the figure reads them |
| Tests | `test_construction_operator_pointed_cut`, `test_human_f1_face_centres`, `test_human_skin_cut_loop`, `test_human_head_parts_complement`: run green. `test_human_f1_eye_law` as rewritten and `test_human_f1_lips_nose_law`: compile, never run | - |

Unfinished:

| Item | State |
| --- | --- |
| The eye's, the lips' and the nose's laws | Written and type-checked, their two tests never run; their f1 comparisons are in this note |
| Made cases | Not written: the half-fitted symmetric family, the relief moved along a field of normals, a groove on a section that closes in a tip |
| Templates | Decided: the body work's one record widened by four fields, written above as a request; no auricle, brow or zygoma template exists |
| Fits, the tree, the shared round | Not started; they wait for the joints batch |
| Wiring requests | Written above; none made |

First steps on resumption:

1. Run `test_human_f1_eye_law` and `test_human_f1_lips_nose_law` and fix what they find, with no fit running.
2. Write the three made cases, each red first.
3. Run the head queue's first command, the precheck of admitted sections, once the joints batch has landed and the tool reads the head's parts.

## Risks

| Risk | Design answer |
| --- | --- |
| A lateral canthus and a mouth corner are sharper than a rounded end the columns resolve | The end's radius is the fold's own where life has one (the medial canthus's lacus); elsewhere it is the rim's radius, and the opening's column count follows from it by the made case's span. The drawn `diff` through the body's merge is still to be read on its made case |
| The generated head has no reading by the instrument: the round keeps no mesh (`receipt.json` holds counts only) and a figure takes 242 s of a heavy run | Before the batch the trunk family's own loft over stations 620 to 918 is read by `--cast` and `--wedge`, a single-family loft; it gives the round's pass numbers their value before. Not done yet |
| The lips' closed surface carries a crease the family's layout may not declare | The layout is read in `AutoMovieHumanConicSection` before the fit: if no anchor may be C0, the line is two inflection lines one rim radius apart |
| A merge's loop is one C2 curve, and the nose's two planes and the lips' wedge meet the skin in loops with corners (at nasion and subnasale; at the wedge's four corners) | As for the openings: each corner is rounded, and the loop's shares are read from the rounded surface |
| The upper lid's sheet at the globe's radius plus a thickness is a prior the reference need not follow (its eyeball is 30 mm) | The globe's radius is the person's own; the thickness is read on f1 by the definition and compared with the tarsus's 1 mm and the margin's 2 mm |
| Frankfort is not measured; priors stated against it (canthal tilt, submental line) have no frame yet | Orbitale is read on the skin by one stated rule and tragion at the notch; until then no prior stated against Frankfort enters |
| Four parts' loops crowd between the eye, the nose and the lips: the medial canthal hollow lies between the orbit's loop and the nose's | Loops are cut by surfaces fixed in one frame, so their least distance is a function of the person's measures and is checked before the joins; the fold widths there are bounded by it |
| The wall beneath the parts has no skin to fit | A declared construction surface, the wall's own fields carried across, as the trunk's under the arm (joints) |
| The joints worker holds the fit tool and `AutoMovieHumanF1.ts` | New files only, until its log hands each over |

## Sources

| Source | Read |
| --- | --- |
| `AutoMovieHumanF1Trunk.ts` (declarations, tables elided), `AutoMovieHumanF1Placing.ts` lines 150 to 300, `AutoMovieHumanF1Landmarks.ts`, `IAutoMovieHumanHeadIdentity.ts`, the face, pose and expression interfaces, `IAutoMovieConstructionJoin.ts` | In full |
| `docs/techniques/joints-one-shot.md`, `centres-and-courses.md`, `head-pieces.md` | In full; `joint-logic.md` in part (construction table, neck, nose, ear, kinds) |
| Kirwan 2023, Aesthetic units and zones of adherence; Naini 2017 (mentolabial); Gao 2025 (periocular); Van der Walt 2025 (globe and orbit); Hona and Stephan 2024 (tissue depths); Woelfel 2014 (jaw); Faderani 2023; Chen 2019 (lid crease) | Full text, by a research subagent |
| Burget and Menick 1985, 1986; Farkas 1985; Migliori and Gladstone 1984; the modiolus and lateral crus studies | Abstract or snippet only |
| Gonzalez-Ulloa 1956, 1961, 1987; Farkas 1994 and its landmark table; Osipa; the FACS manual | Not obtained; the landmarks they alone define are provisional, each with its rule written under [Landmarks](#landmarks-and-where-each-definition-is-read) |
| Katina 2015, The definitions of three-dimensional landmarks on the human face | Pages 3 to 10 |
| Zhang 2012 (University of Gloucestershire, 34 curves and 21 surfaces) | Pages 112 to 124, 130 to 135, 149 to 157: a frontal mask of C0 patches with no lid, ear, mouth interior or anthropometric driver |
| Wang 2005 | In full: no facial feature |
| MPFB2 and Anny (local clones): targets, base mesh groups, default rig | In part: the skin is one closed manifold with pockets; lids pivot at the eyeball's centre |
| Inspired 3D, Birn, UMBC head tutorials; FLAME pages 3 to 6; ICT FaceKit readme | Summaries |
| ANSUR II women's head measures | Computed from the public table |
| Lid margin thickness: 1.36 +- 0.25 mm upper and 1.00 +- 0.23 lower, the keratinized surface (Zhu 2022, 56 Chinese adults, full text); 1.95 and 1.87 with the mucosa (Hykin and Bron 1992, as Zhu quotes). Whole upper lid at mid-tarsus 1.61 +- 0.21 mm, tarsus 0.91 (ultrasound, 19 adults, PMC5859591) | A second research subagent |
| Alar wall thickness: 3.45 +- 0.66 mm in women, 3.99 +- 0.69 in men, by caliper (Ozkul 2013, 100 Turkish adults) | Abstract |
| Nostril long axes 78.1 +- 11.4 degrees apart in 101 Chinese women (PMC4977267), about 39 degrees each from the midline | Full text |
| Mandible's arbitrary hinge point (Beyron): 13 mm ahead of the tragus's posterior margin on the line from the tragus's centre to the outer canthus | Quoted in two open papers (PMC11566610, PMC10502393), read |
| Levator excursion 12 to 17 mm, downgaze to upgaze (EyeWiki) | Page read; no primary study |
| Burget and Menick 1985 and 1986 | Abstracts, verbatim: "tip, dorsum, sidewalls, alar lobules, and soft triangles"; the columella is not in the 1985 abstract's list. Each half upper lip has a lateral subunit bordered by philtrum column, nostril sill, alar base and nasolabial crease, and a medial one, half the philtrum. Full texts not obtained |
| Not found anywhere | Depths of the tear trough, the nasolabial fold and the philtrum; the lid margin's radius; nostril rim thickness; the commissure's path on opening; any conic or lofted construction of a face |
