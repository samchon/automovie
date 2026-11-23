# src/geometry/weldedDegenerateTriangles.ts#weldedDegenerateTriangles

## @evidence contracts/development/implementation.md#principled-implementation

A triangle is degenerate on the grid exactly when two corners intern to the same weldMeshVertices identity, matching legacy physical correspondence and topology reports; the shared welder admits dense finite triples and preserves large-coordinate identity where a nanometre index exceeds safe integer range.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A dedicated query instead of the full topology report, because its callers need only the degenerate ordinals; index admission and welding are the shared `triangleIndicesOf` and `weldMeshVertices`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The shared welder refuses sparse and nonfinite positions instead of converting them to origin coordinates, so malformed buffers cannot hide a collapsed face from the Float32 gate.

## @evidence contracts/development/common.md#meaningful-documentation

States the degeneracy rule and grid, which callers use the ordinals for, what is deliberately not computed, the unit, that the input is unchanged, the result order and each refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

For V vertices and T triangles, one welding pass is O(V) with one string key per vertex, and the triangle scan is O(T) with three integer comparisons each, avoiding the edge map of a full topology report.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each caller asks once per mesh per gate, and the weld labels are not retained because the callers need only the ordinals.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the weld map and labels, linear in V, are released on return, and only the ordinal array is returned.
