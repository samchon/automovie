import type { IAutoMovieRecoveryMapPose } from "@automovie/interface";
import { AutoMovieRecoveryCameraMap } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * `stepRecoveryMapSeedPose` takes the relative-pose step on a unit translation
 * and keeps the current radius r = |t|, so a unit seed returns the same
 * translation as the relative step.
 *
 * Scenarios:
 *
 * 1. The identity at t = (0, 0, 1) stepped by (0, 0, pi / 2, 3, 4) over the basis
 *    x and y turns a quarter about z and moves t to (3, 4, 1) / sqrt(26).
 * 2. A translation whose norm is not 1 is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States preservation of the unit seed gauge under a left rotation step.
 * @evidence contracts/development/testing.md#behavioral-verification Updates a unit seed under a quarter turn and then tries a nonunit translation.
 * @evidence contracts/development/testing.md#independent-expectations A quarter turn about z has a fixed exact frame, and the two tangent offsets produce the direction (3, 4, 1)/sqrt(26).
 */
export function test_recovery_internal_step_map_seed_pose(): void {
  const pose: IAutoMovieRecoveryMapPose = {
    rotation: [1, 0, 0, 0, 1, 0, 0, 0, 1],
    translation: [0, 0, 1],
  };
  const basis: [number, number, number][] = [
    [1, 0, 0],
    [0, 1, 0],
  ];
  const stepped: IAutoMovieRecoveryMapPose = AutoMovieRecoveryCameraMap.stepMapSeedPose(
    pose,
    basis,
    [0, 0, Math.PI / 2, 3, 4],
  );
  const norm: number = Math.sqrt(26);
  const place: number[] = [3 / norm, 4 / norm, 1 / norm];
  TestValidator.predicate(
    "the unit translation",
    stepped.translation.every((value: number, at: number): boolean =>
      nclose(value, place[at]!, 1e-12),
    ),
  );
  TestValidator.predicate(
    "the quarter turn",
    nclose(stepped.rotation[1]!, -1, 1e-12) &&
      nclose(stepped.rotation[3]!, 1, 1e-12),
  );
  TestValidator.error("a nonunit translation", (): unknown =>
    AutoMovieRecoveryCameraMap.stepMapSeedPose(
      { ...pose, translation: [0, 0, 2] },
      basis,
      [0, 0, 1, 0, 0],
    ),
  );
}
