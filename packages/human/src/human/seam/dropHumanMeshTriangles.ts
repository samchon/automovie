import { resolveAutoMovieMeshPhysicalVertices } from "@automovie/engine/math/resolveAutoMovieMeshPhysicalVertices";
import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * A copy of a mesh without the triangles that touch a marked vertex, and
 * without the vertices no remaining triangle uses.
 *
 * `drop(vertex)` marks render vertices of the mesh. Every triangle with a
 * marked corner is removed; the vertices left unreferenced are then removed
 * too, and the survivors are renumbered in their original order. Every
 * per-vertex array the mesh carries (positions, normals, UVs, colours and
 * relief weights) is compacted together so the attributes stay aligned, and
 * the input is not modified. A mesh with no index list is a non-indexed
 * triangle soup this function does not read, and refuses.
 *
 * The seam uses it to remove the body skin's triangles above the face's neck
 * cut from the render meshes the body builder already gathered: the render
 * vertex numbering belongs to the region, so the decision `drop` makes is
 * about shared skin vertices the caller looks up through the region's own
 * corner table.
 * Physical source rows are copied and survivor references follow this same
 * compaction; unused source rows remain valid without renaming any source ID.
 * An optional survivor receipt carries internal material fields through that
 * exact renumbering; it adds no vertex, face or changed numerical operation.
 */
export function dropHumanMeshTriangles(
  mesh: IAutoMovieMesh,
  drop: (vertex: number) => boolean,
  receiveSurvivors?: (vertices: readonly number[]) => void,
): IAutoMovieMesh {
  if (mesh.indices === null)
    throw new Error("Dropping triangles needs an indexed mesh.");
  if (mesh.physicalVertices !== undefined)
    resolveAutoMovieMeshPhysicalVertices(mesh);
  const count = mesh.positions.length / 3;
  const indices: number[] = [];
  for (let corner = 0; corner < mesh.indices.length; corner += 3) {
    const [a, b, c] = [
      mesh.indices[corner],
      mesh.indices[corner + 1],
      mesh.indices[corner + 2],
    ];
    if (!drop(a) && !drop(b) && !drop(c)) indices.push(a, b, c);
  }
  const renumber = new Int32Array(count).fill(-1);
  for (const vertex of indices) renumber[vertex] = 0;
  const survivors: number[] = [];
  for (let vertex = 0; vertex < count; vertex++)
    if (renumber[vertex] === 0) {
      renumber[vertex] = survivors.length;
      survivors.push(vertex);
    }
  const gather = (values: number[], width: number): number[] => {
    const output = new Array<number>(survivors.length * width);
    survivors.forEach((vertex, at) => {
      for (let axis = 0; axis < width; axis++)
        output[at * width + axis] = values[vertex * width + axis];
    });
    return output;
  };
  receiveSurvivors?.(survivors);
  return {
    positions: gather(mesh.positions, 3),
    normals: mesh.normals === null ? null : gather(mesh.normals, 3),
    uvs: mesh.uvs === null ? null : gather(mesh.uvs, 2),
    indices: indices.map((vertex) => renumber[vertex]),
    skin: mesh.skin,
    ...(mesh.colors === undefined ? {} : { colors: gather(mesh.colors, 3) }),
    ...(mesh.reliefWeights === undefined
      ? {}
      : { reliefWeights: gather(mesh.reliefWeights, 1) }),
    ...(mesh.physicalVertices === undefined
      ? {}
      : {
          physicalVertices: {
            sources: mesh.physicalVertices.sources.map((source) => ({
              ...source,
            })),
            vertices: survivors.map(
              (vertex) => mesh.physicalVertices!.vertices[vertex],
            ),
          },
        }),
  };
}
