import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { Matrix4 } from "../../../../packages/engine/src/math/Matrix4";
import { nclose } from "../internal/nclose";
import { qclose } from "../internal/qclose";
import { vclose } from "../internal/vclose";

const roundTrip: (
  title: string,
  t: IAutoMovieVector3,
  r: IAutoMovieQuaternion,
  s: IAutoMovieVector3,
) => void = (
  title: string,
  t: IAutoMovieVector3,
  r: IAutoMovieQuaternion,
  s: IAutoMovieVector3,
): void => {
  const d: {
    position: IAutoMovieVector3;
    rotation: IAutoMovieQuaternion;
    scale: IAutoMovieVector3;
  } = Matrix4.decompose(Matrix4.compose(t, r, s));
  TestValidator.predicate(`${title}: position`, vclose(d.position, t));
  TestValidator.predicate(`${title}: scale`, vclose(d.scale, s, 1e-5));
  TestValidator.predicate(`${title}: rotation`, qclose(d.rotation, r, 1e-5));
};

/**
 * Compose/decompose round trips recover authored position, scale and rotation across trace and largest-diagonal extraction branches.
 *
 * Scenarios (each rotation steers the quaternion read down a different branch):
 *
 * 1. Identity rotation → positive-trace branch; with a non-uniform scale and
 *    offset, position and scale are recovered within their predicates.
 * 2. 180° about X → the `r00`-largest branch.
 * 3. 180° about Y → the `r11`-largest branch.
 * 4. 180° about Z → the `r22`-largest branch.
 * 5. 180° about a tilted axis where `r00 > r11` but `r00 ≤ r22` → exercises the
 *    second half of the `r00`-largest test going false (the `&&`
 *    short-circuit).
 *
 * @evidence contracts/testing.md#behavioral-verification Composes and decomposes authored TRS examples, comparing recovered positions/scales and sign-equivalent rotations across the trace and largest-diagonal branches, plus one recovered rotation norm.
 * @evidence contracts/testing.md#independent-expectations The original authored TRS is the round-trip expectation; half-turn Cartesian and tilted unit axes select extraction branches independently. Shared compose/decompose arithmetic can cancel a common error, so this complements the literal matrix-coefficient tests.
 * @evidence contracts/testing.md#distinguishing-cases Identity, X/Y/Z half-turns, a tilted half-turn and a Y quarter-turn cover these extraction choices; collapsed, mirrored and sheared matrices are not certified here.
 * @evidence contracts/testing.md#execution-ownership The named test_resolve_matrix4_decompose entry owns portable synchronous numeric round trips through the actual Matrix4 owner; it makes no visual or clinical correctness claim.
 */
export function test_resolve_matrix4_decompose(): void {
  const one: IAutoMovieVector3 = { x: 1, y: 1, z: 1 };
  roundTrip(
    "identity",
    { x: 1, y: 2, z: 3 },
    { x: 0, y: 0, z: 0, w: 1 },
    { x: 2, y: 3, z: 4 },
  );
  roundTrip("180° X", { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0, w: 0 }, one);
  roundTrip("180° Y", { x: 0, y: 0, z: 0 }, { x: 0, y: 1, z: 0, w: 0 }, one);
  roundTrip("180° Z", { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 1, w: 0 }, one);

  // 5. 180° about a tilted axis n with nz² > nx² > ny² (q = (n, 0))
  const n: IAutoMovieVector3 = {
    x: Math.sqrt(0.3),
    y: Math.sqrt(0.1),
    z: Math.sqrt(0.6),
  };
  roundTrip("180° tilted", { x: 0, y: 0, z: 0 }, { ...n, w: 0 }, one);

  // The additional Y quarter-turn checks recovered quaternion norm.
  const s: number = Math.SQRT1_2;
  const dec: {
    position: IAutoMovieVector3;
    rotation: IAutoMovieQuaternion;
    scale: IAutoMovieVector3;
  } = Matrix4.decompose(
    Matrix4.compose({ x: 0, y: 0, z: 0 }, { x: 0, y: s, z: 0, w: s }, one),
  );
  TestValidator.predicate(
    "90° Y stays unit",
    nclose(
      Math.hypot(
        dec.rotation.x,
        dec.rotation.y,
        dec.rotation.z,
        dec.rotation.w,
      ),
      1,
      1e-6,
    ),
  );
}
