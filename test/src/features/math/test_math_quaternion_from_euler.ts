import { Quaternion } from "@automovie/engine";
import type { IAutoMovieQuaternion } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { qclose, vclose } from "../internal/predicates";

/**
 * Intrinsic Euler degrees preserve the declared axis order and right-handed cardinal rotations.
 *
 * Scenarios:
 *
 * 1. The single Y-axis Euler rotation matches `fromAxisAngle`; X90 sends +Y
 *    to +Z and Z90 sends +X to +Y by the right-hand rule.
 * 2. Zero angles are the identity.
 * 3. The `order` composes intrinsically: `XYZ` equals `qx·qy·qz` and `ZYX` equals
 *    `qz·qy·qx`, so the same angles in different orders differ.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls Euler conversion, axis-angle construction, multiplication and vector rotation; cardinal directions, zero angles and two noncommuting orders catch wrong handedness or axis order while permitting equivalent quaternion signs.
 * @evidence contracts/testing.md#independent-expectations Right-handed quarter-turns send +Y to +Z about X and +X to +Y about Z. Zero angles are neutral; XYZ and ZYX factor order follows the declared intrinsic contract. Product and axis-angle parity reuse other Quaternion operations and can share their defects; they are not independent quaternion component oracles.
 * @evidence contracts/testing.md#distinguishing-cases Preserves single-axis X/Y/Z inputs, zero and XYZ/ZYX noncommutativity. Other Euler orders, malformed inputs and nonunit rotation admission are outside this entry; axis magnitudes are covered by rotate-vector.
 * @evidence contracts/testing.md#execution-ownership The named math entry owns its synchronous assertions and directly calls portable runtime namespaces. It starts no process, browser or GPU, builds no native artifact and registers no cases dynamically.
 */
export function test_math_quaternion_from_euler(): void {
  const qX: IAutoMovieQuaternion = Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 90);
  const qY: IAutoMovieQuaternion = Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 90);
  const qZ: IAutoMovieQuaternion = Quaternion.fromAxisAngle({ x: 0, y: 0, z: 0 + 1 }, 90);

  // 1. single-axis parity + right-handed direction
  TestValidator.predicate(
    "Y90 matches fromAxisAngle",
    qclose(Quaternion.fromEuler({ x: 0, y: 90, z: 0, order: "XYZ" }), qY),
  );
  TestValidator.predicate(
    "X90 sends +Y to +Z",
    vclose(
      Quaternion.rotateVector(
        Quaternion.fromEuler({ x: 90, y: 0, z: 0, order: "XYZ" }),
        { x: 0, y: 1, z: 0 },
      ),
      { x: 0, y: 0, z: 1 },
    ),
  );
  TestValidator.predicate(
    "Z90 sends +X to +Y",
    vclose(
      Quaternion.rotateVector(
        Quaternion.fromEuler({ x: 0, y: 0, z: 90, order: "XYZ" }),
        { x: 1, y: 0, z: 0 },
      ),
      { x: 0, y: 1, z: 0 },
    ),
  );

  // 2. identity
  TestValidator.predicate(
    "zero angles are identity",
    qclose(
      Quaternion.fromEuler({ x: 0, y: 0, z: 0, order: "XYZ" }),
      Quaternion.identity(),
    ),
  );

  // 3. intrinsic order composition (qc0·qc1·qc2), and order matters
  TestValidator.predicate(
    "XYZ composes qx·qy·qz",
    qclose(
      Quaternion.fromEuler({ x: 90, y: 90, z: 90, order: "XYZ" }),
      Quaternion.multiply(qX, Quaternion.multiply(qY, qZ)),
    ),
  );
  TestValidator.predicate(
    "ZYX composes qz·qy·qx",
    qclose(
      Quaternion.fromEuler({ x: 90, y: 90, z: 90, order: "ZYX" }),
      Quaternion.multiply(qZ, Quaternion.multiply(qY, qX)),
    ),
  );
  TestValidator.predicate(
    "order changes the result",
    !qclose(
      Quaternion.fromEuler({ x: 90, y: 90, z: 90, order: "XYZ" }),
      Quaternion.fromEuler({ x: 90, y: 90, z: 90, order: "ZYX" }),
    ),
  );
}
