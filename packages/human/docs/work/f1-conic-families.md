# f1 from authored conic families

The record of campaign 1's reconstruction of f1 in its reference pose: what the construction is, what each round measured, and what is still open. The authored numbers live in `src/generation/f1`; the model that reads them lives in `src/generation/conic`.

## Construction

A part is a tape wall with reliefs.

- **Course.** A jointed axis through the part's joint centres. Stations are arclength from the first centre, and every section lies in the plane normal to the course.
- **Wall.** At each station the section is a closed chain of conics through four extremes, the points where the section runs parallel to its chart axes, with one shoulder per arc. A quarter may be halved at its median point: the point at a share `f` of the way from the chord midpoint to the meeting of the two end tangents, with its tangent parallel to the chord. Every conic has such a point, so a split with the values of rational subdivision changes nothing, and other values add freedom without ever leaving the admissible set.
- **Along the station.** Every section number is a natural cubic through its values at a few knots shared by all of the part's numbers.
- **Reliefs.** The wall is fitted to the convex hull of each reference section, the path of a taut tape. Skin that lies inside the hull, such as a crease, a groove or the face, is a height over a window of the wall's chart along a fixed axis.

The runtime resolves each station's numbers into the engine's guides and conic pieces and lofts them through the engine's view loft.

## What the rounds taught

- **Fit all sections at once.** Reading each section alone and interpolating the readings kept 28 of 30 forearm sections as knots and left a ring across the thigh where the readings jumped. One least-squares problem over every section, on shared sparse knots, gave the forearm shaft from 52 numbers within 0.45 mm.
- **Read the cut vertices, not the chords.** The reference is faceted. A chord between two cut vertices lies inside the intended surface by the facet's sagitta, 0.6 mm on the thigh.
- **Free split points do not converge.** A contact that may slide along the curve, with a free tangent, is nearly undetermined and settles on the edge of admissibility. The median anchor has neither freedom.
- **Fixed groove layouts degenerate.** A crest, an inflection and a groove bottom cannot stay one layout along the trunk: the spine groove is 10 to 13 mm deep above the waist and vanishes at the waist. The hull with a relief has no such station.
- **A cast along the relief axis is blind where the axis runs along the wall.** Such phases are left to the net's fairness, and a window that needs them needs another axis.
- **One family per continuous form.** Three trunk walls stacked on one axis met at visible seams; one family from the crotch to the armpit has none and fits better.
- **A guide on its box corner has no arc.** Where one cut vertex is both the forward and a side extreme, the touch offset reaches the corner and the engine refuses the station; this ended the arm, the leg and the palm short. The model now holds each guide within 92 % of the way to the corners its neighbours set.
- **A later relief is fitted over the earlier ones.** Side reliefs over the upper family's front and back ones lowered its mean from 0.97 to 0.75 mm but left ragged patches at the shoulders, so they are not kept.
- **Rows where a branch merges into the section do not belong to the wall.** Fitted, the rows where the arms join the shoulders threw fins sideways.

## Measured

Distance from the reference skin's cut vertices to the regenerated section, through the engine; half of the sections withheld from each fit.

| Part | Numbers (wall + relief) | Mean, mm | Max, mm |
| --- | --- | --- | --- |
| Arm | 221 + 64 | 0.12 | 1.0 |
| Leg | 588 + hollow reliefs | 0.13 | 0.9 to 800 mm, 3.1 at the ankle rows |
| Midfoot | 189 + 178 | 0.12 | 0.89 |
| Palm | 126 + hollow reliefs | 0.15 | 4.4 |
| Finger shafts | 65 to 117 | 0.05 to 0.11 | 0.37 to 0.83 |
| Toe shafts | 39 to 65 | 0.03 to 0.13 | 0.15 to 0.64 |
| Torso | 273 + 1,870 | 0.29 | 6.2 |
| Shoulders, neck and head, one family | 567 + 5,040 | 0.97 | 60 |

## Open

- The parts are separate open tubes. The armpit, the crotch and the ankles are open bands; heels, digit tips and the crown are not built. The chain sections the families use are C1, are refused by the engine's continuation and have no pole.
- The 0.5 mm target holds only on finger and some toe shafts.
- The head's ears, nose and mouth are an envelope: a radial relief cannot follow an undercut.
- A layout of sixteen conics fitted worse than eight from an exact start, unexplained.
- The two smallest toes' fitted run is 5 to 6 mm long.
