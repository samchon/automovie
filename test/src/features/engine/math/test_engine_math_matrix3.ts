import { AutoMovieEngineMatrix3 } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/predicates";

/**
 * `AutoMovieEngineMatrix3` row-major 3 x 3 actions keep their order.
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
 *
 * @evidence contracts/development/common.md#meaningful-documentation Covers row-major transpose, ordered products and matrix-vector actions, with malformed and overflowing inputs.
 * @evidence contracts/development/testing.md#behavioral-verification Calls AutoMovieEngineMatrix3 operations on literal arrays. It tests the two multiplication orders and calls apply again after two refusals.
 * @evidence contracts/development/testing.md#independent-expectations Transposing swaps row and column indices. Explicit row dot products give (8, 17, 30) and the two ordered products differ. The skew action is the hand-computed cross product (17, 2, -7).
 */
export function test_engine_math_matrix3(): void {
  const left: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 10];
  const right: number[] = [1, 0, 2, 0, 1, -1, 0, 0, 1];
  const point: number[] = [2, -3, 4];
  TestValidator.equals(
    "transpose",
    AutoMovieEngineMatrix3.transpose(left),
    [1, 4, 7, 2, 5, 8, 3, 6, 10],
  );
  TestValidator.equals(
    "apply",
    AutoMovieEngineMatrix3.apply(left, point),
    [8, 17, 30],
  );
  const product: number[] = AutoMovieEngineMatrix3.multiply(left, right);
  TestValidator.equals("A x B", product, [1, 2, 3, 4, 5, 9, 7, 8, 16]);
  TestValidator.equals(
    "apply product",
    AutoMovieEngineMatrix3.apply(product, point),
    [8, 29, 54],
  );
  TestValidator.equals(
    "B x A",
    AutoMovieEngineMatrix3.multiply(right, left),
    [15, 18, 23, -3, -3, -4, 7, 8, 10],
  );
  TestValidator.equals(
    "skew",
    AutoMovieEngineMatrix3.apply(AutoMovieEngineMatrix3.skew([1, 2, 3]), point),
    [17, 2, -7],
  );
  TestValidator.predicate(
    "short transpose",
    throwsError(() => AutoMovieEngineMatrix3.transpose([1, 2])),
  );
  TestValidator.predicate(
    "overflow",
    throwsError(() =>
      AutoMovieEngineMatrix3.multiply(
        [Number.MAX_VALUE, 0, 0, 0, 1, 0, 0, 0, 1],
        [2, 0, 0, 0, 1, 0, 0, 0, 1],
      ),
    ),
  );
  TestValidator.equals(
    "recovers",
    AutoMovieEngineMatrix3.apply(left, point),
    [8, 17, 30],
  );
}
