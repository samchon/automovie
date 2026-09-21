import { IAutoMovieMeshAssembly } from "./IAutoMovieMeshAssembly";
import { IAutoMovieMeshGroup } from "./IAutoMovieMeshGroup";
import { IAutoMovieMeshPart } from "./IAutoMovieMeshPart";
import { mergeAutoMovieMeshes } from "./mergeAutoMovieMeshes";
import { transformAutoMovieMesh } from "./transformAutoMovieMesh";
import { triangleIndicesOf } from "./triangleIndicesOf";

/**
 * Merge placed rigid members and report the index range each one owns.
 *
 * A material group is what lets one merged draw call still say which triangles
 * are the tread and which are the riser, so a finish, a budget, or a quantity
 * take-off can address a member after the buffers were concatenated.
 *
 * Each member is placed through {@link transformAutoMovieMesh} and the result
 * concatenated by {@link mergeAutoMovieMeshes}, so both of their coordinate
 * rules apply here and this is where an author meets them. One member without
 * coordinates costs the whole assembly its atlas, and a member placed with a
 * scale keeps coordinates that no longer measure its surface. Reuse is what
 * makes the second bite: building one member and placing it at several sizes is
 * exactly the economy this function exists for, and it is the case that
 * falsifies a metric declaration. Place a reused atlas-bearing member by
 * translation and rotation, and build a second one where the size differs.
 *
 * @evidence requirements/asset-authoring/identity-and-instances.md#asset-logical-group Merges geometry while retaining named group membership.
 * @evidence specifications/asset-and-representation/alternatives-instances-and-groups.md#asset-spec-group-individuality Reports the exact index span contributed by each member.
 */
export const mergeAutoMovieMeshParts = (
  parts: readonly IAutoMovieMeshPart[],
): IAutoMovieMeshAssembly => {
  const seen = new Set<string>();
  for (const part of parts) {
    if (part.id.trim().length === 0)
      throw new Error("mesh part id must be non-empty");
    if (seen.has(part.id))
      throw new Error(`mesh part id "${part.id}" must be unique`);
    seen.add(part.id);
  }
  const placed = parts.map((part) => {
    triangleIndicesOf(part.mesh, `mesh part "${part.id}"`);
    return part.transform === undefined
      ? part.mesh
      : transformAutoMovieMesh(part.mesh, part.transform);
  });
  const groups: IAutoMovieMeshGroup[] = [];
  let start = 0;
  placed.forEach((mesh, index) => {
    const count = mesh.indices?.length ?? mesh.positions.length / 3;
    groups.push({ id: parts[index]!.id, start, count });
    start += count;
  });
  return { mesh: mergeAutoMovieMeshes(placed), groups };
};
