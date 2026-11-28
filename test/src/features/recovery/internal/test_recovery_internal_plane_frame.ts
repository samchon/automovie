import type { AutoMovieVector3Tuple } from "@automovie/interface";
import { AutoMovieRecoveryGeometry } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../../internal/predicates";

/**
 * A finite Recovery frame borrows its origin and bases its right-handed axes on
 * the physical projected reference length.
 *
 * Scenarios:
 *
 * 1. Normal (0, 0, 2) and reference (1, 0, 1): n = z, the reference less its
 *    normal part is (1, 0, 0) = v, and u = x × z = (0, -1, 0).
 * 2. A zero normal and a reference along the normal are refused.
 * 3. Finite extreme references can retain a unit frame, including when the
 *    transverse component itself exceeds binary64 range.
 * 4. The physical threshold admits equality. Nonfinite tuples are refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States origin ownership, handedness, physical projection, extreme finite references and refusals.
 * @evidence contracts/development/testing.md#behavioral-verification Inspects ordinary and extreme frames, origin identity, exact threshold admission and diagnosed nonfinite or degenerate coordinates.
 * @evidence contracts/development/testing.md#independent-expectations Projecting (1,0,1) off z leaves x, so u is negative y. A diagonal parallel component leaves only the z reference. Two orthogonal planar diagonals have a transverse axis of negative z.
 */
export function test_recovery_internal_plane_frame(): void {
  TestValidator.equals(
    "the frame",
    AutoMovieRecoveryGeometry.planeFrame([1, 2, 3], [0, 0, 2], [1, 0, 1]),
    { origin: [1, 2, 3], n: [0, 0, 1], u: [0, -1, 0], v: [1, 0, 0] },
  );
  TestValidator.error("a zero normal", (): unknown =>
    AutoMovieRecoveryGeometry.planeFrame([0, 0, 0], [0, 0, 0], [1, 0, 0]),
  );
  TestValidator.error("a parallel reference", (): unknown =>
    AutoMovieRecoveryGeometry.planeFrame([0, 0, 0], [0, 0, 1], [0, 0, 3]),
  );
  const origin: AutoMovieVector3Tuple = [1, 2, 3];
  const planeFrame = AutoMovieRecoveryGeometry.planeFrame;
  const limit = Number.MAX_VALUE;
  const diagonal = Math.SQRT1_2;
  const resolved = planeFrame(origin, [1, 1, 0], [limit, limit, 1]);
  TestValidator.predicate("origin stays borrowed", resolved.origin === origin);
  TestValidator.equals(
    "large parallel component leaves positive z",
    resolved.v,
    [0, 0, 1],
  );
  TestValidator.predicate(
    "z crossed with the diagonal gives negative x and positive y",
    nclose(resolved.u[0], -diagonal) &&
      nclose(resolved.u[1], diagonal) &&
      nclose(resolved.u[2], 0),
  );
  const overflow = planeFrame(origin, [1, -1, 0], [limit, limit, 0]);
  TestValidator.equals(
    "overflowing transverse length preserves negative z axis",
    overflow.u,
    [0, 0, -1],
  );
  TestValidator.predicate(
    "the other in-plane axis keeps the reference direction",
    nclose(overflow.v[0], diagonal) &&
      nclose(overflow.v[1], diagonal) &&
      nclose(overflow.v[2], 0),
  );
  TestValidator.predicate(
    "a finite extreme parallel reference has no transverse axis",
    throwsError(
      () => planeFrame(origin, [1, 1, 0], [limit, limit, 0]),
      "parallel",
    ),
  );
  TestValidator.equals(
    "exact physical cutoff is admitted",
    planeFrame(origin, [0, 0, 1], [1e-6, 0, 1]).v,
    [1, 0, 0],
  );
  TestValidator.predicate(
    "a projected reference below the physical cutoff is refused",
    throwsError(() => planeFrame(origin, [0, 0, 1], [5e-7, 0, 1]), "parallel"),
  );
  const malformed: [
    AutoMovieVector3Tuple,
    AutoMovieVector3Tuple,
    AutoMovieVector3Tuple,
  ][] = [
    [
      [NaN, 0, 0],
      [0, 0, 1],
      [1, 0, 0],
    ],
    [origin, [0, 0, NaN], [1, 0, 0]],
    [origin, [0, 0, 1], [Infinity, 0, 0]],
  ];
  for (const [point, normal, reference] of malformed)
    TestValidator.predicate(
      "nonfinite coordinates cannot publish a frame",
      throwsError(
        () => planeFrame(point, normal, reference),
        "finite Cartesian",
      ),
    );
}
