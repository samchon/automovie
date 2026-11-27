import { AutoMovieEngineBernsteinAlgebra64 as B } from "@automovie/engine";
import type { AutoMovieVector3Tuple } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../../internal/predicates";

/**
 * `AutoMovieEngineBernsteinAlgebra64` is Bernstein coefficient algebra: evaluation,
 * differentiation, degree elevation, product, sum and scaling, each equal to
 * the algebraic polynomial it stands for.
 *
 * Scenarios:
 *
 * 1. `choose`: C(5,2) = 10, C(6,3) = 20, C(4,0) = C(4,4) = 1.
 * 2. `scalar`: [7] is 7 everywhere; [1,3] is 1 + 2t, 1.5 at 0.25; [0,1,0] is
 *    2t(1-t), 0.5 at 0.5; [0,0,0,1] is t^3, 0.125 at 0.5; [0,0,0,0,1] is t^4,
 *    0.0625 at 0.5; the ends return the end coefficients.
 * 3. `value`: from (0,0,0) to (2,4,6) the midpoint is (1,2,3); the ends are copies
 *    of the end points, not the same objects.
 * 4. `tangent` of the quadratic (0,0,0), (2,0,0), (2,2,0) is 2 x differences,
 *    (4,0,0) and (0,4,0), and with chart scale 0.5 it is (2,0,0), (0,2,0).
 *    `dScalar` of [1,3,2] is [4,-2]; of a constant it is [0].
 * 5. `elevateScalar` of [1,3] to degree 2 is [1,2,3]; a lower degree is refused;
 *    `elevate` of (0,0,0)-(2,4,6) to degree 2 adds the midpoint (1,2,3).
 * 6. `product` of [1,3] (1 + 2t) and [2,2] (2) is [2,4,6]; `productV` of [1,3] and
 *    the constant vector (1,0,0) twice is (1,0,0), (2,0,0), (3,0,0).
 * 7. `add` of (0,0,0)-(2,0,0) and 2 x [(0,0,0), (1,0,0), (0,0,0)] is (0,0,0),
 *    (3,0,0), (2,0,0); `addS` of [0,2] and [0,1,0] is [0,2,2]; `scale` of
 *    (1,2,3) by 2 is (2,4,6).
 */
export function test_engine_geometry_bernstein_algebra(): void {
  const p = (x: number, y: number, z: number): AutoMovieVector3Tuple => [
    x,
    y,
    z,
  ];

  // 1.
  TestValidator.equals("C(5,2)", B.choose(5, 2), 10);
  TestValidator.equals("C(6,3)", B.choose(6, 3), 20);
  TestValidator.equals("C(4,0)", B.choose(4, 0), 1);
  TestValidator.equals("C(4,4)", B.choose(4, 4), 1);

  // 2.
  TestValidator.equals("constant", B.scalar([7], 0.3), 7);
  TestValidator.predicate("linear", nclose(B.scalar([1, 3], 0.25), 1.5, 1e-12));
  TestValidator.predicate(
    "quadratic",
    nclose(B.scalar([0, 1, 0], 0.5), 0.5, 1e-12),
  );
  TestValidator.predicate(
    "cubic",
    nclose(B.scalar([0, 0, 0, 1], 0.5), 0.125, 1e-12),
  );
  TestValidator.predicate(
    "quartic",
    nclose(B.scalar([0, 0, 0, 0, 1], 0.5), 0.0625, 1e-12),
  );
  TestValidator.equals("start", B.scalar([4, 9, 5], 0), 4);
  TestValidator.equals("end", B.scalar([4, 9, 5], 1), 5);

  // 3.
  const line: AutoMovieVector3Tuple[] = [p(0, 0, 0), p(2, 4, 6)];
  TestValidator.equals("midpoint", B.value(line, 0.5), p(1, 2, 3));
  TestValidator.equals("start point", B.value(line, 0), p(0, 0, 0));
  TestValidator.predicate("start is a copy", B.value(line, 0) !== line[0]);
  TestValidator.equals("end point", B.value(line, 1), p(2, 4, 6));

  // 4.
  const quadratic: AutoMovieVector3Tuple[] = [
    p(0, 0, 0),
    p(2, 0, 0),
    p(2, 2, 0),
  ];
  TestValidator.equals("tangent", B.tangent(quadratic), [
    p(4, 0, 0),
    p(0, 4, 0),
  ]);
  TestValidator.equals("scaled tangent", B.tangent(quadratic, 0.5), [
    p(2, 0, 0),
    p(0, 2, 0),
  ]);
  TestValidator.equals("dScalar", B.dScalar([1, 3, 2]), [4, -2]);
  TestValidator.equals("dScalar scaled", B.dScalar([1, 3, 2], 0.5), [2, -1]);
  TestValidator.equals("dScalar constant", B.dScalar([5]), [0]);

  // 5.
  TestValidator.equals("elevate scalar", B.elevateScalar([1, 3], 2), [1, 2, 3]);
  TestValidator.equals("same degree", B.elevateScalar([1, 3], 1), [1, 3]);
  TestValidator.predicate(
    "reduction",
    throwsError(() => B.elevateScalar([1, 2, 3], 1)),
  );
  TestValidator.equals("elevate vector", B.elevate(line, 2), [
    p(0, 0, 0),
    p(1, 2, 3),
    p(2, 4, 6),
  ]);

  // 6.
  TestValidator.equals("product", B.product([1, 3], [2, 2]), [2, 4, 6]);
  TestValidator.equals(
    "product vector",
    B.productV([1, 3], [p(1, 0, 0), p(1, 0, 0)]),
    [p(1, 0, 0), p(2, 0, 0), p(3, 0, 0)],
  );

  // 7.
  TestValidator.equals(
    "add",
    B.add([p(0, 0, 0), p(2, 0, 0)], [p(0, 0, 0), p(1, 0, 0), p(0, 0, 0)], 2),
    [p(0, 0, 0), p(3, 0, 0), p(2, 0, 0)],
  );
  TestValidator.equals("add scalar", B.addS([0, 2], [0, 1, 0]), [0, 2, 2]);
  TestValidator.equals("scale", B.scale([p(1, 2, 3)], 2), [p(2, 4, 6)]);
}
