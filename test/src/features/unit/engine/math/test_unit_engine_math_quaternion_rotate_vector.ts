import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../../internal/predicates";

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
 * 5. Raw q=(0,1,0,1) is not normalized: v=(2,3,5) becomes(8,3,-9). Owned getters
 *    retain the original cross-first then XYZ read order, results stay fresh,
 *    zero q leaves v unchanged and NaN stays nonfinite.
 */
export function test_unit_engine_math_quaternion_rotate_vector(): void {
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
  const trace: string[] = [];
  const q: IAutoMovieQuaternion = {
    get x(): number {
      trace.push("q.x");
      return 0;
    },
    get y(): number {
      trace.push("q.y");
      return 1;
    },
    get z(): number {
      trace.push("q.z");
      return 0;
    },
    get w(): number {
      trace.push("q.w");
      return 1;
    },
  };
  const v: IAutoMovieVector3 = {
    get x(): number {
      trace.push("v.x");
      return 2;
    },
    get y(): number {
      trace.push("v.y");
      return 3;
    },
    get z(): number {
      trace.push("v.z");
      return 5;
    },
  };
  const actual: IAutoMovieVector3 = Quaternion.rotateVector(q, v);
  TestValidator.predicate(
    "raw nonunit quaternion keeps its independently derived distortion",
    vclose(actual, { x: 8, y: 3, z: -9 }, 1e-12),
  );
  TestValidator.equals(
    "raw rotation keeps the original cross-first and XYZ component reads",
    trace,
    [
      "q.y",
      "v.z",
      "q.z",
      "v.y",
      "q.z",
      "v.x",
      "q.x",
      "v.z",
      "q.x",
      "v.y",
      "q.y",
      "v.x",
      "v.x",
      "q.w",
      "q.y",
      "q.z",
      "v.y",
      "q.w",
      "q.z",
      "q.x",
      "v.z",
      "q.w",
      "q.x",
      "q.y",
    ],
  );
  actual.x = 999;
  const replay: IAutoMovieVector3 = Quaternion.rotateVector(q, v);
  TestValidator.predicate(
    "raw vector rotation owns outputs and keeps zero arithmetic",
    replay !== actual &&
      vclose(replay, { x: 8, y: 3, z: -9 }, 1e-12) &&
      Object.is(actual.x, 999) &&
      vclose(
        Quaternion.rotateVector(
          { x: 0, y: 0, z: 0, w: 0 },
          { x: 2, y: 3, z: 5 },
        ),
        { x: 2, y: 3, z: 5 },
        0,
      ),
  );
}
