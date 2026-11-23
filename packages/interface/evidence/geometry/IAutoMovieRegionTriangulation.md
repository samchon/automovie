# src/geometry/IAutoMovieRegionTriangulation.ts#IAutoMovieRegionTriangulation

## @evidence contracts/development/design.md#principled-representation `canonicalRegion` validates the rings with `autoMoviePlanarRegionFailure` and rewinds them by signed area, then `trianglesOf` bridges each hole and ear-clips the single ring, refusing when no valid ear exists, so the triangles cover exactly the enclosed area with no added vertex.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Points, their source indices, ring spans, triangles and area in one record, because the oral assembly and skin annulus carry attribute data through `sourceIndices` while extrusion and loft read the spans, and none of them recomputes the layout.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Invalid rings are refused with their own diagnostic rather than repaired, and winding is normalized by reversal only, which changes order but never identity, so `sourceIndices` stays a permutation.

## @evidence contracts/development/common.md#meaningful-documentation

States the producer, the canonical winding and ring order, ownership of every array, the permutation meaning of `sourceIndices`, the triangle orientation and index target, and the area's unit and sign rule.
