import type { IAutoMovieModelPart } from "@automovie/interface";

import type { IHumanGltfPartGroup } from "./IHumanGltfPartGroup";

/**
 * Partition static members by material and exact TRS components.
 * First occurrence determines group order and source order within each group.
 * Null and explicitly identity transforms share a frame; rotations with
 * different components remain separate even when they describe the same turn.
 * Model validation owns finite transforms and valid material references.
 *
 * @evidence contracts/common.md#principled-implementation Exact numeric TRS tuples preserve the input frame; no tolerance or transformed-position grouping changes the Float32 boundary.
 * @evidence contracts/common.md#clear-and-simple-design One ordered Map owns group membership and retains the first member's existing transform.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Grouping uses actual material and transform values, never anatomical IDs or source-specific rules.
 * @evidence contracts/common.md#meaningful-documentation States deterministic order, identity equivalence and validation responsibility.
 */
export function groupHumanGltfParts(
  parts: readonly IAutoMovieModelPart[],
): IHumanGltfPartGroup[] {
  const groups = new Map<string, IHumanGltfPartGroup>();
  for (const part of parts) {
    const transform = part.transform;
    const key = JSON.stringify([
      part.material,
      transform?.translation.x ?? 0,
      transform?.translation.y ?? 0,
      transform?.translation.z ?? 0,
      transform?.rotation.x ?? 0,
      transform?.rotation.y ?? 0,
      transform?.rotation.z ?? 0,
      transform?.rotation.w ?? 1,
      transform?.scale.x ?? 1,
      transform?.scale.y ?? 1,
      transform?.scale.z ?? 1,
    ]);
    const group = groups.get(key);
    if (group === undefined)
      groups.set(key, { parts: [part], transform });
    else group.parts.push(part);
  }
  return Array.from(groups.values());
}
