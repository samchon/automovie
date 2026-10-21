import type { IAutoMovieRecoveryMapPose } from "../structures/image/IAutoMovieRecoveryMapPose";
import { stepRecoveryRelativePose } from "./stepRecoveryRelativePose";

/**
 * Apply the map seed's left rotation and current-radius sphere chart.
 * Its raw translation coefficients define r*normalize(t+Bz), with r=norm(t)
 * held constant at this base. Initial poses and points are not rescaled.
 *
 * @evidence contracts/common.md#principled-implementation The existing relative updater supplies left SO3 and normalize(t+Bz). Evaluating the equivalent t+r*(normalize(t+Bz)-t/r) preserves the represented zero translation step while the exact-real chart has value t, differential P_t B and constant radius r.
 * @evidence contracts/common.md#clear-and-simple-design A map-specific owner preserves the admitted baseline radius; calibrated relative Sampson refinement retains its scale-invariant normalized update.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No initial geometry normalization, new gauge tolerance, component clamp or previous-pose fallback supplies a step. Invalid radius retains its original numerical-refusal prefix; a new nonrepresentable anchored result propagates as a core error. Actual trial gates remain with the map owner.
 * @evidence contracts/common.md#meaningful-documentation States raw coefficient coordinates, fixed current radius, original zero value and the distinction between exact-real radius preservation and Float gauge checks.
 * @evidence contracts/performance.md#efficient-algorithms One existing pose update plus a three-coordinate radius and anchored evaluation cost constant work. Map owners prepay256 extra visits before each actual seed update, covering radius validation, all indexed reads/stores and fixed dispatch.
 * @evidence contracts/performance.md#reuse-equivalent-work The shared updater constructs one rotation and normalized trial; one base radius serves all three output coordinates.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The shared updater's detached pose is changed only while exclusively owned and then transfers. Fixed radius/loop locals fit the separately admitted64-slot chart envelope; borrowed pose, basis and increment are unchanged.
 */
export function stepRecoveryMapSeedPose(
  pose: IAutoMovieRecoveryMapPose,
  tangent: readonly (readonly [number, number, number])[],
  step: readonly number[],
): IAutoMovieRecoveryMapPose {
  const radius: number = Math.hypot(...pose.translation);
  if (!Number.isFinite(radius) || Math.abs(radius - 1) > 1e-10)
    throw new Error("camera-map: unit seed translation required");
  const result: IAutoMovieRecoveryMapPose = stepRecoveryRelativePose(
    pose,
    tangent,
    step,
  );
  for (let axis: number = 0; axis < 3; axis++) {
    result.translation[axis] =
      pose.translation[axis]! +
      radius * (result.translation[axis]! - pose.translation[axis]! / radius);
    if (!Number.isFinite(result.translation[axis]))
      throw new Error("camera-map-chart: nonrepresentable seed update");
  }
  return result;
}
