import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { equalGeometryTestValues } from "../internal/equalGeometryTestValues";
import { vclose } from "../internal/vclose";

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
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs raw lerp and fixed-segment preparation at boundaries, interior and extrapolated shares, checks literal points, edits owned endpoints and a returned point, and distinguishes snapshot/live/new-preparation behavior plus output isolation. An incorrect blend, clipped progress, stale current source or borrowed output fails.
 * @evidence contracts/development/testing.md#independent-expectations The affine definition a+(b-a)*t gives the original endpoints/midpoint. The second segment's delta(4,-4,4) gives quarter(2,1,4), half(3,0,5),1.5→(7,-4,9) and-0.5→(-1,4,1). Edited endpoints(99,2,-11)→(5,88,12) give quarter(75.5,23.5,-5.25). All operations are exactly representable binary fractions here, so the original zero tolerance remains; no cold output supplies a prepared expectation.
 * @evidence contracts/development/testing.md#distinguishing-cases Preserves start/end/midpoint and adds positive/negative extrapolation, arbitrary/repeated shares, numeric endpoint snapshots versus live inputs/new preparation, previous-output poison and fresh results. Cancellation/nonfinite arithmetic and motion easing/clip time retain their existing owners.
 * @evidence contracts/development/testing.md#execution-ownership The discoverable named math entry executes portable runtime source synchronously without a host process, browser, GPU, native build, installed consumer or dynamic case registration.
 * @evidence contracts/development/common.md#meaningful-documentation Names five scenarios with the original and prepared segments, literal affine/extrapolated values, zero-tolerance arithmetic and snapshot/input/output ownership.
 */
export function test_math_vector3_lerp(): void {
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
