import { GROUPS } from "./GROUPS.ts";
import { Group } from "./Group.ts";
import { Skin } from "./Skin.ts";

/**
 * Sum of declared diagnostic rig groups at one private source vertex.
 *
 * @evidence contracts/common.md#principled-implementation Summing the declared stable-stride group channels gives one diagnostic support weight.
 * @evidence contracts/common.md#clear-and-simple-design GROUPS owns the shared buffer order consumed by both assembly and queries.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches follow the declared operation or source protocol rather than specimen-specific coordinates or expected results.
 * @evidence contracts/common.md#meaningful-documentation States the operation, physical interpretation and its documented degeneracy or ownership limits.
 * @evidence contracts/performance.md#efficient-algorithms O(number of requested groups) fixed-stride reads.
 * @evidence contracts/performance.md#reuse-equivalent-work Each call depends directly on its arguments; no retained cache or effectful shared work exists.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a scalar and retains no skin references.
 */
export function groupWeight(
  skin: Skin,
  vertex: number,
  groups: Group[],
): number {
  let weight: number = 0;
  for (const group of groups)
    weight += skin.gw[vertex * GROUPS.length + GROUPS.indexOf(group)];
  return weight;
}
