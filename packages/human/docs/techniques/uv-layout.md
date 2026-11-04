# UV layout

The skin's texture coordinates serve the tiled micro-relief of [procedural skin fields](procedural-skin-fields.md) and the per-person mark image. They need to be close to an isometry in rest millimetres and continuous over large areas; no painted texture addresses them. `AutoMovieHumanSkinChart` reads them from the lofting surfaces' own parameters, each vertex at its loft coordinates, and the material reads them as `surface-metres` in model units.

## Charts

| Chart | Members | Reference (front) | Cut |
| --- | --- | --- | --- |
| Head | `head`, `head.*`, lowest first | `+X` | Back of the head |
| Trunk | `upper`, `trunk`, lowest first | `+X` | Spine |
| Chain | Every other chain alone | `+X` square to the chain's axis, or `+Y` for an axis that runs forward (feet and toes) | Opposite the reference |

Grouping the horizontally lofted families keeps the face and torso free of seams between chains: each chain's meridian lengths start from those the chain below carries at the shared ring, read at the same arc length from the front. The charts are shelf-packed tallest first into one layout from the origin with 12 mm gutters, so no two charts share coordinates and the mark image can address the whole skin. Chain charts meet at chain junctions (shoulder, hip, wrist, ankle, finger and toe roots, ears) with a coordinate discontinuity only; position and normal stay shared.

## Coordinates on a chain

`AutoMovieHumanSkinChartGrid` lays a grid over a chain's stations and phases, a node every 2 mm of skin each way. At a node, `u` is the signed arc length round its section from the section's front point (the point farthest along the reference, placed between samples by the parabola through the peak), and `v` the meridian length along the fixed phase from the chain's first station. Along a section `u` is exact arc length and along a phase `v` is exact meridian length, so the chart is an isometry to first order where the phases cross the sections square. A vertex takes the bilinear blend of its cell's nodes at its loft coordinates, `u` unwrapped across the cut; a pole's apex takes its row's front. A vertex whose owner publishes no loft coordinates, or whose owner belongs to another chart, is located on its piece's own chain: the nearest of every fourth grid node, then Gauss-Newton on the distance to the chain's surface. Triangles spanning more than half a turn take copies of their vertices on the negative side, one perimeter on.

## Conventions and limits

The grid spacing, the reference directions and the chart grouping are conventions. Where the phases cross the sections obliquely the chart shears by the cosine of that angle, and near a pole (crown, fingertips, toe tips) the sections' arcs shrink to a point. Because a tiled isotropic pattern is the main consumer, mild shear and seams at chain junctions are acceptable. A painted atlas would need a published, versioned layout, with UV cuts duplicating render vertices but not physical points ([LSCM](../sources/levy-2002-lscm.md) and [Ptex](../sources/ptex.md) record the alternatives).
