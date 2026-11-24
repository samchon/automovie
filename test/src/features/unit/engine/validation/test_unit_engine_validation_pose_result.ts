import { validatePoseResult } from "@automovie/engine";
import type {
  IAutoMovieBone,
  IAutoMoviePose,
  IAutoMovieSkeleton,
  IAutoMovieTransform,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createSkeleton } from "../../../internal/createSkeleton";
import { createValidPose } from "../../../internal/createValidPose";
import { hasViolation } from "../../../internal/hasViolation";
import { joint } from "../../../internal/joint";
import { makePose } from "../../../internal/makePose";

/**
 * `validatePoseResult` admits a pose against its target rig: skeleton identity,
 * bone membership and uniqueness, range of motion and the root transform.
 *
 * Rig: the conventional three-bone test rig with the default elbow interval
 * ending at 150 degrees.
 *
 * Scenarios:
 *
 * 1. The conventional shoulder, elbow and hip pose succeeds.
 * 2. The same pose relabelled to skeleton "skeleton-2" fails with a type finding
 *    at `$input.skeleton`.
 * 3. A joint on `jaw`, which the rig lacks, fails with a type finding on `.bone`;
 *    `leftLowerArm` listed twice (30 and 60 degrees) fails with a type finding
 *    on `.bone`.
 * 4. Elbow flexion 175 exceeds the default 150 and fails with a rom finding on
 *    `.flexion`; with the elbow constraint widened to [0, 200] it validates.
 * 5. A root transform of translation (0, 1, 2), identity rotation and unit scale
 *    succeeds; a rotation with w = 2 fails with a range finding at
 *    `$input.root.rotation`; a scale y of 0 fails with a range finding at
 *    `$input.root.scale.y`.
 */
export function test_unit_engine_validation_pose_result(): void {
  const skeleton: IAutoMovieSkeleton = createSkeleton();
  TestValidator.equals(
    "valid",
    validatePoseResult(createValidPose(), skeleton).success,
    true,
  );

  const relabelled: IAutoMovieValidation = validatePoseResult(
    { ...createValidPose(), skeleton: "skeleton-2" },
    skeleton,
  );
  TestValidator.equals("relabelled fails", relabelled.success, false);
  TestValidator.predicate(
    "skeleton id",
    hasViolation(relabelled, "type", "$input.skeleton"),
  );

  const unknown: IAutoMovieValidation = validatePoseResult(
    makePose([joint("jaw", { flexion: 10 })]),
    skeleton,
  );
  TestValidator.equals("unknown bone fails", unknown.success, false);
  TestValidator.predicate(
    "unknown bone",
    hasViolation(unknown, "type", ".bone"),
  );

  const duplicate: IAutoMovieValidation = validatePoseResult(
    makePose([
      joint("leftLowerArm", { flexion: 30 }),
      joint("leftLowerArm", { flexion: 60 }),
    ]),
    skeleton,
  );
  TestValidator.equals("duplicate fails", duplicate.success, false);
  TestValidator.predicate(
    "duplicate bone",
    hasViolation(duplicate, "type", ".bone"),
  );

  const impossible: IAutoMovieValidation = validatePoseResult(
    makePose([joint("leftLowerArm", { flexion: 175 })]),
    skeleton,
  );
  TestValidator.equals("impossible fails", impossible.success, false);
  TestValidator.predicate(
    "rom flexion",
    hasViolation(impossible, "rom", ".flexion"),
  );
  const widened: IAutoMovieSkeleton = {
    ...skeleton,
    bones: skeleton.bones.map(
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
  TestValidator.equals(
    "override widens",
    validatePoseResult(
      makePose([joint("leftLowerArm", { flexion: 175 })]),
      widened,
    ).success,
    true,
  );

  const root: IAutoMovieTransform = {
    translation: { x: 0, y: 1, z: 2 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  };
  const rooted = (transform: IAutoMovieTransform): IAutoMoviePose =>
    makePose([joint("leftLowerArm", { flexion: 30 })], transform);
  TestValidator.equals(
    "valid root",
    validatePoseResult(rooted(root), skeleton).success,
    true,
  );
  const turned: IAutoMovieValidation = validatePoseResult(
    rooted({ ...root, rotation: { ...root.rotation, w: 2 } }),
    skeleton,
  );
  TestValidator.equals("non-unit rotation fails", turned.success, false);
  TestValidator.predicate(
    "rotation length",
    hasViolation(turned, "range", "$input.root.rotation"),
  );
  const flat: IAutoMovieValidation = validatePoseResult(
    rooted({ ...root, scale: { ...root.scale, y: 0 } }),
    skeleton,
  );
  TestValidator.equals("zero scale fails", flat.success, false);
  TestValidator.predicate(
    "scale y",
    hasViolation(flat, "range", "$input.root.scale.y"),
  );
}
