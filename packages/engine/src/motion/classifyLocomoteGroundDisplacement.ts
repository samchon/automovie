import { IAutoMovieVector3 } from "@automovie/interface";

import { LOCOMOTE_GROUND_EPSILON } from "./constants/LOCOMOTE_GROUND_EPSILON";

/**
 * Classify an admitted finite root displacement in metres into no travel, vertical-only travel or ground-plan travel using the shared locomotion epsilon.
 *
 * @evidence contracts/common.md#principled-implementation Compares the full XYZ norm and XZ norm against LOCOMOTE_GROUND_EPSILON; a displacement is vertical-only only after it exceeds the full-distance no-op band.
 * @evidence contracts/common.md#clear-and-simple-design One classification supplies both distances and mutually exclusive no-op/vertical-only decisions to the locomotion owner, keeping its threshold interpretation together.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses the shared metre-scale epsilon for both decisions rather than caller identity or fixture coordinates; finite vector admission remains the invoking locomotion gate's premise.
 * @evidence contracts/common.md#meaningful-documentation States metre coordinates, finite-input premise, strict threshold and mutually exclusive classification meanings.
 * @evidence contracts/performance.md#efficient-algorithms Two fixed-dimensional hypot evaluations and comparisons require constant time and one scalar result object.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Both classification flags reuse the computed full norm; no mutable displacement result is cached across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only two distances and two booleans escape; the input vector and no external resource are retained.
 */
export const classifyLocomoteGroundDisplacement: (
  displacement: IAutoMovieVector3,
) => {
  /** Horizontal XZ displacement length, metres. */ groundDistance: number;
  /** Full XYZ displacement length, metres. */ travelDistance: number;
  /** Full displacement is strictly below the shared epsilon. */ alreadyThere: boolean;
  /** Meaningful full travel with horizontal travel strictly below epsilon. */ verticalOnly: boolean;
} = (
  displacement: IAutoMovieVector3,
): {
  /** Horizontal XZ displacement length, metres. */
  groundDistance: number;

  /** Full XYZ displacement length, metres. */
  travelDistance: number;

  /** Full displacement is strictly below the shared epsilon. */
  alreadyThere: boolean;

  /** Meaningful full travel with horizontal travel strictly below epsilon. */
  verticalOnly: boolean;
} => {
  const groundDistance: number = Math.hypot(displacement.x, displacement.z);
  const travelDistance: number = Math.hypot(
    displacement.x,
    displacement.y,
    displacement.z,
  );
  const alreadyThere: boolean = travelDistance < LOCOMOTE_GROUND_EPSILON;
  return {
    groundDistance,
    travelDistance,
    alreadyThere,
    verticalOnly:
      alreadyThere === false && groundDistance < LOCOMOTE_GROUND_EPSILON,
  };
};
