import { validatePoseResult } from "@automovie/engine";
import type {
  IAutoMoviePose,
  IAutoMovieSkeleton,
  IAutoMovieTransform,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createSkeleton } from "../internal/createSkeleton";
import { hasViolation } from "../internal/hasViolation";
import { joint } from "../internal/joint";
import { makePose } from "../internal/makePose";

const ROOT: IAutoMovieTransform = {
  translation: { x: 0, y: 1, z: 2 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
};

const poseWith: (root: IAutoMovieTransform) => IAutoMoviePose = (
  root: IAutoMovieTransform,
): IAutoMoviePose => makePose([joint("leftLowerArm", { flexion: 30 })], root);

/**
 * Exercise optional pose-root TRS admission without normalizing authored values.
 *
 * Scenarios:
 *
 * 1. A valid root transform still validates.
 * 2. Non-finite translation is a range violation.
 * 3. Non-finite rotation is a range violation.
 * 4. Finite but non-unit rotation is a range violation.
 * 5. Non-positive scale is a range violation.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls validatePoseResult for supported root TRS and four malformed scalar families, requiring each owning translation/rotation/scale range address.
 * @evidence contracts/testing.md#independent-expectations Finite components, unit quaternion norm and strictly positive scale define supported TRS; identity has norm one while w=2 has norm two independently of pose validation.
 * @evidence contracts/testing.md#distinguishing-cases Retains valid root acceptance, NaN translation, infinite rotation, non-unit finite rotation and zero scale; model_part_transform owns part TRS and pose_valid owns a null root.
 * @evidence contracts/testing.md#execution-ownership This named portable unit uses a local pose adapter and existing rig factory without composing world transforms, exporting or starting a renderer.
 */
export function test_validation_pose_root_transform(): void {
  const skeleton: IAutoMovieSkeleton = createSkeleton();
  TestValidator.equals(
    "valid root transform succeeds",
    validatePoseResult(poseWith(ROOT), skeleton).success,
    true,
  );

  const badTranslation: IAutoMovieValidation = validatePoseResult(
    poseWith({
      ...ROOT,
      translation: { ...ROOT.translation, x: Number.NaN },
    }),
    skeleton,
  );
  TestValidator.equals(
    "non-finite root translation fails",
    badTranslation.success,
    false,
  );
  TestValidator.predicate(
    "range violation on root translation",
    hasViolation(badTranslation, "range", "$input.root.translation.x"),
  );

  const badRotation: IAutoMovieValidation = validatePoseResult(
    poseWith({
      ...ROOT,
      rotation: { ...ROOT.rotation, w: Number.POSITIVE_INFINITY },
    }),
    skeleton,
  );
  TestValidator.equals(
    "non-finite root rotation fails",
    badRotation.success,
    false,
  );
  TestValidator.predicate(
    "range violation on root rotation",
    hasViolation(badRotation, "range", "$input.root.rotation.w"),
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
