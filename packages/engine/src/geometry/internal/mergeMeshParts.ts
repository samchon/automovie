import {
  IAutoMovieMesh,
  type IAutoMovieMeshAssembly,
  type IAutoMovieMeshGroup,
  type IAutoMovieMeshPart,
} from "@automovie/interface";

import { mergeMeshes } from "./mergeMeshes";
import { transformMesh } from "./transformMesh";
import { triangleIndicesOf } from "./triangleIndicesOf";

/*
 * Place rigid members, merge them, and report the index range each one owns.
 *
 * A group is what lets one merged draw call still say which triangles are the
 * tread and which the riser, so a finish, a budget or a quantity take-off can
 * address a member after the buffers are concatenated. Groups follow member
 * order; `start` and `count` address the merged index buffer, and an unindexed
 * member counts one index per vertex.
 *
 * Each member is placed through `transformMesh` and concatenated by
 * `mergeMeshes`, so both of their coordinate rules apply here. One
 * member without UVs costs the whole assembly its atlas, and a member placed
 * with a scale keeps coordinates that no longer measure its surface. Reuse is
 * where that bites: placing one built member at several sizes is the economy
 * this function exists for and the case that falsifies a metric atlas, so place
 * a reused atlas-bearing member by translation and rotation only and build a
 * second one where the size differs.
 *
 * Throws on a repeated part id and, naming the part, on a malformed
 * index buffer, before any member is placed. Parts are only read.
 * Parameter parts: Members in merge order.
 * Returns: The merged mesh and one group per member.
 */
export const mergeMeshParts = (
  parts: readonly IAutoMovieMeshPart[],
): IAutoMovieMeshAssembly => {
  const seen: Set<string> = new Set();
  for (const part of parts) {
    if (seen.has(part.id))
      throw new Error(`mesh part id "${part.id}" must be unique`);
    seen.add(part.id);
  }
  const placed: IAutoMovieMesh[] = parts.map(
    (part: IAutoMovieMeshPart): IAutoMovieMesh => {
      triangleIndicesOf(part.mesh, `mesh part "${part.id}"`);
      return part.transform === undefined
        ? part.mesh
        : transformMesh(part.mesh, part.transform);
    },
  );
  const groups: IAutoMovieMeshGroup[] = [];
  let start: number = 0;
  placed.forEach((mesh: IAutoMovieMesh, index: number): void => {
    const count: number = mesh.indices?.length ?? mesh.positions.length / 3;
    groups.push({ id: parts[index]!.id, start, count });
    start += count;
  });
  return { mesh: mergeMeshes(placed), groups };
};
