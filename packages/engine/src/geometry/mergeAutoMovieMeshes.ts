import {
  IAutoMovieMesh,
  IAutoMovieMeshPhysicalSource,
  IAutoMovieMeshPhysicalVertices,
} from "@automovie/interface";

import { resolveAutoMovieMeshPhysicalVertices } from "../math/internal/resolveAutoMovieMeshPhysicalVertices";
import { triangleIndicesOf } from "./triangleIndicesOf";

/**
 * Concatenate rigid meshes into one, rebasing each member's indices in declared
 * order.
 *
 * This concatenates; it is not a boolean union, and the kernel has no solid
 * union, intersection or difference. Overlapping members come back with both
 * surfaces, including the parts now inside the other, and a contact edge welded
 * by position belongs to four triangles rather than two, which
 * `validateMeshTopology` reads as non-manifold. The region replaces a boolean
 * here: `AutoMovieEnginePlanarRegion.extrude` takes an outline and its voids
 * together, so a wall less its openings or a plate less its cut-outs is one
 * solid from one description. A subtraction along a direction the section does
 * not run in, such as a niche stopping partway into a wall, is not offered at
 * all, and `buildAutoMovieWall` refuses the pinched case by name.
 *
 * Normals and texture coordinates survive only when every member carries them.
 * A merged buffer is read by vertex index, so a member without coordinates has
 * no honest filler: zeros would pin its surface to one texel, which reads as
 * flat paint nothing traces back to the merge, while dropping the attribute
 * makes the loss visible at the binding. RGB multipliers and relief weights
 * have an honest identity, one: a member that lacks them receives white or a
 * full weight once any member carries them, and entirely bare inputs acquire
 * neither buffer. Explicit physical source pairs survive every merge; equal
 * pairs across members assert one point and must agree on the current grid, and
 * a member without them contributes `null` entries that keep welding by
 * position. The result owns all of its buffers and metadata.
 *
 * Every member is admitted before anything is appended: a skinned member, an
 * index buffer that is ragged or names a missing vertex, and a normal, UV,
 * colour or relief buffer not aligned to the member's vertices each throw,
 * naming the member's position in the list.
 *
 * @param meshes Rigid members in merge order, only read.
 * @returns One mesh with every member's triangles.
 */
export const mergeAutoMovieMeshes = (
  meshes: readonly IAutoMovieMesh[],
): IAutoMovieMesh => {
  meshes.forEach((mesh: IAutoMovieMesh, member: number): void => {
    const label: string = `mesh merge member[${member}]`;
    if (mesh.skin !== null)
      throw new Error("procedural rigid-mesh merge does not accept skinning");
    triangleIndicesOf(mesh, label);
    const count: number = mesh.positions.length / 3;
    if (mesh.normals !== null && mesh.normals.length !== count * 3)
      throw new Error(`${label} needs one normal per vertex`);
    if (mesh.uvs !== null && mesh.uvs.length !== count * 2)
      throw new Error(`${label} needs one uv pair per vertex`);
    if (mesh.colors !== undefined && mesh.colors.length !== count * 3)
      throw new Error(`${label} needs one colour per vertex`);
    if (mesh.reliefWeights !== undefined && mesh.reliefWeights.length !== count)
      throw new Error(`${label} needs one relief weight per vertex`);
  });
  const keepPhysical: boolean = meshes.some(
    (mesh: IAutoMovieMesh): boolean => mesh.physicalVertices !== undefined,
  );
  const physicalVertices: IAutoMovieMeshPhysicalVertices = {
    sources: [],
    vertices: [],
  };
  const sourceTable: Map<string, number> = new Map();
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  const keepNormals: boolean = meshes.every(
    (mesh: IAutoMovieMesh): boolean => mesh.normals !== null,
  );
  const keepUvs: boolean = meshes.every(
    (mesh: IAutoMovieMesh): boolean => mesh.uvs !== null,
  );
  const uvs: number[] = [];
  const keepColors: boolean = meshes.some(
    (mesh: IAutoMovieMesh): boolean => mesh.colors !== undefined,
  );
  const colors: number[] = [];
  const keepRelief: boolean = meshes.some(
    (mesh: IAutoMovieMesh): boolean => mesh.reliefWeights !== undefined,
  );
  const reliefWeights: number[] = [];
  for (const mesh of meshes) {
    const count: number = mesh.positions.length / 3;
    if (keepPhysical) {
      resolveAutoMovieMeshPhysicalVertices(mesh);
      for (let vertex: number = 0; vertex < count; vertex++) {
        const reference: number | null =
          mesh.physicalVertices?.vertices[vertex] ?? null;
        if (reference === null) {
          physicalVertices.vertices.push(null);
          continue;
        }
        const source: IAutoMovieMeshPhysicalSource =
          mesh.physicalVertices!.sources[reference]!;
        const key: string = JSON.stringify([source.domain, source.id]);
        let target: number | undefined = sourceTable.get(key);
        if (target === undefined) {
          target = physicalVertices.sources.length;
          sourceTable.set(key, target);
          physicalVertices.sources.push({ ...source });
        }
        physicalVertices.vertices.push(target);
      }
    }
    const base: number = positions.length / 3;
    for (const value of mesh.positions) positions.push(value);
    if (keepNormals) for (const value of mesh.normals!) normals.push(value);
    if (keepUvs) for (const value of mesh.uvs!) uvs.push(value);
    if (keepColors)
      for (let index: number = 0; index < mesh.positions.length; ++index)
        colors.push(mesh.colors === undefined ? 1 : mesh.colors[index]!);
    if (keepRelief)
      for (let index: number = 0; index < count; ++index)
        reliefWeights.push(
          mesh.reliefWeights === undefined ? 1 : mesh.reliefWeights[index]!,
        );
    if (mesh.indices === null)
      for (let index: number = 0; index < count; ++index)
        indices.push(index + base);
    else for (const index of mesh.indices) indices.push(index + base);
  }
  const result: IAutoMovieMesh = {
    positions,
    normals: keepNormals ? normals : null,
    uvs: keepUvs ? uvs : null,
    ...(keepColors ? { colors } : {}),
    ...(keepRelief ? { reliefWeights } : {}),
    indices,
    skin: null,
    ...(keepPhysical ? { physicalVertices } : {}),
  };
  if (keepPhysical) resolveAutoMovieMeshPhysicalVertices(result);
  return result;
};
