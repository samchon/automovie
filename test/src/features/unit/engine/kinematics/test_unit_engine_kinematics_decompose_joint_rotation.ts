import { decomposeJointRotation } from "@automovie/engine";
import type { IAutoMovieResolvedJointAngles } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Rounding of one `atan2` and `asin` extraction. */
const ROUNDING: number = 1e-9;

/** Sine and cosine of 45 degrees, the half of a quarter turn. */
const HALF_ROOT_TWO: number = Math.SQRT1_2;

/**
 * `decomposeJointRotation` reads clinical angles from a rotation about the
 * default axes (flexion +X, twist +Y, abduction +Z).
 *
 * Scenarios:
 *
 * 1. A quarter turn about +X is flexion 90, abduction 0, twist 0.
 * 2. A quarter turn about +Y is twist 90 with the others at 0.
 * 3. The identity is all zeros.
 */
export function test_unit_engine_kinematics_decompose_joint_rotation(): void {
  const flexed: IAutoMovieResolvedJointAngles = decomposeJointRotation({
    x: HALF_ROOT_TWO,
    y: 0,
    z: 0,
    w: HALF_ROOT_TWO,
  });
  TestValidator.predicate(
    "flexion",
    nclose(flexed.flexion, 90, ROUNDING) &&
      nclose(flexed.abduction, 0, ROUNDING) &&
      nclose(flexed.twist, 0, ROUNDING),
  );
  const twisted: IAutoMovieResolvedJointAngles = decomposeJointRotation({
    x: 0,
    y: HALF_ROOT_TWO,
    z: 0,
    w: HALF_ROOT_TWO,
  });
  TestValidator.predicate(
    "twist",
    nclose(twisted.twist, 90, ROUNDING) &&
      nclose(twisted.flexion, 0, ROUNDING) &&
      nclose(twisted.abduction, 0, ROUNDING),
  );
  const rest: IAutoMovieResolvedJointAngles = decomposeJointRotation({
    x: 0,
    y: 0,
    z: 0,
    w: 1,
  });
  TestValidator.predicate(
    "the identity",
    nclose(rest.flexion, 0, ROUNDING) &&
      nclose(rest.abduction, 0, ROUNDING) &&
      nclose(rest.twist, 0, ROUNDING),
  );
}
