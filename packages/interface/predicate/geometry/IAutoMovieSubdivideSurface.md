# src/geometry/IAutoMovieSubdivideSurface.ts#IAutoMovieSubdivideSurface.IProps

## @evidence contracts/development/common.md#meaningful-documentation

The inputs describe the allowed refinement count, cage admission, permanent and semi-sharp edges, and limit position and normal evaluation.

## @evidence contracts/development/design.md#principled-representation

The owner admits a whole count and finite polygon cage, refines to quads, then evaluates limits and chart-dependent normals. Unrepresentable output arithmetic throws.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The input borrows an authored cage and one refinement count. Topology, normal and UV computations remain in the resulting surface.

# src/geometry/IAutoMovieSubdivideSurface.ts#IAutoMovieSubdivideSurface.IProps.cage

## @evidence contracts/development/common.md#meaningful-documentation

The control cage is read as source connectivity, control values, optional UVs and authored edge sharpness.

# src/geometry/IAutoMovieSubdivideSurface.ts#IAutoMovieSubdivideSurface.IProps.levels

## @evidence contracts/development/common.md#meaningful-documentation

The owner requires a safe integer from 1 to 6 before constructing or refining any level.
