# src/geometry/IAutoMovieRefineSubdivisionUvs.ts#IAutoMovieRefineSubdivisionUvs.IResult

## @evidence contracts/development/common.md#meaningful-documentation

The result describes pinned chart boundaries and explicit per-corner indexing in child order, while retaining source coordinate units.

## @evidence contracts/development/design.md#principled-representation

UV refinement tests endpoint index identity across adjacent faces. It pins boundary values, creates edge midpoints for chart sides and applies the geometry masks to interior UV values.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The result has only the value and corner index arrays. Existing geometry vertex positions remain in the corresponding level.

# src/geometry/IAutoMovieRefineSubdivisionUvs.ts#IAutoMovieRefineSubdivisionUvs.IResult.uvs

## @evidence contracts/development/common.md#meaningful-documentation

The new packed UV pool starts with parent values, then derived edge and face values.

# src/geometry/IAutoMovieRefineSubdivisionUvs.ts#IAutoMovieRefineSubdivisionUvs.IResult.cornerUvs

## @evidence contracts/development/common.md#meaningful-documentation

The new index stream provides four references per parent corner in child vertex, out-edge, face and in-edge order.
