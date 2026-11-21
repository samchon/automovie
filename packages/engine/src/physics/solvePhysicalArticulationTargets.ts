import type { IAutoMovieSolvePhysicalArticulationTargets } from "@automovie/interface";

import { solvePhysicalTargetForest } from "./solvePhysicalTargetForest";

/**
 * Solve a bounded metre residual for one admitted articulation with fixed
 * pivots and projected joint ranges. The caller supplies the pose and row
 * callbacks in its own bone names.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the one-profile boundary, fixed pivots, caller frames and metre residual.
 * @evidence contracts/development/implementation.md#principled-implementation Sends the profile's exact joints, segments and row callbacks through the shared bounded numerical solver.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The facade maps the original profile to the shared topology once and returns the established result fields.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The original profile, inputs and controls flow into the same projected update and validation as the shared owner.
 * @evidence contracts/development/implementation.md#efficient-algorithms Borrows the supplied profile and its arrays. Numerical work is bounded by the shared solver.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the projected numerical solver between one articulation and coupled participants.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Keeps the input and intermediate topology wrapper only during the call.
 */
export function solvePhysicalArticulationTargets(
  input: IAutoMovieSolvePhysicalArticulationTargets.IInput,
): IAutoMovieSolvePhysicalArticulationTargets.IResult {
  const { targets, residual } = solvePhysicalTargetForest({
    bones: input.bones,
    iterations: input.iterations,
    tolerance: input.tolerance,
    measure: input.measure,
    linearize: input.linearize,
    targets: input.targets,
    segments: input.profile.segments,
    joints: input.profile.joints,
  });
  return { targets, residual };
}
