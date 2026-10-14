import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { equalGeometryTestValues } from "../internal/equalGeometryTestValues";

/**
 * Cross products retain the right-handed basis convention and reverse sign when operands swap.
 *
 * Scenarios:
 *
 * 1. The three cyclic basis products: X×Y=Z, Y×Z=X, Z×X=Y.
 * 2. Anti-commutativity: reversing the operands negates the result, so Y×X=−Z.
 *    Together these pin both the magnitude and the orientation of the product.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs all three cyclic basis products and the reversed X/Y pair, asserting exact finite coordinate values and record fields. An axis permutation or incorrect cross-product sign fails.
 * @evidence contracts/testing.md#independent-expectations The right-handed determinant convention gives X cross Y = Z, Y cross Z = X and Z cross X = Y, with reversed operands negating Z. The existing structural observer compares numeric leaves through zero-tolerance nclose and generates no expected vectors.
 * @evidence contracts/testing.md#distinguishing-cases Preserves every cyclic pair and one reversed pair. Parallel vectors, general magnitudes, zero vectors and malformed input are not covered here; downstream segment and quaternion tests own their geometric compositions.
 * @evidence contracts/testing.md#execution-ownership This named math entry owns synchronous portable Vector3 calls with no consumer installation, native compilation, process, browser, GPU or dynamically registered cases.
 */
export function test_math_vector3_cross(): void {
  const X: IAutoMovieVector3 = Vector3.create(1, 0, 0);
  const Y: IAutoMovieVector3 = Vector3.create(0, 1, 0);
  const Z: IAutoMovieVector3 = Vector3.create(0, 0, 1);
  TestValidator.predicate("X×Y=Z", equalGeometryTestValues(Vector3.cross(X, Y), Z));
  TestValidator.predicate("Y×Z=X", equalGeometryTestValues(Vector3.cross(Y, Z), X));
  TestValidator.predicate("Z×X=Y", equalGeometryTestValues(Vector3.cross(Z, X), Y));
  TestValidator.predicate("anti-commutative", equalGeometryTestValues(Vector3.cross(Y, X), {
    x: 0,
    y: 0,
    z: -1,
  }));
}
