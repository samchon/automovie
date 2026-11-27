import type { IAutoMovieQuaternion } from "@automovie/interface";

import { AutoMovieEngineQuaternion } from "../../math/AutoMovieEngineQuaternion";
import { AutoMovieEngineRomTolerance } from "../../rom/AutoMovieEngineRomTolerance";

/*
 * Add the reference pose's geodesic distance bound to an existing hinge branch
 * bound.
 * Parameter geometric: The branch's nonnegative lower bound from its other score
 * terms.
 * Parameter upper: The upper joint rotation on the branch.
 * Parameter reference: The reference upper rotation, or null for a lower-only
 * reference.
 * Parameter lower: The lower joint's constant distance to its reference, in
 * degrees.
 * Parameter weight: The nonnegative reference weight used by the candidate score.
 * Returns: A bound in the same units and arithmetic order as the branch score.
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
        (AutoMovieEngineQuaternion.angleAfterNormalize(upper(middle), reference) * 180) /
        Math.PI;
      last = middle;
    }
    const minimum: number = Math.max(
      0,
      distance - (high - low) / 2 - AutoMovieEngineRomTolerance,
    );
    return geometric(low, high) + weight * (minimum + lower);
  };
}

/*
 * Lower bound over a closed swivel interval in degrees.
 */
type IntervalBound = (low: number, high: number) => number;

/*
 * The branch's upper orientation at a swivel angle in degrees.
 */
type UpperRotation = (swivel: number) => IAutoMovieQuaternion;

/*
 * A missing upper reference gives zero upper reference cost.
 */
type Reference = IAutoMovieQuaternion | null;
