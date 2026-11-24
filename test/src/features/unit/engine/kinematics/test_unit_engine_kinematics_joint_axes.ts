import { jointToQuaternion } from "@automovie/engine";
import { type IAutoMovieQuaternion } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { qclose } from "../../../internal/qclose";

/**
 * `jointToQuaternion` turns the semantic angles an LLM emits (flexion /
 * abduction / twist) into a bone-local quaternion, mapping each clinical axis
 * to its documented local rotation axis. Getting this mapping right is what
 * makes a generated pose render in the direction it was meant to.
 *
 * Scenarios:
 *
 * 1. No articulation (all axes null, or all zero) yields the identity.
 * 2. Flexion rotates about local X.
 * 3. Abduction rotates about local Z.
 * 4. Twist rotates about local Y.
 */
export function test_unit_engine_kinematics_joint_axes(): void {
  const id: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
  TestValidator.predicate(
    "null axes → identity",
    qclose(
      jointToQuaternion({ flexion: null, abduction: null, twist: null }),
      id,
    ),
  );
  TestValidator.predicate(
    "zero axes → identity",
    qclose(jointToQuaternion({ flexion: 0, abduction: 0, twist: 0 }), id),
  );

  TestValidator.predicate(
    "flexion about X",
    qclose(jointToQuaternion({ flexion: 90, abduction: null, twist: null }), {
      x: Math.SQRT1_2,
      y: 0,
      z: 0,
      w: Math.SQRT1_2,
    }),
  );
  TestValidator.predicate(
    "abduction about Z",
    qclose(jointToQuaternion({ flexion: null, abduction: 90, twist: null }), {
      x: 0,
      y: 0,
      z: Math.SQRT1_2,
      w: Math.SQRT1_2,
    }),
  );
  TestValidator.predicate(
    "twist about Y",
    qclose(jointToQuaternion({ flexion: null, abduction: null, twist: 90 }), {
      x: 0,
      y: Math.SQRT1_2,
      z: 0,
      w: Math.SQRT1_2,
    }),
  );
}
