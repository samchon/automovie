# Subtractive pieces

A recess is built the way a protrusion is: as its own piece in its own frame, about its own centre and axis, and merged into a base envelope that was built as if the recess did not exist. The merge removes volume and nothing else, so the recess never reads the base's lofting curves and the base never moves the recess. Both merges are radial operations on a lofted section, so the structured grids (rings, phases, layer counts, apertures) stay as they are; no implicit surface is meshed.

## 1. The operator

`AutoMovieHumanSeamCarve` (`packages/human/src/lofting/AutoMovieHumanSeamCarve.ts`) is the mirror of the additive `AutoMovieHumanSeamUnion`. Along one ray of a section, from the section's centre:

| Form | Piece gives | Merge | Bound |
| --- | --- | --- | --- |
| dent | a depth `d <= 0` under the base, zero with its slope and curvature at the edge of its own C2 window | `dent(base, d) = base + d` | never over the base |
| floor | the radial distance `f` of the recess's own floor surface, `+Infinity` where the ray misses the recess | `floor(base, f, w) = min(base, f) - w k^3 / 6`, `k = max(0, w - abs(base - f)) / w` | at most `min(base, f)`, at least that less `w / 6` |

The cubic smooth minimum is C2 in both distances: its correction and the correction's first and second derivatives vanish where the two differ by `w`. The blend width is the recess's own size, `w = min(depth, half extent) / 2` (`AutoMovieHumanSeamUnion.width`): the fillet stays within the half of the recess next to the base, so the recess keeps its own shape over at least half its depth and extent, and every recess rounds its rim at its own scale.

## 2. Where it works on the lofted representation

A carve works where the carved surface stays single-valued along the rays of the section it is carved into: every ray from the section's centre meets the skin once before and once after the carve. That holds for a dish or a groove whose walls are steeper than the ray only where they are shallower than its depth: eye socket hollows, the temple hollow, the philtrum, the nasolabial and mentolabial sulci, the concha floor in the ear's own chart, the navel's dish, the spinal groove, the sternal notch, the popliteal fossa.

A recess that opens the skin changes the surface's topology, and no radial operation can make a hole. Those are apertures of the lofted chain (`IAutoMovieHumanLoftAperture`): the lid opening, the nostrils, the oral fissure (a seam aperture closed on the contact line at rest), the ear canal. Their interiors (globe, nasal vestibule, oral cavity, canal) are separate meshes behind the aperture.

A recess whose rim overhangs along the section's rays (a deep umbilicus, the gluteal fold under the buttock seen on horizontal trunk rays) is carved in the frame where its floor is single-valued: the gluteal fold along rays normal to the thigh's axis, under the buttock merged as an additive body; a deep navel as a dish carve plus an aperture-free inner wall chain if it ever needs one.

## 3. Continuity at the carve border

- Dent: the window's C2 edge is the border; outside it the depth is zero, so the carved skin is the base with its position, tangent and curvature.
- Floor: the floor stands proud of the base at its own border by at least `w`; there the smooth minimum's correction is zero with its two derivatives, so the skin is the base, G2 at the border (the declared minimum is G1).

The same holds in the height direction when the recess's window or floor is C2 along the chain's stations, because the operator acts on each station's radial distance pointwise and is C2 in its arguments.

## 4. Order of operations

1. Base envelope (face without nose and ears, the cranium, the neck tube, a limb tube).
2. Additive pieces, each in its own frame, by `AutoMovieHumanSeamUnion.bump` or `.body`.
3. Subtractive pieces, each in its own frame, by `AutoMovieHumanSeamCarve.dent` or `.floor`, after the attach, so a recess cut beside a protrusion (the alar crease beside the ala, the mentolabial sulcus over the chin pad) carves the merged skin and is never refilled by it.
4. Apertures, cut by the chain's aperture trim after the radial surface exists.

Within one step the order does not matter: a bump sum and a dent sum commute, and two floors carved by the smooth minimum differ from either order only inside the overlap of their blends.

## 5. Verdicts

| Region | Recess | Verdict | Frame |
| --- | --- | --- | --- |
| Head | eye socket hollow | dent | globe centre, orbital axis |
| Head | lid opening | aperture | lid margin |
| Head | temple hollow | dent on the temple sector | frontotemporale to the zygomatic arch |
| Head | philtrum groove | dent | subnasale to labrale superius |
| Head | nasolabial fold | dent | alar crease to cheilion |
| Head | alar crease | the join of the nose body and the cheek (union fillet) plus a dent along the crease | ala centre |
| Head | mentolabial sulcus | dent | sublabiale |
| Head | nostril | aperture | nostril centre |
| Head | oral fissure, cavity | seam aperture, cavity mesh | stomion |
| Head | concha floor | dent in the ear's own chart | meatus |
| Head | ear canal | aperture of the ear chain | meatus |
| Trunk | navel | dent (dish), quintic depth profile level at its rim | omphalion, abdominal wall normal |
| Trunk | spinal groove | the valley between the reflected pair of erector spinae bodies (additive), so its depth follows the muscle; a lean back's shallow groove is a dent along the spinous line | spine line, back normal |
| Trunk | sternal notch | dent on the same (height, phase) window in both chains it crosses, the neck's bottom ring and the shoulders' top, so value and derivatives agree at the seam | suprasternale, forward normal |
| Trunk | armpit | junction of the arm root (its own chain, a G1 Coons patch over the base's open arc), the shoulder and the trunk; a deeper hollow is a dent window on that patch | axilla vault, between the fold points |
| Trunk | inframammary fold | the lower border of the additive breast body against the chest wall, not a carve | breast centre |
| Trunk | deltopectoral and deltoid grooves | borders between additive muscle bodies over the arm tube, not carves | deltoid insertion |
| Trunk | gluteal cleft | floor carve on the midline from the sacral tip to the crotch ring, reflected about the median plane | median plane, backward normal |
| Leg | popliteal fossa | dent | knee joint centre, posterior |
| Leg | gluteal fold | buttock as an additive body over the thigh, fold as a dent on the thigh's rays | gluteal sulcus |
| Leg | inguinal crease | dent | inguinal ligament line |

## 6. The test that proves it

For every carved piece, on every ray of every station inside its window: the carved radial distance is at most the base's and at most the floor's (never outside the base nor outside the piece's envelope), and on the window's border its difference from the base, and the difference's first and second differences across the border, are zero within the float resolution of the section. Made red by a dent given a positive depth, or a floor left proud by less than `w` at its border; green on a dish of known depth, whose carved depth reads that depth less at most `w / 6`. The additive mirror reads the merged distance at least the base's and the piece's.
