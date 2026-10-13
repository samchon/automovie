import { IAutoMovieMesh } from "@automovie/interface";

import { IAutoMovieMeshAssembly } from "./IAutoMovieMeshAssembly";
import { IAutoMovieMeshGroup } from "./IAutoMovieMeshGroup";
import { IAutoMovieMeshPart } from "./IAutoMovieMeshPart";
import { mergeAutoMovieMeshes } from "./mergeAutoMovieMeshes";
import { transformAutoMovieMesh } from "./transformAutoMovieMesh";
import { triangleIndicesOf } from "./triangleIndicesOf";

/**
 * Place rigid members, merge them, and report the index range each one owns.
 *
 * A group is what lets one merged draw call still say which triangles are the
 * tread and which the riser, so a finish, a budget or a quantity take-off can
 * address a member after the buffers are concatenated. Groups follow member
 * order; `start` and `count` address the merged index buffer, and an
 * unindexed member counts one index per vertex.
 *
 * Each member is placed through `transformAutoMovieMesh` and concatenated by
 * `mergeAutoMovieMeshes`, so both of their coordinate rules apply here. One
 * member without UVs costs the whole assembly its atlas, and a member placed
 * with a scale keeps coordinates that no longer measure its surface. Reuse is
 * where that bites: placing one built member at several sizes is the economy
 * this function exists for and the case that falsifies a metric atlas, so
 * place a reused atlas-bearing member by translation and rotation only and
 * build a second one where the size differs.
 *
 * Throws on a blank or repeated part id and, naming the part, on a malformed
 * index buffer, before any member is placed. Parts are only read.
 *
 * @param parts Members in merge order.
 * @returns The merged mesh and one group per member.
 *
 * @evidence contracts/common.md#principled-implementation Each group's start is the running sum of the earlier members' index counts, which is exactly the offset at which `mergeAutoMovieMeshes` appends that member's rebased indices, so a group addresses precisely its member's triangles.
 * @evidence contracts/common.md#clear-and-simple-design Only identity admission, placement and group bookkeeping live here; concatenation and attribute rules stay in `mergeAutoMovieMeshes` and the transform rules in `transformAutoMovieMesh`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Index buffers are admitted per part with the part's id in the diagnostic before placement, instead of letting a later stage refuse an anonymous member.
 * @evidence contracts/common.md#meaningful-documentation States what groups are for, their order and addressing, the inherited coordinate rules with the reuse pitfall and its remedy, and every refusal.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the total vertices and indices: one id pass, one index admission and at most one transform per part, then the linear merge.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call assembles one set of parts; an untransformed member is passed to the merge by reference rather than copied.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns the merged mesh and one small group record per part; transformed member meshes are temporaries released after the merge copies them.
 * @author Samchon
 */
export const mergeAutoMovieMeshParts = (
  parts: readonly IAutoMovieMeshPart[],
): IAutoMovieMeshAssembly => {
  const seen: Set<string> = new Set();
  for (const part of parts) {
    if (part.id.trim().length === 0)
      throw new Error("mesh part id must be non-empty");
    if (seen.has(part.id))
      throw new Error(`mesh part id "${part.id}" must be unique`);
    seen.add(part.id);
  }
  const placed: IAutoMovieMesh[] = parts.map(
    (part: IAutoMovieMeshPart): IAutoMovieMesh => {
      triangleIndicesOf(part.mesh, `mesh part "${part.id}"`);
      return part.transform === undefined
        ? part.mesh
        : transformAutoMovieMesh(part.mesh, part.transform);
    },
  );
  const groups: IAutoMovieMeshGroup[] = [];
  let start: number = 0;
  placed.forEach((mesh: IAutoMovieMesh, index: number): void => {
    const count: number = mesh.indices?.length ?? mesh.positions.length / 3;
    groups.push({ id: parts[index]!.id, start, count });
    start += count;
  });
  return { mesh: mergeAutoMovieMeshes(placed), groups };
};
