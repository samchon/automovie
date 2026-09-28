import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import { skinHumanBodySurface } from "./skinHumanBodySurface";

/**
 * Differentiate posed skin position along one metre of rest-frame downward
 * travel at each vertex.
 *
 * Dual-quaternion skinning is rigid for fixed weights, but a bone with
 * `distributeTwist` gives a position-dependent rotation along its shaft.
 * The gravity sag stage needs that map's local direction in the shared
 * Y-up, Z-forward metre frame. A backward difference follows the physical
 * -Y direction at a twist clamp, where the opposite derivative can differ.
 * Its first-order truncation is O(h/L) and subtraction roundoff is
 * O(epsilon L/h); h = sqrt(Number.EPSILON) L balances the two. L is at least
 * one metre and spans the largest absolute input coordinate. The already
 * skinned positions are supplied by the caller, so only one further skin
 * evaluation is needed. Neither input array is changed. This is a numeric
 * derivative of the current rig, not a measured tissue parameter.
 */
export function humanBodySkinDownDirection(input: {
  positions: number[];
  skinned: number[];
  skin: IAutoMovieHumanBodyBasis["surfaces"][number]["skin"];
  joints: Parameters<typeof skinHumanBodySurface>[2];
  transforms: Parameters<typeof skinHumanBodySurface>[3];
}): number[] {
  const { positions, skinned, skin, joints, transforms } = input;
  const scale = positions.reduce(
    (largest, value) => Math.max(largest, Math.abs(value)),
    1,
  );
  const step = Math.sqrt(Number.EPSILON) * scale;
  const below = skinHumanBodySurface(
    positions.map((value, i) => (i % 3 === 1 ? value - step : value)),
    skin,
    joints,
    transforms,
  );
  return below.map((value, i) => (value - skinned[i]) / step);
}
