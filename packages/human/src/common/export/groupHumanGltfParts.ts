import type { IAutoMovieModelPart } from "@automovie/interface";

import type { IHumanGltfPartGroup } from "./IHumanGltfPartGroup";

/**
 * Partition static members by material and exact TRS components.
 * First occurrence determines group order and source order within each group.
 * Null and explicitly identity transforms share a frame; rotations with
 * different components remain separate even when they describe the same turn.
 * Model validation owns finite transforms and valid material references.
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
