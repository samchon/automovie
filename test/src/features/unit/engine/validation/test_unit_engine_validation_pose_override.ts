import { validatePoseResult } from "@automovie/engine";
import type {
  IAutoMovieBone,
  IAutoMovieSkeleton,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createSkeleton } from "../../../internal/createSkeleton";
import { joint } from "../../../internal/joint";
import { makePose } from "../../../internal/makePose";

/**
 * Exercise authored per-bone constraint precedence over the engine's default
 * elbow interval.
 *
 * Scenarios:
 *
 * 1. With elbow flexion widened to [0,200], 175 degrees validates although the
 *    default interval ends at 150 degrees.
 */
export function test_unit_engine_validation_pose_override(): void {
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
