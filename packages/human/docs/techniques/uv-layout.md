# UV layout

The skin's texture coordinates serve the tiled micro-relief of [procedural skin fields](procedural-skin-fields.md) and the per-person mark image. They need to be close to an isometry in rest millimetres and continuous over large areas; no painted texture addresses them. `AutoMovieHumanSkinChart` computes them from the final skin pieces, after any clipping or tuck vertices the surface adds, and the material reads them as `surface-metres` in model units.

## Charts

| Chart | Members | Axis | Cut |
| --- | --- | --- | --- |
| Head | `head`, `head.*` | Vertical, through centroids of 2 mm height bins | Back of the head |
| Trunk | `upper`, `trunk` | Vertical, as the head | Spine |
| Chain | Every other chain alone | Polyline through the band centroids of `<chain>/<k>`; normals' least-scatter direction when the polyline is shorter than half the chain's radius | Behind the limb, or on top of a forward-running toe or foot chain |

Grouping the horizontally lofted families keeps the face and torso free of seams between chains. After flattening, the charts are shelf-packed tallest first into one layout from the origin with 12 mm gutters, so no two charts share coordinates and the mark image can address the whole skin. Chain charts meet at chain junctions (shoulder, hip, wrist, ankle, finger and toe roots, ears) with a coordinate discontinuity only; position and normal stay shared. Along a polyline, the space between bisector planes of consecutive segments belongs to one segment, with the frame interpolated across it, so stations do not collapse on the outside of a bend.

## Flattening

Each chart's surface is sampled as a radius over a polar grid: stations one mean edge length apart (1.5 to 6 mm) and sectors of about the same arc (32 to 256 per turn, a multiple of 16). Every grid edge asks for its 3D vector expressed in a local frame of the section direction and the in-surface perpendicular, and 300 sweeps of successive over-relaxation (factor 1.85) from the unrolled cylinder solve the least-squares system. A vertex takes the bilinear grid coordinates at its angle and station plus its radial offset from the sampled sheet, resolved in the nearest frame; vertices off the sheet (eyelid tucks, rings perpendicular to the axis) are spread instead of collapsed. The grid continues a sixteenth of a turn past the cut, and triangles crossing the cut take duplicated vertices evaluated there.

A closed near-sphere such as the head cannot be flattened isometrically, and least squares spreads that area error. Distortion remains at poles (crown, fingertips, toe tips) and at flat event-ring annuli such as the wrist.

## Conventions and limits

The cut placement, grid resolution, sweep count and chart grouping are conventions. Because a tiled isotropic pattern is the main consumer, mild scale change and seams at chain junctions are acceptable. A painted atlas would need a published, versioned layout, with UV cuts duplicating render vertices but not physical points ([LSCM](../sources/levy-2002-lscm.md), [Ptex](../sources/ptex.md) and [OpenSubdiv face-varying boundaries](../sources/opensubdiv-documentation.md) record the alternatives).
