import { AutoMovieSweepRotation, AutoMovieEngineMath } from "@automovie/engine";
import type { IAutoMovieQuaternion } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/predicates";

/**
 * `quaternionFromAutoMovieBasis` is the unit quaternion of the rotation whose
 * columns are the given axes.
 *
 * Scenarios:
 *
 * 1. The world axes give the identity.
 * 2. A quarter turn about z (x to y, y to -x) gives (0, 0, sqrt(1/2), sqrt(1/2)).
 * 3. A half turn about x (trace -1, the largest-diagonal branch) gives (1, 0, 0,
 *    0).
 * 4. A half turn about (1, -1, 0) ties the x and y diagonal terms. The packed
 *    sweep entry writes (−sqrt(1/2), sqrt(1/2), 0, 0) over its input.
 */
export function test_engine_math_quaternion_from_basis(): void {
  const h: number = Math.SQRT1_2;
  const close = (a: IAutoMovieQuaternion, b: IAutoMovieQuaternion): boolean =>
    nclose(a.x, b.x, 1e-12) &&
    nclose(a.y, b.y, 1e-12) &&
    nclose(a.z, b.z, 1e-12) &&
    nclose(a.w, b.w, 1e-12);
  TestValidator.predicate(
    "identity",
    close(
      AutoMovieEngineMath.quaternionFromBasis(
        { x: 1, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
        { x: 0, y: 0, z: 1 },
      ),
      { x: 0, y: 0, z: 0, w: 1 },
    ),
  );
  TestValidator.predicate(
    "quarter turn",
    close(
      AutoMovieEngineMath.quaternionFromBasis(
        { x: 0, y: 1, z: 0 },
        { x: -1, y: 0, z: 0 },
        { x: 0, y: 0, z: 1 },
      ),
      { x: 0, y: 0, z: h, w: h },
    ),
  );
  TestValidator.predicate(
    "half turn",
    close(
      AutoMovieEngineMath.quaternionFromBasis(
        { x: 1, y: 0, z: 0 },
        { x: 0, y: -1, z: 0 },
        { x: 0, y: 0, z: -1 },
      ),
      { x: 1, y: 0, z: 0, w: 0 },
    ),
  );

  const packed: Float64Array = new Float64Array([
    8, 0, -1, 0, -1, 0, 0, 0, 0, -1,
  ]);
  AutoMovieSweepRotation.fromBasis(packed, 1, 4, 7, packed, 1);
  TestValidator.predicate(
    "packed half turn preserves diagonal tie and overlapping input",
    nclose(packed[1]!, -h, 1e-12) &&
      nclose(packed[2]!, h, 1e-12) &&
      nclose(packed[3]!, 0, 1e-12) &&
      nclose(packed[4]!, 0, 1e-12),
  );
}
