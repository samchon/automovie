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
- **A part that leaves by a branch is taken out of its parent's sections.** The trunk's sections leave out the arm past the armscye plane and the ears. With the arms left in, the wall threw fins; with the ears in, it bulged and stepped.
- **A merged part must be closed where it is buried.** An open tube carried back into the hand met its cap in an open curve. Closed in a point inside the hand, it meets the cap in a closed curve wherever it comes out.
- **A relief does not reach round the wall.** Past about 1.2 rad from its axis a height slides a point along the wall. Such a window folded the skin at the side of the head and refused the ear's port.
- **A relief that cannot reach its hollow leaves scratches.** A window placed by the hollow search is kept only when it takes away half of its deepest hollow on the withheld sections. The leg keeps none.
- **Knots stand as close as the section moves.** Round the ankle the heel sweeps 2.7 times faster than the station, and 12 mm between knots stalled the whole leg; 6 mm there fits it. From the neck up, 4 mm let the wall follow every step of the face's hull and streaked it.
- **Growth must restart from the best family.** Going on from a round that did not improve carried a failed solve into every later one.
- **The engine reads between stations by its own spline.** Where the model's section turns fast, the engine's chain can lose an arc between two stations that the model never loses, so the part adds stations where the model stands off the mean of its neighbours.
- **A pole takes every coordinate together.** The engine closed only a four-quarter section; a chain's touch offsets and split points now fall in the same pole parameter as its extents, and a relief must vanish at the pole.
- **Profile before blaming an operator.** The body's realization took 193 s after the digits were merged. The joins were 4.8 % of it; 83 % was the face tessellation rereading the whole mesh for every face.

## Measured

Distance from the reference skin's cut vertices to the regenerated section, through the engine; half of the sections withheld from each fit.

| Part | Conic numbers | Relief heights | Mean, mm | Max, mm |
| --- | --- | --- | --- | --- |
| Trunk, crotch to crown | 1,113 | 7,474 | 0.52 | 61 at the nose |
| Arm, armpit to finger webs | 546 | 340 | 0.11 | 6.3 |
| Leg, crotch to toe webs | 735 | 0 | 0.23 | 6.1 |
| Ear, against its hull | 105 | 0 | 0.08 | 0.36 |
| Fingers | 65 to 147 each | 0 | 0.05 to 0.11 | 0.33 to 0.74 |
| Toes | 39 to 65 each | 0 | 0.03 to 0.18 | 0.15 to 1.3 |

A trunk wall of 672 numbers at 0.56 mm exists as well, fitted with knots 4 mm apart from the neck up; it streaks the face, so the wall with knots 8 mm apart is kept at 441 numbers more.

The body is generated with no engine diagnostic as 345,000 triangles, in 49 to 50 s on the machine when idle and up to 90 s while other work loaded it. A CPU profile of that run puts 64 % in the constrained triangulation of the trimmed faces and 22 % in the port bands.

## Open

- The thumbs pass through the hands unsewn: their merge finds no closed meeting.
- The face's nose, eyes and mouth are reliefs; the ear is its outer form without the concha.
- A thin flap stands in front of each armpit, where the trunk's relief cuts the fold beside the stump of arm it keeps.
- A hand read as the curve round all fingers on a course square to the knuckles fits to 588 numbers at 0.34 mm but is not adopted: the engine refuses it as a face at ten stations between 569 and 584 mm.
- The 0.5 mm target holds on the limbs' means and the digits, not on the trunk's maximum.
