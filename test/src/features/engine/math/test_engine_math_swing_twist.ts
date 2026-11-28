import { AutoMovieEngineMath } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieSwingTwistResult,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/predicates";

/**
 * `swingTwist` splits a rotation into a swing and a twist about an axis.
 *
 * Scenarios:
 *
 * 1. A quarter turn about y with twist axis y is all twist: the swing is the
 *    identity.
 * 2. A half turn about x with twist axis y has no defined twist: `twist` is null
 *    and the result keeps the whole rotation as swing with an identity twist.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Covers a pure twist and the undefined twist of a perpendicular half turn.
 * @evidence contracts/development/testing.md#behavioral-verification Calls decomposeSwingTwist and swingTwistComponent with explicit rotations and a Y twist axis.
 * @evidence contracts/development/testing.md#independent-expectations Rotation around Y leaves no swing. A half turn about X has zero projection and zero scalar in the Y twist quaternion, so the split keeps the original swing and uses an identity fallback.
 */
export function test_engine_math_swing_twist(): void {
  const h: number = Math.SQRT1_2;
  const quarterY: IAutoMovieQuaternion = { x: 0, y: h, z: 0, w: h };
  const split: IAutoMovieSwingTwistResult = AutoMovieEngineMath.decomposeSwingTwist(quarterY, {
    x: 0,
    y: 1,
    z: 0,
  });
  TestValidator.predicate(
    "twist",
    nclose(split.twist.y, h, 1e-12) && nclose(split.twist.w, h, 1e-12),
  );
  TestValidator.predicate(
    "swing",
    nclose(split.swing.w, 1, 1e-12) && nclose(split.swing.x, 0, 1e-12),
  );
  const halfX: IAutoMovieQuaternion = { x: 1, y: 0, z: 0, w: 0 };
  TestValidator.equals(
    "undefined twist",
    AutoMovieEngineMath.swingTwistComponent(halfX, { x: 0, y: 1, z: 0 }),
    null,
  );
  const whole: IAutoMovieSwingTwistResult = AutoMovieEngineMath.decomposeSwingTwist(halfX, {
    x: 0,
    y: 1,
    z: 0,
  });
  TestValidator.equals("swing kept", whole.swing, halfX);
  TestValidator.equals("identity twist", whole.twist, {
    x: 0,
    y: 0,
    z: 0,
    w: 1,
  });
}
