# src/math/weldMeshVertices.ts#weldMeshVertices

## @evidence contracts/development/implementation.md#principled-implementation

Uses Math.round on each coordinate times MESH_WELD_GRID while that grid index is safe; beyond that magnitude binary64 coordinate spacing exceeds 1e-9, so exact-coordinate identity preserves distinct cells without overflowing or rounding an unsafe grid integer. Signed zero has one canonical label.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Returns one first-occurrence label table and a parallel input-vertex-to-label index list, allowing mesh topology consumers to share identical welding semantics without changing source positions.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Incomplete tuples, sparse holes and nonfinite coordinates refuse instead of coercing to origin; the large-coordinate label is chosen per axis so other axes retain their ordinary sub-grid welding.

## @evidence contracts/development/common.md#meaningful-documentation

States finite XYZ admission and throw behavior, first-occurrence order, signed-zero convention and the exact axis label used beyond safely representable grid indexes.

## @evidence contracts/development/implementation.md#efficient-algorithms

One hash-map lookup per input vertex gives expected O(V) time with O(V) output indexes and O(U) distinct labels for U welded vertices, avoiding pairwise neighborhood searches.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One map reuses a label for every equal quantized triple within the mesh; no result survives across calls on mutable position arrays.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The temporary map is released on return; the caller owns V integer indexes and at most V label strings, and source position storage is not retained.
