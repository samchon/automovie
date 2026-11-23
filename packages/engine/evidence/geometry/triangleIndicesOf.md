# src/geometry/triangleIndicesOf.ts#triangleIndicesOf

## @evidence contracts/development/implementation.md#principled-implementation

Checks the three facts that make index access total, a whole vertex count, a whole triangle count and every index a safe integer in `[0, vertexCount)`, so every later `positions[3 * index + axis]` read is defined, and an indexed loop reads every slot so a sparse array's hole is refused too; a missing index buffer is expanded by the glTF non-indexed rule of consecutive vertices.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One admission shared by transform, merge, topology, crossing, separation and signed-distance queries, so every mesh consumer refuses the same malformed buffers with the same messages.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Malformed indices are never truncated, clamped or skipped, and a short final triangle is refused rather than dropped.

## @evidence contracts/development/common.md#meaningful-documentation

States why reading past the end is refused, the non-indexed rule, that positions are not checked, the aliasing of the result and each refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass over the I indices with constant work each and early exit on the first bad index; the consecutive run for a non-indexed mesh is O(V) and is the only allocation.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Callers admit each mesh once per operation, and the indexed result aliases the mesh's own array instead of copying it.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the returned array is either the mesh's own or a new run of V integers owned by the caller.
