import {
  IAutoMoviePose,
  IAutoMovieSkeleton,
  IAutoMovieValidation,
} from "@automovie/interface";

import { validatePose } from "./validatePose";

/**
 * Expose validatePose's collector as a finished success/failure report for the supplied rig.
 *
 * @evidence contracts/common.md#principled-implementation Expose validatePose's collector as a finished success/failure report for the supplied rig.
 * @evidence contracts/common.md#clear-and-simple-design The wrapper keeps pose rules with validatePose and severity conversion with the collector.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It neither clamps joint angles nor resolves a rendered pose.
 * @evidence contracts/common.md#meaningful-documentation Inputs are borrowed and returned diagnostics identify the actual pose faults.
 * @evidence contracts/performance.md#efficient-algorithms Joint validation plus V-row partitioning remain the owning operation's cost.
 * @evidence contracts/performance.md#reuse-equivalent-work The existing pose checker is called directly, preserving the same constraint decisions.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned report owns arrays/rows; no pose history or animation resource persists.
 */
export const validatePoseResult: (pose: IAutoMoviePose, skeleton: IAutoMovieSkeleton) => IAutoMovieValidation = (
  pose: IAutoMoviePose,
  skeleton: IAutoMovieSkeleton,
): IAutoMovieValidation => validatePose({ pose, skeleton }).toValidation();
