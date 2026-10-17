import type { CutPoint } from "../geometry/CutPoint.ts";
import type { Skin } from "../geometry/Skin.ts";
import { groupWeight } from "../geometry/groupWeight.ts";

/**
 * Interpolates a source cut point's diagnostic upper-limb rig share.
 * This scope weight is neither a skin boundary nor an anatomical muscle attachment.
 *
 * @evidence contracts/common.md#principled-implementation Interpolates the canonical source edge's endpoint weight sums using the cut's own parameter, preserving the linear source-face field.
 * @evidence contracts/common.md#clear-and-simple-design Owns the one shared scope definition for native trunk profiles and independent validation crops.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses named rig groups without source vertex indices, fitted coordinates or identity-dependent thresholds.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes the dimensionless diagnostic scope weight from an anatomical insertion or surface edge.
 * @evidence contracts/performance.md#efficient-algorithms Evaluates three groups at two endpoints in constant time and storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Reads the combined skin's existing group-weight array instead of reloading source weights.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one scalar and retains no arrays, cache entries or resource handles.
 */
export function trunkArmShare(
  skin: Skin,
  point: CutPoint,
  side: "l" | "r",
): number {
  return (
    groupWeight(skin, point.a, [
      `upperarm_${side}`,
      `lowerarm_${side}`,
      `hand_${side}`,
    ]) *
      (1 - point.t) +
    groupWeight(skin, point.b, [
      `upperarm_${side}`,
      `lowerarm_${side}`,
      `hand_${side}`,
    ]) *
      point.t
  );
}
