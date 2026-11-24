import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { equalGeometryTestValues } from "../../../internal/equalGeometryTestValues";
import { vclose } from "../../../internal/vclose";

/**
 * Cross products retain the right-handed basis convention and reverse sign when
 * operands swap.
 *
 * Scenarios:
 *
 * 1. The three cyclic basis products: X×Y=Z, Y×Z=X, Z×X=Y.
 * 2. Anti-commutativity: reversing the operands negates the result, so Y×X=−Z.
 *    Together these pin both the magnitude and the orientation of the product.
 * 3. The displacement product about(1,2,3) of points(4,6,3) and(1,2,5) is(8,-6,0).
 *    A distinct destination or one aliasing either point or the origin receives
 *    that same result while every other input stays unchanged.
 */
export function test_unit_engine_math_vector3_cross(): void {
  const X: IAutoMovieVector3 = Vector3.create(1, 0, 0);
  const Y: IAutoMovieVector3 = Vector3.create(0, 1, 0);
  const Z: IAutoMovieVector3 = Vector3.create(0, 0, 1);
  TestValidator.predicate(
    "X×Y=Z",
    equalGeometryTestValues(Vector3.cross(X, Y), Z),
  );
  TestValidator.predicate(
    "Y×Z=X",
    equalGeometryTestValues(Vector3.cross(Y, Z), X),
  );
  TestValidator.predicate(
    "Z×X=Y",
    equalGeometryTestValues(Vector3.cross(Z, X), Y),
  );
  TestValidator.predicate(
    "anti-commutative",
    equalGeometryTestValues(Vector3.cross(Y, X), {
      x: 0,
      y: 0,
      z: -1,
    }),
  );
  for (const alias of ["new", "origin", "a", "b"] as const) {
    const origin: IAutoMovieVector3 = { x: 1, y: 2, z: 3 };
    const a: IAutoMovieVector3 = { x: 4, y: 6, z: 3 };
    const b: IAutoMovieVector3 = { x: 1, y: 2, z: 5 };
    const target: IAutoMovieVector3 =
      alias === "origin"
        ? origin
        : alias === "a"
          ? a
          : alias === "b"
            ? b
            : { x: 99, y: 88, z: 77 };
    Vector3.crossDifferenceInto(target, origin, a, b);
    TestValidator.predicate(
      "displacement cross product retains its independent determinant under destination aliasing",
      vclose(target, { x: 8, y: -6, z: 0 }, 0),
    );
    TestValidator.predicate(
      "cross-product destination writes leave every other source unchanged",
      (target === origin || vclose(origin, { x: 1, y: 2, z: 3 }, 0)) &&
        (target === a || vclose(a, { x: 4, y: 6, z: 3 }, 0)) &&
        (target === b || vclose(b, { x: 1, y: 2, z: 5 }, 0)),
    );
  }
}
