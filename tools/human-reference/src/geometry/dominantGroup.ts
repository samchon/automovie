import { GROUPS } from "./GROUPS.ts";
import { Group } from "./Group.ts";
import { Skin } from "./Skin.ts";

/**
 * Largest diagnostic source rig group; ties keep the stable GROUPS order.
 *
 * @evidence contracts/common.md#principled-implementation A stable maximum over diagnostic rig weights defines the dominant support label.
 * @evidence contracts/common.md#clear-and-simple-design Equal weights deliberately retain the GROUPS order.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches follow the declared operation or source protocol rather than specimen-specific coordinates or expected results.
 * @evidence contracts/common.md#meaningful-documentation States the operation, physical interpretation and its documented degeneracy or ownership limits.
 * @evidence contracts/performance.md#efficient-algorithms O(number of diagnostic groups) reads and constant storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Each call depends directly on its arguments; no retained cache or effectful shared work exists.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a group string without retaining the skin.
 */
export function dominantGroup(skin: Skin, vertex: number): Group {
  let best: number = 0,
    selected: number = 0;
  for (let k: number = 0; k < GROUPS.length; k++)
    if (skin.gw[vertex * GROUPS.length + k] > best) {
      best = skin.gw[vertex * GROUPS.length + k];
      selected = k;
    }
  return GROUPS[selected];
}
