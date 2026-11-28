import { AutoMovieEngineKinematics } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { qclose } from "../../internal/qclose";

/** Rounding of one normalization and half-angle trigonometry. */
const ROUNDING: number = 1e-12;

/** Half of the square root of two, the sine and cosine of 45 degrees. */
const HALF_ROOT_TWO: number = Math.SQRT1_2;

/**
 * `aimRotation` is the shortest rotation taking one direction onto another.
 *
 * Scenarios:
 *
 * 1. +X onto +Y is a quarter turn about +Z: (0, 0, sin 45, cos 45).
 * 2. A direction onto itself is the identity, and lengths do not matter.
 * 3. +X onto -X is a half turn about a perpendicular axis, here +Z.
 * 4. The prepared form answers the same as the direct one.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Covers the shortest quarter turn, parallel identity, antiparallel half turn and prepared equivalence.
 * @evidence contracts/development/testing.md#behavioral-verification Calls aimRotation on concrete directions and reads prepareAimRotation with the same target direction.
 * @evidence contracts/development/testing.md#independent-expectations The +X to +Y turn is 90 degrees about +Z. Equal directions need zero angle, and +X to -X needs 180 degrees about a perpendicular axis. Analytic half-angle components distinguish all three.
 */
export function test_engine_kinematics_aim_rotation(): void {
  TestValidator.predicate(
    "a quarter turn",
    qclose(
      AutoMovieEngineKinematics.aimRotation(
        { x: 1, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
      ),
      { x: 0, y: 0, z: HALF_ROOT_TWO, w: HALF_ROOT_TWO },
      ROUNDING,
    ),
  );
  TestValidator.predicate(
    "the identity",
    qclose(
      AutoMovieEngineKinematics.aimRotation(
        { x: 0, y: 3, z: 0 },
        { x: 0, y: 0.5, z: 0 },
      ),
      { x: 0, y: 0, z: 0, w: 1 },
      ROUNDING,
    ),
  );
  TestValidator.predicate(
    "a half turn",
    qclose(
      AutoMovieEngineKinematics.aimRotation(
        { x: 1, y: 0, z: 0 },
        { x: -1, y: 0, z: 0 },
      ),
      { x: 0, y: 0, z: 1, w: 0 },
      ROUNDING,
    ),
  );
  TestValidator.predicate(
    "the prepared form",
    qclose(
      AutoMovieEngineKinematics.prepareAimRotation({ x: 1, y: 0, z: 0 })(
        { x: 0, y: 1, z: 0 },
      ),
      { x: 0, y: 0, z: HALF_ROOT_TWO, w: HALF_ROOT_TWO },
      ROUNDING,
    ),
  );
}
