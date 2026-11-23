# src/geometry/createAutoMovieMeshDeformer.ts#createAutoMovieMeshDeformer

## @evidence contracts/development/implementation.md#principled-implementation

The smooth compactly supported kernel `(1 - r^2)^3` has a continuous gradient, so the summed map has an analytic Jacobian whose cofactor matrix transports normals exactly; the masked map's Jacobian follows the product rule, and orientation is checked per vertex by a positive determinant and per triangle by `assertAutoMovieDeformedTriangles`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Fields are packed once into a closure and the returned operation does admission, evaluation and normal transport, delegating cofactors to `cofactorAutoMovieJacobian`, triangle orientation to `assertAutoMovieDeformedTriangles`, index admission to `triangleIndicesOf` and physical identity to `resolveAutoMovieMeshPhysicalVertices`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An orientation reversal or collapse throws instead of being clamped, the mask enters the Jacobian before checking rather than scaling the output afterwards, and the movement-over-radius ratio is formed in that order only so an underflowing radius square cannot zero a finite gradient term.

## @evidence contracts/development/common.md#meaningful-documentation

States the field kernel, normal transport, what survives, ownership, the influence formula and when to use it, every refusal at compile and call time, and what the triangle check does not prove.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(V F) for V vertices and F fields, each field rejected by its bounding box before any ellipsoid arithmetic, plus a linear triangle check; fields are few local features, so a spatial index over them would cost more than it saves.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Field packing happens once per compiled deformer and is reused by every call; each call's result depends on its own mesh and influence, so nothing else is shared.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The deformer retains only the packed fields, four three-number arrays each; a call holds one nine-number cofactor matrix per vertex until the triangle check finishes and returns new position, normal and physical buffers.
