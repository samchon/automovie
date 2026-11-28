# src/geometry/IAutoMoviePlanarRegionExtrusion.ts#IAutoMoviePlanarRegionExtrusion

## @evidence contracts/development/common.md#meaningful-documentation

A planar region and thickness for a symmetric local-Z extrusion, including through-holes.

## @evidence contracts/development/design.md#principled-representation

The extruder triangulates the same planar region on both sides of local Z zero and joins every ring into side walls.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Thickness extends the shared authored region. The generated caps, wall vertices and texture coordinates remain in the output mesh.

# src/geometry/IAutoMoviePlanarRegionExtrusion.ts#IAutoMoviePlanarRegionExtrusion.depth

## @evidence contracts/development/common.md#meaningful-documentation

Positive finite depth in metres along local Z. The caps are placed at the negative and positive half-depth. Supply a half-depth that remains nonzero when represented.
