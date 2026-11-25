import { stepRecoveryRelativePose } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * `stepRecoveryRelativePose` turns the rotation by the left rotation vector of
 * the step's first three coordinates and moves the unit translation inside the
 * given tangent basis, then renormalizes it.
 *
 * Scenarios:
 *
 * 1. The identity at t = (0, 0, 1), stepped by (0, 0, π/2, 3, 4) over the basis
 *    x and y, turns a quarter about z (rows [0, -1, 0 | 1, 0, 0 | 0, 0, 1]) and
 *    moves t to (3, 4, 1) / √26.
 * 2. A step of other than five coordinates is refused.
 * 3. A step that cancels the translation to zero is refused.
 */
export function test_recovery_internal_step_relative_pose(): void {
  const rotation: number[] = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  const basis: [number, number, number][] = [
    [1, 0, 0],
    [0, 1, 0],
  ];
  const stepped: ReturnType<typeof stepRecoveryRelativePose> =
    stepRecoveryRelativePose(
      { rotation, translation: [0, 0, 1] },
      basis,
      [0, 0, Math.PI / 2, 3, 4],
    );
  const turn: number[] = [0, -1, 0, 1, 0, 0, 0, 0, 1];
  const norm: number = Math.sqrt(26);
  const place: number[] = [3 / norm, 4 / norm, 1 / norm];
  TestValidator.predicate(
    "a quarter turn about z",
    stepped.rotation.every((value: number, at: number): boolean =>
      nclose(value, turn[at]!, 1e-12),
    ),
  );
  TestValidator.predicate(
    "the renormalized translation",
    stepped.translation.every((value: number, at: number): boolean =>
      nclose(value, place[at]!, 1e-12),
    ),
  );
  TestValidator.error("a four-coordinate step", (): unknown =>
    stepRecoveryRelativePose(
      { rotation, translation: [0, 0, 1] },
      basis,
      [0, 0, 1, 0],
    ),
  );
  TestValidator.error("a cancelled translation", (): unknown =>
    stepRecoveryRelativePose(
      { rotation, translation: [1, 0, 0] },
      [
        [-1, 0, 0],
        [0, 1, 0],
      ],
      [0, 0, Math.PI / 2, 1, 0],
    ),
  );
}
