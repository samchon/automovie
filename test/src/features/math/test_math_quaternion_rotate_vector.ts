import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { Quaternion } from "../../../../packages/engine/src/math/Quaternion";
import { vclose } from "../internal/predicates";

/**
 * `Quaternion.rotateVector` applies a rotation to a vector. The _direction_ it
 * turns is the convention the entire kinematics layer depends on, so it is
 * pinned against known right-handed results.
 *
 * Scenarios:
 *
 * 1. A +90° turn about +Y sends +X to −Z (the right-hand rule).
 * 2. A +180° turn about +Y sends +X to −X.
 * 3. The identity rotation leaves the vector unchanged.
 * 4. Tiny, huge and subnormal nonzero +Y axes give the same quarter-turn.
 *
 * @evidence contracts/testing.md#behavioral-verification Composes axis-angle quaternions with rotateVector and checks cardinal directions, catching incorrect handedness and axis-magnitude normalization failure.
 * @evidence contracts/testing.md#independent-expectations The right-hand rule sends +X to -Z for a +Y quarter-turn and to -X for a half-turn; positive axis scaling cannot change either direction.
 * @evidence contracts/testing.md#distinguishing-cases Covers quarter-turn, half-turn, identity and tiny/huge/subnormal nonzero axis magnitudes; quaternion-normalize tests own arbitrary four-component scaling.
 * @evidence contracts/testing.md#execution-ownership This exported math entry uses portable quaternion source directly, with no renderer, GPU, process or dynamically registered consumer.
 */
export function test_math_quaternion_rotate_vector(): void {
  const X: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };
  const qY90: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: 0, y: 1, z: 0 },
    90,
  );
  const qY180: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: 0, y: 1, z: 0 },
    180,
  );

  TestValidator.predicate(
    "X by Y90 → -Z",
    vclose(Quaternion.rotateVector(qY90, X), { x: 0, y: 0, z: -1 }),
  );
  TestValidator.predicate(
    "X by Y180 → -X",
    vclose(Quaternion.rotateVector(qY180, X), { x: -1, y: 0, z: 0 }),
  );
  TestValidator.predicate(
    "identity leaves vector",
    vclose(Quaternion.rotateVector(Quaternion.identity(), X), X),
  );
  for (const magnitude of [1e-300, 1e300, Number.MIN_VALUE])
    TestValidator.predicate(
      "axis magnitude cannot change a quarter-turn direction",
      vclose(
        Quaternion.rotateVector(
          Quaternion.fromAxisAngle({ x: 0, y: magnitude, z: 0 }, 90),
          X,
        ),
        { x: 0, y: 0, z: -1 },
      ),
    );
}
