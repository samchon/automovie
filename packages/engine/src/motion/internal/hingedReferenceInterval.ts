import type { IAutoMovieQuaternion } from "@automovie/interface";

import { Quaternion } from "../../math/Quaternion";
import { ROM_TOLERANCE } from "../../rom/constants/ROM_TOLERANCE";

/** Lower bound over a closed swivel interval in degrees. */
type IntervalBound = (low: number, high: number) => number;

/** The branch's upper orientation at a swivel angle in degrees. */
type UpperRotation = (swivel: number) => IAutoMovieQuaternion;

/** A missing upper reference gives zero upper reference cost. */
type Reference = IAutoMovieQuaternion | null;

/**
 * Add the reference pose's geodesic distance bound to an existing hinge branch
 * bound.
 *
 * @param geometric The branch's nonnegative lower bound from its other score
 *   terms.
 * @param upper The upper joint rotation on the branch.
 * @param reference The reference upper rotation, or null for a lower-only
 *   reference.
 * @param lower The lower joint's constant distance to its reference, in
 *   degrees.
 * @param weight The nonnegative reference weight used by the candidate score.
 * @returns A bound in the same units and arithmetic order as the branch score.
 */
export function hingedReferenceInterval(
  geometric: IntervalBound,
  upper: UpperRotation,
  reference: Reference,
  lower: number,
  weight: number,
): IntervalBound {
  if (reference === null)
    return (low: number, high: number): number =>
      geometric(low, high) + weight * lower;
  let last: number | undefined;
  let distance: number = 0;
  return (low: number, high: number): number => {
    const middle: number = (low + high) / 2;
    if (middle !== last) {
      distance =
        (Quaternion.angleAfterNormalize(upper(middle), reference) * 180) /
        Math.PI;
      last = middle;
    }
    const minimum: number = Math.max(
      0,
      distance - (high - low) / 2 - ROM_TOLERANCE,
    );
    return geometric(low, high) + weight * (minimum + lower);
  };
}
