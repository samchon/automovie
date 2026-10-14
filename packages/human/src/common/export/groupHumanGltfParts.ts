import type { IAutoMovieModelPart } from "@automovie/interface";

import type { IHumanGltfPartGroup } from "./IHumanGltfPartGroup";

/**
 * Partition static members by material and exact numeric TRS component values.
 * First occurrence determines group order and source order within each group.
 * Null and explicitly identity transforms share a frame; rotations with
 * different numeric components remain separate even when they describe the
 * same turn. JSON numeric keys identify positive and negative zero together;
 * this is value equivalence, not bitwise quaternion identity.
 * Model validation owns finite transforms and valid material references.
 *
 * @evidence contracts/common.md#principled-implementation Material identity and all ten numeric TRS component values define a group; absent transforms use identity values and JSON keys equate signed zero while preserving other numeric component differences. Model validation supplies finite transforms and material references.
 * @evidence contracts/common.md#clear-and-simple-design An insertion-ordered Map owns member partitioning; createGltfDocument owns packing, while groups borrow original members and their first transform.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Identity defaults represent the supported absent frame, without consumer exceptions, source rewrites or foreign method replacement.
 * @evidence contracts/common.md#meaningful-documentation The comment states exact frame equivalence, first-occurrence order, identity defaults and upstream validation; group members remain borrowed.
 * @evidence contracts/performance.md#efficient-algorithms For P members and K total serialized key bytes, grouping uses O(P+K) expected work and O(P+K) references/key storage; every member must be assigned without changing its order.
 * @evidence contracts/performance.md#reuse-equivalent-work Equivalence includes material and every TRS component and shares only a call-local group; mutable geometry does not enter a cross-document result cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources At most P call-local groups retain member references; result arrays transfer to the caller and unused keys become unreachable, with no handles or tasks.
 */
export function groupHumanGltfParts(
  parts: readonly IAutoMovieModelPart[],
): IHumanGltfPartGroup[] {
  const groups: Map<string, IHumanGltfPartGroup> = new Map<string, IHumanGltfPartGroup>();
  for (const part of parts) {
    const transform: IAutoMovieModelPart["transform"] = part.transform;
    const key: string = JSON.stringify([
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
    const group: IHumanGltfPartGroup | undefined = groups.get(key);
    if (group === undefined)
      groups.set(key, { parts: [part], transform });
    else group.parts.push(part);
  }
  return Array.from(groups.values());
}
