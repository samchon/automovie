import type { IAutoMovieRecoveryMapPose } from "@automovie/interface";
import { AutoMovieRecoveryCameraMap } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * `stepRecoveryMapPose` turns a pose's row-major rotation by the axis-angle of
 * the step's first three coordinates and moves its translation by the last
 * three.
 *
 * Scenarios:
 *
 * 1. The identity at the origin stepped by (0, 0, π/2, 1, 2, 3) turns a quarter
 *    about z: x goes to y and y to -x, so the rows are [0, -1, 0 | 1, 0, 0 | 0,
 *    0, 1]; the translation is (1, 2, 3).
 * 2. A five-coordinate step is refused.
 */
export function test_recovery_internal_step_map_pose(): void {
  const pose: IAutoMovieRecoveryMapPose = {
    rotation: [1, 0, 0, 0, 1, 0, 0, 0, 1],
    translation: [0, 0, 0],
  };
  const stepped: IAutoMovieRecoveryMapPose = AutoMovieRecoveryCameraMap.stepMapPose(pose, [
    0,
    0,
    Math.PI / 2,
    1,
    2,
    3,
  ]);
  const expected: number[] = [0, -1, 0, 1, 0, 0, 0, 0, 1];
  TestValidator.predicate(
    "a quarter turn about z",
    stepped.rotation.every((value: number, at: number): boolean =>
      nclose(value, expected[at]!, 1e-12),
    ),
  );
  TestValidator.equals("the translation", stepped.translation, [1, 2, 3]);
  TestValidator.error("a five-coordinate step", (): unknown =>
    AutoMovieRecoveryCameraMap.stepMapPose(pose, [0, 0, 0, 0, 0]),
  );
}
