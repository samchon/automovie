import type {
  IAutoMovieBone,
  IAutoMovieSkeleton,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { validatePoseResult } from "../../../../packages/engine/src/validation/validatePoseResult";
import { createSkeleton } from "../internal/createSkeleton";
import { joint } from "../internal/joint";
import { makePose } from "../internal/makePose";

/**
 * Exercise authored per-bone constraint precedence over the engine's default elbow interval.
 *
 * Scenarios:
 * 1. With elbow flexion widened to [0,200], 175 degrees validates although the default interval ends at 150 degrees.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls validatePoseResult after overriding the elbow constraint and requires acceptance, catching use of the default table despite a supplied override.
 * @evidence contracts/testing.md#independent-expectations A non-null authored constraint has precedence, and 175 lies within [0,200]; this admission is no clinical range or rendered posture certification.
 * @evidence contracts/testing.md#distinguishing-cases Owns a widened override while retaining the rest of the rig; pose_rom owns refusal of the same angle under defaults and pose_valid owns ordinary acceptance.
 * @evidence contracts/testing.md#execution-ownership This named portable unit edits caller-owned rig records through the existing factory, without a new Human asset, host or motion sampler.
 */
export function test_validation_pose_override(): void {
  const base: IAutoMovieSkeleton = createSkeleton();
  const skeleton: IAutoMovieSkeleton = {
    ...base,
    bones: base.bones.map(
      (b: IAutoMovieBone): IAutoMovieBone =>
        b.bone === "leftLowerArm"
          ? {
              ...b,
              constraint: {
                flexion: { min: 0, max: 200 },
                abduction: null,
                twist: null,
              },
            }
          : b,
    ),
  };
  const result: IAutoMovieValidation = validatePoseResult(
    makePose([joint("leftLowerArm", { flexion: 175 })]),
    skeleton,
  );
  TestValidator.equals("override widens ROM → valid", result.success, true);
}
