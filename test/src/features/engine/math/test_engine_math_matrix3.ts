import { AutoMovieMatrix3 } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/predicates";

/**
 * `AutoMovieMatrix3` row-major 3 x 3 actions keep their order.
 *
 * Matrices: A = [1,2,3, 4,5,6, 7,8,10], B = [1,0,2, 0,1,-1, 0,0,1]; point (2,
 * -3, 4).
 *
 * Scenarios:
 *
 * 1. The transpose of A is [1,4,7, 2,5,8, 3,6,10]; A applied to the point is (8,
 *    17, 30), by row 1: 2 - 6 + 12, row 2: 8 - 15 + 24, row 3: 14 - 24 + 40.
 * 2. A x B is [1,2,3, 4,5,9, 7,8,16] and applying it to the point gives (8, 29,
 *    54); B x A is [15,18,23, -3,-3,-4, 7,8,10], so the order matters.
 * 3. The cross-product matrix of (1, 2, 3) applied to the point is the cross
 *    product (17, 2, -7).
 * 4. A two-entry transpose and a product whose entry overflows are refused, and
 *    the next valid call is unaffected.
 */
export function test_engine_math_matrix3(): void {
  const left: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 10];
  const right: number[] = [1, 0, 2, 0, 1, -1, 0, 0, 1];
  const point: number[] = [2, -3, 4];
  TestValidator.equals(
    "transpose",
    AutoMovieMatrix3.transpose(left),
    [1, 4, 7, 2, 5, 8, 3, 6, 10],
  );
  TestValidator.equals(
    "apply",
    AutoMovieMatrix3.apply(left, point),
    [8, 17, 30],
  );
  const product: number[] = AutoMovieMatrix3.multiply(left, right);
  TestValidator.equals("A x B", product, [1, 2, 3, 4, 5, 9, 7, 8, 16]);
  TestValidator.equals(
    "apply product",
    AutoMovieMatrix3.apply(product, point),
    [8, 29, 54],
  );
  TestValidator.equals(
    "B x A",
    AutoMovieMatrix3.multiply(right, left),
    [15, 18, 23, -3, -3, -4, 7, 8, 10],
  );
  TestValidator.equals(
    "skew",
    AutoMovieMatrix3.apply(AutoMovieMatrix3.skew([1, 2, 3]), point),
    [17, 2, -7],
  );
  TestValidator.predicate(
    "short transpose",
    throwsError(() => AutoMovieMatrix3.transpose([1, 2])),
  );
  TestValidator.predicate(
    "overflow",
    throwsError(() =>
      AutoMovieMatrix3.multiply(
        [Number.MAX_VALUE, 0, 0, 0, 1, 0, 0, 0, 1],
        [2, 0, 0, 0, 1, 0, 0, 0, 1],
      ),
    ),
  );
  TestValidator.equals(
    "recovers",
    AutoMovieMatrix3.apply(left, point),
    [8, 17, 30],
  );
}
