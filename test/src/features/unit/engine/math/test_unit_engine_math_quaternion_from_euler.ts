import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieEuler,
  IAutoMovieQuaternion,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { qclose, vclose } from "../../../internal/predicates";

/**
 * Intrinsic Euler degrees preserve the declared axis order and right-handed
 * cardinal rotations.
 *
 * Scenarios:
 *
 * 1. The single Y-axis Euler rotation matches `fromAxisAngle`; X90 sends +Y to +Z
 *    and Z90 sends +X to +Y by the right-hand rule.
 * 2. Zero angles are the identity.
 * 3. The `order` composes intrinsically: `XYZ` equals `qx·qy·qz` and `ZYX` equals
 *    qz·qy·qx, so the same angles in different orders differ.
 * 4. All six90/90/90 intrinsic orders have independently derived quaternion
 *    components. Quarter/zero/quarter reads keep current angles and fresh
 *    outputs; owned angle getters are observed in the authored order.
 */
export function test_unit_engine_math_quaternion_from_euler(): void {
  const qX: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: 1, y: 0, z: 0 },
    90,
  );
  const qY: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: 0, y: 1, z: 0 },
    90,
  );
  const qZ: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: 0, y: 0, z: 0 + 1 },
    90,
  );

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
  const s: number = Math.SQRT1_2;
  const orders: ReadonlyArray<
    [IAutoMovieEuler["order"], IAutoMovieQuaternion]
  > = [
    ["XYZ", { x: s, y: 0, z: s, w: 0 }],
    ["YZX", { x: s, y: s, z: 0, w: 0 }],
    ["ZXY", { x: 0, y: s, z: s, w: 0 }],
    ["XZY", { x: 0, y: 0, z: s, w: s }],
    ["YXZ", { x: s, y: 0, z: 0, w: s }],
    ["ZYX", { x: 0, y: s, z: 0, w: s }],
  ];
  for (const [order, expected] of orders) {
    const angles: Parameters<typeof Quaternion.fromEuler>[0] = {
      x: 90,
      y: 90,
      z: 90,
      order,
    };
    const first: IAutoMovieQuaternion = Quaternion.fromEuler(angles);
    TestValidator.predicate(
      `literal three-quarter-turn quaternion at intrinsic${order}`,
      qclose(first, expected, 1e-12),
    );
    angles.x = 0;
    angles.y = 0;
    angles.z = 0;
    TestValidator.predicate(
      "shared fixed axes never retain an earlier angle",
      qclose(Quaternion.fromEuler(angles), { x: 0, y: 0, z: 0, w: 1 }, 1e-12),
    );
    angles.x = 90;
    angles.y = 90;
    angles.z = 90;
    first.w = 999;
    const replay: IAutoMovieQuaternion = Quaternion.fromEuler(angles);
    TestValidator.predicate(
      "each current Euler evaluation owns its issued quaternion",
      replay !== first &&
        qclose(replay, expected, 1e-12) &&
        Object.is(first.w, 999),
    );
  }
  const trace: string[] = [];
  const observed: Parameters<typeof Quaternion.fromEuler>[0] = {
    get order(): "ZXY" {
      trace.push("order");
      return "ZXY";
    },
    get x(): number {
      trace.push("x");
      return 30;
    },
    get y(): number {
      trace.push("y");
      return 0;
    },
    get z(): number {
      trace.push("z");
      return 0;
    },
  };
  TestValidator.predicate(
    "ordered Euler getters still produce the literal current X30 rotation",
    qclose(
      Quaternion.fromEuler(observed),
      {
        x: (Math.sqrt(6) - Math.sqrt(2)) / 4,
        y: 0,
        z: 0,
        w: (Math.sqrt(6) + Math.sqrt(2)) / 4,
      },
      1e-12,
    ),
  );
  TestValidator.equals(
    "angle reads retain the authored intrinsic order",
    trace,
    ["order", "z", "x", "y"],
  );
}
