# src/geometry/IAutoMovieCreateMeshDepthSampler.ts#IAutoMovieCreateMeshDepthSampler.IResult

## @evidence contracts/development/design.md#principled-representation

Input plane coordinates and returned axial depths are mesh-local metres, with Y/Z, Z/X or X/Y query planes for X, Y or Z depth.

## @evidence contracts/development/design.md#minimal-and-owned-surface

createAutoMovieMeshDepthSampler owns the copied spatial index; callers own the returned closure and each fresh depth record.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The factory rejects malformed meshes and axes; queries reject nonfinite coordinates or depths, return null on a miss and skip zero-area triangle projections.

## @evidence contracts/development/common.md#meaningful-documentation

A reusable directional surface-envelope query over a copied mesh. Input plane coordinates and returned axial depths are mesh-local metres, with Y/Z, Z/X or X/Y query planes for X, Y or Z depth.
