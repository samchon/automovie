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
 * @returns The mesh's own `indices` array, not a copy, or a new consecutive run
 *   when it has none; callers must not mutate it.
 * @throws Error when positions are not whole xyz triples, indices are not whole
 *   triangles, or an index is not a safe integer inside the vertex range.
 */
export const triangleIndicesOf: (
  mesh: IAutoMovieMesh,
  label: string,
) => number[] = (mesh: IAutoMovieMesh, label: string): number[] => {
  const vertices: number = mesh.positions.length / 3;
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
    if (index === undefined || index < 0 || index >= vertices)
      throw new Error(`${label} indexes a vertex the mesh does not carry`);
  }
  return indices;
};
