import { TestValidator } from "@nestia/e2e";

import { jointToQuaternion } from "../../../../packages/engine/src/kinematics/jointToQuaternion";
import { type IAutoMovieQuaternion } from "@automovie/interface";
import { qclose } from "../internal/qclose";

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
 *
 * @evidence contracts/testing.md#behavioral-verification Converts undriven/zero joints and separate 90-degree flexion, abduction and twist, checking rotation against literal Cartesian quaternions; an axis swap or failure to preserve identity fails.
 * @evidence contracts/testing.md#independent-expectations Identity is (0,0,0,1); a quarter-turn has half-angle sine/cosine sqrt(1/2) on exactly the declared X/Z/Y axis. Expected rotations do not call the product quaternion constructor or composition owner.
 * @evidence contracts/testing.md#distinguishing-cases Keeps null and explicit-zero triples plus each individually driven default axis; mixed order, custom bases and malformed inputs belong to neighboring entries.
 * @evidence contracts/testing.md#execution-ownership The runner discovers this exported CPU test and it directly invokes jointToQuaternion source using finite conventional angles; no renderer or clinical measurement protocol is executed.
 */
export function test_kinematics_joint_axes(): void {
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
