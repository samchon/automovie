import { IAutoMovieMesh } from "@automovie/interface";

/**
 * The triangle index run a mesh carries, refused rather than read past its end.
 *
 * An index array that is not a whole number of triangles, or that names a
 * vertex the mesh does not carry, would otherwise read `undefined` and emit
 * `NaN` positions and a `NaN` volume that no downstream check attributes back
 * to the malformed input. A mesh without indices is read as consecutive
 * triangles `0, 1, 2, ...` over its vertices.
 *
 * Positions are not checked for finiteness; callers that need finite
 * coordinates check them separately.
 *
 * @param mesh Mesh to read.
 * @param label Name the error messages give the mesh.
 * @returns The mesh's own `indices` array, not a copy, or a new consecutive run when it has none; callers must not mutate it.
 * @throws Error when positions are not whole xyz triples, indices are not whole triangles, or an index is not a safe integer inside the vertex range.
 *
 * @evidence contracts/common.md#principled-implementation Checks the three facts that make index access total, a whole vertex count, a whole triangle count and every index a safe integer in `[0, vertexCount)`, so every later `positions[3 * index + axis]` read is defined, and an indexed loop reads every slot so a sparse array's hole is refused too; a missing index buffer is expanded by the glTF non-indexed rule of consecutive vertices.
 * @evidence contracts/common.md#clear-and-simple-design One admission shared by transform, merge, topology, crossing, separation and signed-distance queries, so every mesh consumer refuses the same malformed buffers with the same messages.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Malformed indices are never truncated, clamped or skipped, and a short final triangle is refused rather than dropped.
 * @evidence contracts/common.md#meaningful-documentation States why reading past the end is refused, the non-indexed rule, that positions are not checked, the aliasing of the result and each refusal.
 * @evidence contracts/performance.md#efficient-algorithms One pass over the I indices with constant work each and early exit on the first bad index; the consecutive run for a non-indexed mesh is O(V) and is the only allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Callers admit each mesh once per operation, and the indexed result aliases the mesh's own array instead of copying it.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains nothing; the returned array is either the mesh's own or a new run of V integers owned by the caller.
 */
export const triangleIndicesOf: (
  mesh: IAutoMovieMesh,
  label: string,
) => number[] = (mesh: IAutoMovieMesh, label: string): number[] => {
  const vertices: number = mesh.positions.length / 3;
  if (Number.isSafeInteger(vertices) === false)
    throw new Error(`${label} needs positions in whole xyz triples`);
  const indices: number[] =
    mesh.indices ??
    Array.from(
      { length: vertices },
      (_: unknown, index: number): number => index,
    );
  if (indices.length % 3 !== 0)
    throw new Error(`${label} needs triangle indices in threes`);
  // An indexed loop, unlike `some`, also visits the holes of a sparse array.
  for (let at: number = 0; at < indices.length; ++at) {
    const index: number | undefined = indices[at];
    if (
      index === undefined ||
      Number.isSafeInteger(index) === false ||
      index < 0 ||
      index >= vertices
    )
      throw new Error(`${label} indexes a vertex the mesh does not carry`);
  }
  return indices;
};
