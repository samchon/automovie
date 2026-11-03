# Leg

Values the leg's pieces stand on. Each holds only for its population and protocol; the references are the four bodies f1, f2, m1 and m2 (private meshes), read generator-free by horizontal plane cuts (the legs stand within 3.7 degrees of vertical).

## Joint centres and stance

| Quantity | Value | Source and grade |
| --- | --- | --- |
| Hip centre height | 0.518 S | ANSUR II trochanterion height plus de Leva's offset, sexes averaged ([skeleton](skeleton.md)); derived |
| Knee centre height | 0.2865 S | ANSUR II tibiale height plus de Leva's offset; derived |
| Ankle centre height | the lateral malleolus height (`ankleHeight`) | the input's own definition |
| Hip centre, lateral | `Y = 8 + 0.086 LL` mm outside the midline | Hara 2016 ([hara-2016](../sources/hara-2016.md)); `LL` is read as the vertical distance from the iliac spines (hip height plus `9 + 0.078 LL`) to the medial malleolus (1.1 times the lateral malleolus height, the foot prior's convention); the lateral and forward offsets between the two points change `LL` by 0.15 %. f1: 83.7 mm; the former rig stood the hip at 94.1 mm |
| Ankle centre, lateral | 136.6 mm | median of the references' left ankle section centroids at the malleolus height: 136.35, 136.77, 137.66, 136.00 mm (each within 1.1 mm of the median of the others); a bind-posture convention, not a proportion (it follows neither stature nor hip breadth in the four) |
| Knee centre, lateral | on the straight hip-to-ankle line | the mechanical axis; hip-knee-ankle angle 0 to 1.5 degrees varus in healthy adults (Radiopaedia, hip-knee-ankle angle; Moreland 1987 as cited there, not yet read). The references' knee section centroids stand -3.3, -3.6, +3.3 and +8.0 mm from the line (f1, f2, m1, m2); on f1's bone-normal sections 0.2 mm |
| Hip-to-ankle abduction | 3.72, 3.73, 3.08, 3.06 degrees (f1, f2, m1, m2) | measured with the above; the women's and men's differ by 0.65 degrees through the hip, the ankle being constant |
| Knee ahead of the hip-ankle chord | 4 mm | carried from the former fitted line (flagged: the sagittal alignment is unmeasured) |

## Crotch height

ISO 8559-1 5.7.6 defines the inside leg length as the vertical distance from the crotch to the outer ankle point, so the crotch stands at the inseam plus the lateral malleolus height. The former fitted line read 6.7 and 6.2 mm under it on f1 and f2, 4.3 mm over on m1 and 8.9 mm under on m2. The references' lowest midline skin stands 8.9, 6.6, -2.0 and 11.2 mm under it; ANSUR II allows 10 mm for crotch height, so the reference differences are the inputs' (the native courses), not the construction's.

## Mid-patella and tapes

Mid-patella stands 36 mm under the knee centre on the references (38, 34, 36, 36 mm; ANSUR II: 16.9 mm women and 3.3 mm men under the lateral epicondyle, 11.2 and 20.2 mm above tibiale). The calf's maximum stands at 0.335 to 0.345 of the shank below the knee, the thigh's at the top row under the crotch. The thigh, knee and calf inputs are the source's native courses (horizontal loops at fixed heights), which fall short of a taut tape round their own loops; the pieces solve the tapes on the emitted hull at the sites above.

## Landmark rows

`rows.json` of the leg modeler's scratch holds, at 15 landmark stations (thigh 0.25 to 1 from the hip centre, shank 0.07 to 0.9 from the knee centre), the eight guides' `(rho, rho', rho'')` at 0, 45, ..., 315 degrees, the eight sectors' fullness and the girth shares, as medians over the four references, with the largest held-out deviation of rho beside each (0.03 to 0.09 of the section's girth over 2 pi, which is how much people differ at a landmark). The values are in the table pieces under `src/generation/leg/` (`AutoMovieHumanLegGuide*`, `AutoMovieHumanLegThigh*`, `AutoMovieHumanLegShank*`, `AutoMovieHumanLegGirth`). The medians of the sectors' fullness are at most 0.017 in magnitude: the quintic Hermite arc of the two guides' jets already carries the sector's shape at its middle. The arc's residual away from its middle was not measured.

## Counts against the reference

The reference leg pack holds 72 horizontal curves per leg at a 10 mm step, about 57 Hermite spans per curve (f1 `leg_l`: 72 curves, 4,134 spans, at most 256). The leg chain holds 31 to 33 layers of 256 control points before this division: fewer layers than the reference. The division raises the section to 264 control points (eight sectors of 33 knot spans) and the layer density to at least 72 per leg (`AutoMovieHumanLegStations.layers` at a coarsest spacing of 9.5 mm); the chain is built from them by the section law below.

## Section law and the two rings

The leg's section at a station is the tube: the eight guides' jets and the eight compartment sectors read along the walk, plus the reliefs, scaled on its own taut hull to the girth law (`AutoMovieHumanLegSectionLaw`). The foot's ankle ring and the trunk's crotch loop are rows of the same tables at their own stations. Each guide's jet is read off the ring by the same twelve-degree quadratic as the landmark rows, each sector's fullness at the arc's middle, and each ring's taut girth becomes a knot of the girth law. So the leg leaves each ring with the ring's own shape and girth, and the natural splines carry them to the first landmark rows.

A table row on or past a ring is dropped. So is a row nearer to the ring than half its pitch to its other neighbour: one C2 curve cannot meet both without a wave between them, and the ring, the neighbour's own surface, binds. On f1 the ankle ring stands about 9 mm under the shank's 0.9 row, which drops, so the ring meets the 0.8 row about 50 mm higher. The crotch ring stands about 33 mm over the thigh's 0.25 row, which stays.

The chart origin of every section is its centroid, because the rows were read about the references' centroids. It is a natural spline through three places no fit chooses: the ankle ring's centroid, the knee centre (the midpoint of the femoral condyles, the centre of the knee section) and the crotch arc's centroid.

Reliefs join the base by the shared operators along each knot's own ray. A window whose axis points out of the leg adds volume only. One whose axis points into the leg is a declared recess: the infragluteal fold, the inguinal crease, the popliteal fossa and the trochanteric depression. The infragluteal fold's window spans 171 to 229 degrees round the thigh, from posterior to posteromedial, so the fold is deepest medially and absent on the lateral third, as on the references.
