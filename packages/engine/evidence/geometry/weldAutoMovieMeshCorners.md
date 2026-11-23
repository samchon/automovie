# src/geometry/weldAutoMovieMeshCorners.ts#weldAutoMovieMeshCorners

## @evidence contracts/development/implementation.md#principled-implementation

Rounds each corner onto the shared `MESH_WELD_GRID` lattice to detect degenerate triangles and, without physical sources, to identify corners; a declared physical correspondence identifies corners instead, so touching sources stay distinct. This is the weld `inspectAutoMovieMeshTopology` has always used.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The one weld both the whole-mesh topology report and the per-piece census read, so they cannot disagree on identity or degeneracy; index admission stays with `triangleIndicesOf` and physical identity with `resolveAutoMovieMeshPhysicalVertices`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the shared grid constant rather than a local tolerance and lists degenerate triangles instead of dropping them silently.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in corners: one lattice key and one hashed lookup per corner.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call welds the mesh it is given; callers keep the result for as long as they need it.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the lattice map is released on return, and the result holds one identity per corner and the degenerate ordinals.

# src/geometry/weldAutoMovieMeshCorners.ts#weldAutoMovieMeshCorners.IResult

## @evidence contracts/development/design.md#principled-representation

The borrowed index run, one integer identity per corner with -1 marking a degenerate triangle's corners, the degenerate ordinals and the identity count that sizes edge keys.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Engine-internal and read by `inspectAutoMovieMeshTopology` and `measureAutoMovieMeshPieces`; it stays out of the barrel and out of `interface` because no public consumer reads it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The -1 sentinel marks a whole degenerate triangle, which every reader tests at its first corner; no optional field or cast is used.

## @evidence contracts/development/common.md#meaningful-documentation

States each field's meaning, range and the sentinel.
