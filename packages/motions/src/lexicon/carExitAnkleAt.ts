import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieMotionInterval } from "../compose/AutoMovieMotionInterval";

/**
 * Samples the car exit's ankle path. The ankle lifts inside, crosses above the
 * sill at the supplied minimum clearance height and lowers outside.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the ordered portions of the ankle flight.
 * @evidence contracts/development/implementation.md#principled-implementation Minimum-jerk interpolation follows the sill waypoint in the horizontal plane and reaches at least the required clearance before traversing.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The path owns only ankle position. The caller keeps contact, orientation and bend.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the admitted waypoints and actual required height without rig-specific corrections.
 * @evidence contracts/development/implementation.md#efficient-algorithms Evaluates a fixed number of scalar curves and vector interpolations.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Both feet sample the same path law with their own waypoints.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only the sampled ankle position escapes the function.
 */
export function carExitAnkleAt(
  start: IAutoMovieVector3,
  sill: IAutoMovieVector3,
  end: IAutoMovieVector3,
  clearanceHeight: number,
  phase: number,
  liftShare: number,
): IAutoMovieVector3 {
  const at: IAutoMovieVector3 =
    phase <= 0.5
      ? Vector3.lerp(
          start,
          sill,
          AutoMovieMotionInterval.progress(liftShare, 0.5, phase),
        )
      : Vector3.lerp(
          sill,
          end,
          AutoMovieMotionInterval.progress(0.5, 1 - liftShare, phase),
        );
  const high: number = Math.max(start.y, end.y, clearanceHeight);
  const height: number =
    phase < 0.5
      ? start.y +
        (high - start.y) * AutoMovieMotionInterval.progress(0, liftShare, phase)
      : end.y +
        (high - end.y) *
          (1 - AutoMovieMotionInterval.progress(1 - liftShare, 1, phase));
  return { ...at, y: height };
}
