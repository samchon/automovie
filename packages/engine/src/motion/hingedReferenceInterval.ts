import type { IAutoMovieQuaternion } from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { ROM_TOLERANCE } from "../rom/constants/ROM_TOLERANCE";

/** Lower bound over a closed swivel interval in degrees. */
type IntervalBound = (low: number, high: number) => number;

/** The branch's upper orientation at a swivel angle in degrees. */
type UpperRotation = (swivel: number) => IAutoMovieQuaternion;

/** A missing upper reference gives zero upper reference cost. */
type Reference = IAutoMovieQuaternion | null;

/**
 * Add the reference pose's geodesic distance bound to an existing hinge branch bound.
 *
 * @param geometric The branch's nonnegative lower bound from its other score terms.
 * @param upper The upper joint rotation on the branch.
 * @param reference The reference upper rotation, or null for a lower-only reference.
 * @param lower The lower joint's constant distance to its reference, in degrees.
 * @param weight The nonnegative reference weight used by the candidate score.
 * @returns A bound in the same units and arithmetic order as the branch score.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Specifies the swivel and distance units, score terms, fixed lower distance, nonnegative weight and closed interval.
 * @evidence contracts/development/implementation.md#principled-implementation The lower rotation is constant on a hinge branch. The upper moves by the swivel difference about one axis, so the triangle inequality bounds its distance by the midpoint distance minus half the width; the existing ROM tolerance covers angular roundoff.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The lower-only case adds its constant once per query, while a referenced upper adds a nonnegative scalar distance bound.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the actual branch and reference with its original positive weight. Neither the candidate rank nor the scored angular distance changes.
 * @evidence contracts/development/implementation.md#efficient-algorithms One upper quaternion evaluation per distinct consecutive midpoint and constant work per bound query; the lower-only case evaluates no upper quaternion.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Intervals shrinking around the same middle have the same branch orientation there; only the half-width changes.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned branch-local function retains two midpoint scalars and its geometric inputs until its owning search ends.
 */
export function hingedReferenceInterval(
  geometric: IntervalBound,
  upper: UpperRotation,
  reference: Reference,
  lower: number,
  weight: number,
): IntervalBound {
  if (reference === null)
    return (low: number, high: number): number => geometric(low, high) + weight * lower;
  let last: number | undefined;
  let distance: number = 0;
  return (low: number, high: number): number => {
    const middle: number = (low + high) / 2;
    if (middle !== last) {
      distance = (Quaternion.angleAfterNormalize(upper(middle), reference) * 180) / Math.PI;
      last = middle;
    }
    const minimum: number = Math.max(0, distance - (high - low) / 2 - ROM_TOLERANCE);
    return geometric(low, high) + weight * (minimum + lower);
  };
}
