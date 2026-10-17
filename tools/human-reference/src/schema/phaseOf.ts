import type { V2 } from "../geometry/V2.ts";

/**
 * Measures section phase in degrees, with zero along minus v and ninety along plus u.
 *
 * @evidence contracts/common.md#principled-implementation Uses the declared local-plane atan2 convention and a positive full-turn remainder.
 * @evidence contracts/common.md#clear-and-simple-design Owns only the coordinate-to-phase conversion without anatomical interpretation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No identity, point index or expected phase is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States degrees, phase zero and positive quarter-turn direction.
 * @evidence contracts/performance.md#efficient-algorithms Performs a fixed number of scalar operations independent of mesh size.
 * @evidence contracts/performance.md#reuse-equivalent-work Retains no cache or cross-call computation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Acquires no retained resource and returns one scalar.
 */
export function phaseOf(point: V2, centre: V2): number {
  const angle: number =
    (Math.atan2(point[1] - centre[1], point[0] - centre[0]) * 180) / Math.PI +
    90;
  return ((angle % 360) + 360) % 360;
}
