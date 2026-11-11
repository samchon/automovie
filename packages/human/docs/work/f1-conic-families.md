# f1 from authored conic families

The record of campaign 1's reconstruction of f1 in its reference pose: what the construction is, what each round measured, and what is still open. The authored numbers live in `src/generation/f1`; the model that reads them lives in `src/generation/conic`.

## Construction

A part is a tape wall, with reliefs where the wall cannot follow the skin.

- **Course.** A jointed axis through the part's joint centres, which every family names from one datum module. Stations are arclength from the first centre, and every section lies in the plane normal to the course. Round a joint the sections fan: the leg turns at the ankle and runs on to the foot, so the heel is lofted.
- **Wall.** At each station the section is a closed chain of conics through four extremes, the points where the section runs parallel to its chart axes, with one shoulder per arc. A quarter may be halved at its median point: the point at a share `f` of the way from the chord midpoint to the meeting of the two end tangents, with its tangent parallel to the chord.
- **Along the station.** Every section number is a natural cubic through its values at a few knots shared by all of the part's numbers.
- **Reliefs.** The wall is fitted to the convex hull of each reference section, the path of a taut tape. Skin that lies inside the hull is a height over a window of the wall's chart along a fixed axis.
- **Closed ends.** A family may close in a point. From the station its cap starts at, the section shrinks by one conic factor that leaves the wall at the wall's own taper and stands upright at the tip.

The parts are sewn by the engine's construction operators.

| Seam | Operator | What it needs |
| --- | --- | --- |
| Trunk to both legs | `split` of the trunk's open lower end | A seam chord from front to back |
| Trunk to each arm and each ear | `port` on the trunk's chart | An ellipse round the part's root, derived from datums |
| Limb to each finger and toe | `join` (merge) | The digit as a capsule whose inner end lies inside the limb |
| Wrist, ankle, neck | none | One family runs through |

## What the rounds taught

- **Fit all sections at once.** One least-squares problem over every section, on shared sparse knots, replaces per-section readings that jumped.
- **Read the cut vertices, not the chords.** The reference is faceted; a chord lies inside the intended surface by the facet's sagitta.
- **A merge needs a crossing, a port needs none.** Where two parts continue each other's skin they touch along the seam, and a traced intersection there is ill-conditioned. A port or a split spans a band between a curve on one and a ring of the other instead. A merge suits a part that comes out through another's surface.
- **A part that leaves by a branch is taken out of its parent's sections.** The trunk's sections leave out the arm past the armscye plane and the ears, and the hand's leave out the free thumb. With the arms left in, the wall threw fins; with the ears in, it bulged and stepped; with the thumb in, the hand's wall and the thumb's lay within half a millimetre of each other for 10 mm and no merge traced their meeting. A table of one part's signed distance to the other's skin, by station and phase, shows this before any operator is tried.
- **A merged part must be closed where it is buried.** An open tube carried back into the hand met its cap in an open curve. Closed in a point inside the hand, it meets the cap in a closed curve wherever it comes out.
- **A relief does not reach round the wall.** Past about 1.2 rad from its axis a height slides a point along the wall. Such a window folded the skin at the side of the head and refused the ear's port.
- **A relief that cannot reach its hollow leaves scratches.** A window placed by the hollow search is kept only when it takes away half of its deepest hollow on the withheld sections. The leg keeps none.
- **Knots stand as close as the section moves.** Round the ankle the heel sweeps 2.7 times faster than the station, and 12 mm between knots stalled the whole leg; 6 mm there fits it. From the neck up, 4 mm let the wall follow every step of the face's hull and streaked it.
- **Growth must restart from the best family.** Going on from a round that did not improve carried a failed solve into every later one.
- **The engine reads between stations by its own spline.** Where the model's section turns fast, the engine's chain can lose an arc between two stations that the model never loses, so the part adds stations where the model stands off the mean of its neighbours.
- **A pole takes every coordinate together.** The engine closed only a four-quarter section; a chain's touch offsets and split points now fall in the same pole parameter as its extents, and a relief must vanish at the pole.
- **The reference's own loft curves, reduced curve by curve, are not smaller.** The toes of one foot are 233 closed section curves of 4,476 cubic spans in the reference. Reduced by the Recovery package's Ghosh reducer at 0.5 mm they are 6,849 conic arcs, 88 curves only partly, and the study's loft drops 85 of 218 strips (`FamilyConicReference.ts`). Cut along each toe's own course and fitted together, the same five toes are 245 numbers, closed and sewn. A reducer that keeps every section keeps the reference's slicing; the reduction is in choosing the course and fitting all sections at once.
- **Profile before blaming an operator.** The body's realization took 193 s after the digits were merged. The joins were 4.8 % of it; 83 % was the face tessellation rereading the whole mesh for every face.

## Measured

Distance from the reference skin's cut vertices to the regenerated section, through the engine; half of the sections withheld from each fit.

| Part | Conic numbers | Relief heights | Mean, mm | Max, mm |
| --- | --- | --- | --- | --- |
| Trunk, crotch to crown | 1,113 | 7,474 | 0.52 | 61 at the nose |
| Arm, armpit to finger webs, without the free thumb | 273 | 340 | 0.31 | 4.2 |
| Leg, crotch to toe webs | 735 | 0 | 0.23 | 6.1 |
| Ear, against its hull | 105 | 0 | 0.08 | 0.36 |
| Fingers | 65 to 147 each | 0 | 0.05 to 0.11 | 0.33 to 0.74 |
| Toes | 39 to 65 each | 0 | 0.03 to 0.18 | 0.15 to 1.3 |

The nose's free end is a family of its own, 63 numbers at 0.1 mm against its hull, attached at a port on the face. The trunk wall kept was fitted with the nose still in its sections; the port cuts that part out. A wall fitted without the nose is 588 numbers at 1.08 mm. It was set aside on a render that showed creases across the chest, but those creases came from the relief windows of that round, not from the wall, so it has not been judged fairly yet.

A trunk wall of 672 numbers at 0.56 mm exists as well, fitted with knots 4 mm apart from the neck up; it streaks the face, so the wall with knots 8 mm apart is kept at 441 numbers more.

The whole figure is one piece, generated with no engine diagnostic in 43 to 54 s on a machine other work kept at about 80 % load. It took 193 s before five engine repairs found by CPU profile: an incidence ledger per mesh, one structure check per source, one check per cap source, an exact sign for grid-aligned orientations, and a bridge search that keys only the pairs it keeps. What remains is spread over the constraint splitting, the face and incidence keys and the grid.

## Open

- The thumb's blend is 0.5 mm wide and leaves a small notch at its root; at 1 mm it folds in the web beside the index finger.
- The face's eyes and mouth are reliefs; the ear is its outer form without the concha.
- The trunk keeps a stump of each arm, and the tape bridges from the breast to it. A relief window that ends inside that bridge, at 1.0 or 1.2 rad, creases the chest and the back from the neck to the armpit; reaching 1.45 rad it leaves a thin flap in the fold beside each armpit, which is the state kept. A step also runs across the back where the stump begins. A trunk cut at the armpit's sagittal plane, with the arm owning the shoulder's cap (`FamilyConicBody.ts --sagittal`), was fitted and judged on every frame: the trunk is 630 numbers at 0.56 mm and the arm 756 at 0.13 mm, and the step across the back is gone, but the port's band over the front of the shoulder folds into ridges and slits, the loop is admitted only within 4 mm of the section, the flap beside the armpit stays, and the index finger's merge fails on the refitted hand. It is not adopted. A second pass changed everything that first pass left at once: chest windows stopped at 1.0 rad, the arm's rail at 25 mm, and the arm spliced at 330 mm from the sagittal fit's shoulder end and the earlier fit's hand end (`--splice`), so the fingers merge on the hand they were sewn on. On every frame the flap beside the armpit and the creases are then gone and the chest and back are clean, with one small slit behind one shoulder. It is still not adopted because the thumb's merge finds no meeting on the spliced arm, whose hollow reliefs came out differently by the keep rule; the three attempts on the index finger before the splice changed nothing either. The sagittal trunk and arm fits are kept in the test output for the next attempt, which needs the thumb's seed and the hand's relief settled together with them.
- The band from the trunk to each arm meets the arm with a faint ring.
- A hand read as the curve round all fingers on a course square to the knuckles fits to 588 numbers at 0.34 mm but is not adopted: the engine refuses it as a face at ten stations between 569 and 584 mm.
- The 0.5 mm target holds on the limbs' means and the digits, not on the trunk's maximum.
