import { jointToQuaternion } from "@automovie/engine";
import { type IAutoMovieQuaternion } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { qclose } from "../../../internal/qclose";
import { qunit } from "../../../internal/qunit";

/**
 * When more than one axis is articulated, `jointToQuaternion` composes them in
 * the default proximal order (twist ∘ abduction ∘ flexion), and this test's
 * product remains a unit quaternion within its numerical tolerance. Order matters because
 * quaternion multiplication does not commute.
 *
 * Scenario: a joint with flexion 90° and twist 90° must equal multiplying the
 * twist quaternion onto the flexion quaternion in that order, and the combined
 * rotation must remain unit-norm.
 */
export function test_unit_engine_kinematics_joint_compose(): void {
  const composed: IAutoMovieQuaternion = jointToQuaternion({
    flexion: 90,
    abduction: null,
    twist: 90,
  });
  // Hamilton Y-quarter-turn times X-quarter-turn: reversing the order flips Z.
  const expected: IAutoMovieQuaternion = { x: 0.5, y: 0.5, z: -0.5, w: 0.5 };
  TestValidator.predicate("twist ∘ flexion order", qclose(composed, expected));
  TestValidator.predicate("composition is unit", qunit(composed));
}
