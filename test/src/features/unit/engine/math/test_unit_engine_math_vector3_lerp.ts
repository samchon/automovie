import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { equalGeometryTestValues } from "../../../internal/equalGeometryTestValues";
import { vclose } from "../../../internal/vclose";

/**
 * Component-wise vector interpolation retains both endpoints and the midpoint of the original integer-coordinate segment with zero numeric tolerance.
 *
 * Scenarios:
 *
 * 1. Raw segment(0,0,0)→(2,4,6) at T=0 returns the start exactly.
 * 2. T=1 returns the end vector exactly.
 * 3. T=0.5 returns the midpoint (1,2,3).
 * 4. Prepared segment(1,2,3)→(5,-2,7) gives literal quarter/half points and
 *    extrapolates at1.5/-0.5 in any query order, without endpoint clipping.
 * 5. Prepared endpoints are numeric snapshots while raw/new preparation
 *    reads edited inputs. Editing an issued point cannot poison or be repaired
 *    by a later same-share result; both results remain caller-owned.
 */
export function test_unit_engine_math_vector3_lerp(): void {
  const a: IAutoMovieVector3 = Vector3.create(0, 0, 0);
  const b: IAutoMovieVector3 = Vector3.create(2, 4, 6);
  TestValidator.predicate(
    "lerp at 0",
    equalGeometryTestValues(Vector3.lerp(a, b, 0), a),
  );
  TestValidator.predicate(
    "lerp at 1",
    equalGeometryTestValues(Vector3.lerp(a, b, 1), b),
  );
  TestValidator.predicate(
    "lerp midpoint",
    equalGeometryTestValues(Vector3.lerp(a, b, 0.5), {
      x: 1,
      y: 2,
      z: 3,
    }),
  );
  const from: IAutoMovieVector3 = { x: 1, y: 2, z: 3 };
  const to: IAutoMovieVector3 = { x: 5, y: -2, z: 7 };
  const read: ReturnType<typeof Vector3.prepareLerp> = Vector3.prepareLerp(from, to);
  for (const [share, expected] of [
    [1.5, { x: 7, y: -4, z: 9 }], [0.25, { x: 2, y: 1, z: 4 }],
    [-0.5, { x: -1, y: 4, z: 1 }], [0.5, { x: 3, y: 0, z: 5 }], [0.25, { x: 2, y: 1, z: 4 }],
  ] as const)
    TestValidator.predicate(`prepared affine line keeps its literal point at${share}`, vclose(read(share), expected, 0));
  from.x = 99;
  from.z = -11;
  to.y = 88;
  to.z = 12;
  TestValidator.predicate("explicit segment retains copied endpoints while raw/new readers observe edits",
    vclose(read(0.25), { x: 2, y: 1, z: 4 }, 0) &&
    vclose(Vector3.lerp(from, to, 0.25), { x: 75.5, y: 23.5, z: -5.25 }, 0) &&
    vclose(Vector3.prepareLerp(from, to)(0.25), { x: 75.5, y: 23.5, z: -5.25 }, 0));
  const earlier: IAutoMovieVector3 = read(0.25);
  earlier.x = 123;
  const replay: IAutoMovieVector3 = read(0.25);
  TestValidator.predicate("prepared interpolation issues independent points and cannot repair caller poison",
    replay !== earlier && vclose(replay, { x: 2, y: 1, z: 4 }, 0) && Object.is(earlier.x, 123));
}
