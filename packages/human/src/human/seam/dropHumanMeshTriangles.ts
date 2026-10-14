import { resolveAutoMovieMeshPhysicalVertices } from "@automovie/engine/math/resolveAutoMovieMeshPhysicalVertices";
import type {
  IAutoMovieMesh,
  IAutoMovieMeshPhysicalSource,
} from "@automovie/interface";

/**
 * Remove indexed triangles touching a drop-marked render vertex, compact remaining positions/normals/UVs/colours/relief in original vertex order and preserve copied physical source rows with adjusted survivor references. Unindexed input refuses. Caller supplies admitted aligned static mesh fields and a pure stable predicate; short-circuit evaluation does not call every triangle corner. The skin table is forwarded unchanged, so this is not a general skinned-table compactor.
 *
 * The optional survivor callback receives the actual original-order mapping before result gather. It must respect readonly contents; its side effects/exceptions are caller-owned and propagate. Internal material-field consumers use this mapping without adding vertices or changing numerical fields. Triangle removal can expose boundaries and provides no global closure, collision or current visual guarantee.
 *
 * @evidence contracts/common.md#principled-implementation Actual render-corner drop decisions and original-order survivor renumbering preserve aligned static fields and existing physical source identities.
 * @evidence contracts/common.md#clear-and-simple-design This utility owns triangle/vertex compaction; caller corner tables own source decisions and the survivor observer carries external material fields through the same mapping.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No coordinate weld or new ID fills removed geometry, unindexed input refuses, and unchanged skin metadata is not falsely claimed compacted or generally valid after renumbering.
 * @evidence contracts/common.md#meaningful-documentation Prose states static/admitted-field and pure-predicate premises, short-circuit calls, callback lifetime and possible new boundaries.
 * @evidence contracts/performance.md#efficient-algorithms Triangle filtering, Int32 survivor marking and fixed-width field gathers are linear in actual triangle/vertex/source populations, with no pairwise removal search.
 * @evidence contracts/performance.md#reuse-equivalent-work One survivor/renumber map serves every static attribute, physical reference and external material-field receipt.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owned compacted fields/source records escape and workspace is local; forwarded skin data remains borrowed, while a caller observer may retain its mapping and owns that retention.
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
  const count: number = mesh.positions.length / 3;
  const indices: number[] = [];
  for (let corner: number = 0; corner < mesh.indices.length; corner += 3) {
    const [a, b, c]: number[] = [
      mesh.indices[corner],
      mesh.indices[corner + 1],
      mesh.indices[corner + 2],
    ];
    if (!drop(a) && !drop(b) && !drop(c)) indices.push(a, b, c);
  }
  const renumber: Int32Array = new Int32Array(count).fill(-1);
  for (const vertex of indices) renumber[vertex] = 0;
  const survivors: number[] = [];
  for (let vertex: number = 0; vertex < count; vertex++)
    if (renumber[vertex] === 0) {
      renumber[vertex] = survivors.length;
      survivors.push(vertex);
    }
  const gather: (values: number[], width: number) => number[] = (
    values: number[],
    width: number,
  ): number[] => {
    const output: number[] = new Array<number>(survivors.length * width);
    survivors.forEach((vertex: number, at: number): void => {
      for (let axis: number = 0; axis < width; axis++)
        output[at * width + axis] = values[vertex * width + axis];
    });
    return output;
  };
  receiveSurvivors?.(survivors);
  return {
    positions: gather(mesh.positions, 3),
    normals: mesh.normals === null ? null : gather(mesh.normals, 3),
    uvs: mesh.uvs === null ? null : gather(mesh.uvs, 2),
    indices: indices.map((vertex: number): number => renumber[vertex]),
    skin: mesh.skin,
    ...(mesh.colors === undefined ? {} : { colors: gather(mesh.colors, 3) }),
    ...(mesh.reliefWeights === undefined
      ? {}
      : { reliefWeights: gather(mesh.reliefWeights, 1) }),
    ...(mesh.physicalVertices === undefined
      ? {}
      : {
          physicalVertices: {
            sources: mesh.physicalVertices.sources.map(
              (
                source: IAutoMovieMeshPhysicalSource,
              ): IAutoMovieMeshPhysicalSource => ({
                ...source,
              }),
            ),
            vertices: survivors.map(
              (vertex: number): number | null =>
                mesh.physicalVertices!.vertices[vertex],
            ),
          },
        }),
  };
}
