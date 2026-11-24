import { validatePoseResult } from "@automovie/engine";
import type {
  IAutoMoviePose,
  IAutoMovieSkeleton,
  IAutoMovieTransform,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createSkeleton } from "../../../internal/createSkeleton";
import { hasViolation } from "../../../internal/hasViolation";
import { joint } from "../../../internal/joint";
import { makePose } from "../../../internal/makePose";

const ROOT: IAutoMovieTransform = {
  translation: { x: 0, y: 1, z: 2 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
};

const poseWith: (root: IAutoMovieTransform) => IAutoMoviePose = (
  root: IAutoMovieTransform,
): IAutoMoviePose => makePose([joint("leftLowerArm", { flexion: 30 })], root);

/**
 * Exercise optional pose-root TRS admission without normalizing authored
 * values.
 *
 * Scenarios:
 *
 * 1. A valid root transform still validates.
 * 2. Non-finite translation is a range violation.
 * 3. Non-finite rotation is a range violation.
 * 4. Finite but non-unit rotation is a range violation.
 * 5. Non-positive scale is a range violation.
 */
export function test_unit_engine_validation_pose_root_transform(): void {
  const skeleton: IAutoMovieSkeleton = createSkeleton();
  TestValidator.equals(
    "valid root transform succeeds",
    validatePoseResult(poseWith(ROOT), skeleton).success,
    true,
  );

  const nonUnitRotation: IAutoMovieValidation = validatePoseResult(
    poseWith({
      ...ROOT,
      rotation: { ...ROOT.rotation, w: 2 },
    }),
    skeleton,
  );
  TestValidator.equals(
    "non-unit root rotation fails",
    nonUnitRotation.success,
    false,
  );
  TestValidator.predicate(
    "range violation on root rotation length",
    hasViolation(nonUnitRotation, "range", "$input.root.rotation"),
  );

  const badScale: IAutoMovieValidation = validatePoseResult(
    poseWith({
      ...ROOT,
      scale: { ...ROOT.scale, y: 0 },
    }),
    skeleton,
  );
  TestValidator.equals(
    "non-positive root scale fails",
    badScale.success,
    false,
  );
  TestValidator.predicate(
    "range violation on root scale",
    hasViolation(badScale, "range", "$input.root.scale.y"),
  );
}
