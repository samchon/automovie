# UV layout

The skin's texture coordinates serve only the tiled micro-relief of [procedural skin fields](procedural-skin-fields.md). They need to be close to an isometry in rest millimetres and continuous over large areas; they are not an atlas, regions may share coordinates, and no painted texture addresses them. `AutoMovieHumanSkinChart` computes them from the final skin pieces, after any clipping or tuck vertices the surface adds, and the material reads them as `surface-metres` in model units.

## Charts

| Chart | Members | Axis | Cut |
| --- | --- | --- | --- |
| Head | `head`, `head.*` | Vertical, through centroids of 2 mm height bins | Back of the head |
| Trunk | `upper`, `trunk` | Vertical, as the head | Spine |
| Chain | Every other chain alone | Polyline through the band centroids of `<chain>/<k>`; normals' least-scatter direction when the polyline is shorter than half the chain's radius | Behind the limb, or on top of a forward-running toe or foot chain |

Grouping the horizontally lofted families keeps the face and torso free of seams between chains. After flattening, the charts are shelf-packed tallest first into one layout from the origin with 12 mm gutters, so no two charts share coordinates: the tiled relief does not care, and the per-person mark image can address the whole skin. Chain charts meet at chain junctions (shoulder, hip, wrist, ankle, finger and toe roots, ears) with a coordinate discontinuity only; position and normal stay shared. Along a polyline, the space between bisector planes of consecutive segments belongs to one segment, with the frame interpolated across it, so stations do not collapse on the outside of a bend.

## Flattening

Each chart's surface is sampled as a radius over a polar grid: stations one mean edge length apart (1.5 to 6 mm) and sectors of about the same arc (32 to 256 per turn, a multiple of 16). Every grid edge asks for its 3D vector expressed in a local frame of the section direction and the in-surface perpendicular, and 300 sweeps of successive over-relaxation (factor 1.85) from the unrolled cylinder solve the least-squares system. A vertex takes the bilinear grid coordinates at its angle and station plus its radial offset from the sampled sheet, resolved in the nearest frame; vertices off the sheet (eyelid tucks, rings perpendicular to the axis) are spread instead of collapsed. The grid continues a sixteenth of a turn past the cut, and triangles crossing the cut take duplicated vertices evaluated there.

Measured on f1 (triangle Jacobian singular values): median anisotropy 1.13 to 1.27 on limbs and trunk and 1.3 to 1.6 on the head; 99th percentile below 2 on the legs. The head's median scale is about 0.85 because a closed near-sphere cannot be flattened isometrically and least squares spreads that area error. Distortion remains at poles (crown, fingertips, toe tips) and at flat event-ring annuli such as the wrist, which concern a few hundred triangles. The chart takes about 2 s for the whole body on the development machine.

## Conventions and limits

The cut placement, grid resolution, sweep count and chart grouping are conventions. Because a tiled isotropic pattern is the only consumer, mild scale change and seams at chain junctions are acceptable; a painted atlas would need a published, versioned layout, with UV cuts duplicating render vertices but not physical points ([LSCM](../sources/levy-2002-lscm.md), [Ptex](../sources/ptex.md) and [OpenSubdiv face-varying boundaries](../sources/opensubdiv-documentation.md) record the alternatives).

## Semantic hand charts (not implemented)

A hand chart can separate logical texture coordinates from physical sweep addresses. A shared block correspondence must preserve relief and landmark meaning while preventing identity-dependent dimensions from moving the chart. Webs and caps use two-dimensional patch domains; flattening them into a single station would collapse texture area.

Equal logical bands, rectangular web/cap domains and the palmar texture cut are chart conventions, not anatomical measurements. Additional cuts create render aliases without changing the physical skin. Changing an existing layout requires an explicit compatibility decision.

Hand chart invariance does not establish invariance for every other part. Filtering across separate web/cap rectangles, mip behavior and physical stretch remain material-appearance limits.
