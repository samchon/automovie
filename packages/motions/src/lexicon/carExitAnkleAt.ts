import { Vector3, minimumJerk } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

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
          minimumJerk((phase - liftShare) / (0.5 - liftShare)).s,
        )
      : Vector3.lerp(
          sill,
          end,
          minimumJerk((phase - 0.5) / (0.5 - liftShare)).s,
        );
  const high: number = Math.max(start.y, end.y, clearanceHeight);
  const height: number =
    phase < 0.5
      ? start.y + (high - start.y) * minimumJerk(phase / liftShare).s
      : end.y + (high - end.y) * minimumJerk((1 - phase) / liftShare).s;
  return { ...at, y: height };
}
