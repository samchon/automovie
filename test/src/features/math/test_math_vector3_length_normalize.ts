import { Vector3 } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose, vclose } from "../internal/predicates";

/**
 * Euclidean vector length and normalization retain the 3-4-5 norm and the declared zero-vector convention.
 *
 * Scenarios:
 *
 * 1. The 3–4–5 right triangle pins the norm: length (3,4,0) → 5; and the zero
 *    vector has length 0.
 * 2. Normalizing (3,4,0) yields a vector of length 1.
 * 3. Normalization preserves direction: (5,0,0) → (1,0,0).
 * 4. The degenerate zero vector normalizes back to zero (the divide-by-zero guard)
 *    instead of producing NaNs.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls length and normalize, checking the ordinary norm, normalized unit magnitude, axis direction and zero input. A wrong magnitude or dividing a zero direction into NaNs fails.
 * @evidence contracts/testing.md#independent-expectations The Pythagorean theorem gives sqrt(3 squared + 4 squared) = 5, and a positive X-axis vector normalizes to +X. Zero normalization follows the explicit API convention; checking normalized magnitude with the production length method can share a coherent defect, so the cardinal direction supplies a separate coordinate expectation.
 * @evidence contracts/testing.md#distinguishing-cases Keeps an ordinary nonaxis norm, exact zero length, ordinary normalized magnitude, axis direction and zero normalization. Tiny/huge/subnormal magnitudes and nonfinite propagation are owned by extreme-normalize.
 * @evidence contracts/testing.md#execution-ownership The named math function owns all synchronous assertions and calls portable Vector3 source without consumer installation, native build, process, browser, GPU or dynamic registration.
 */
export function test_math_vector3_length_normalize(): void {
  TestValidator.predicate("3-4-5 length", nclose(Vector3.length({ x: 3, y: 4, z: 0 }), 5, 0));
  TestValidator.predicate("zero length", nclose(Vector3.length(Vector3.create()), 0, 0));
  TestValidator.predicate(
    "normalized vector is unit",
    nclose(Vector3.length(Vector3.normalize({ x: 3, y: 4, z: 0 })), 1),
  );
  TestValidator.predicate(
    "normalize keeps direction",
    vclose(Vector3.normalize({ x: 5, y: 0, z: 0 }), { x: 1, y: 0, z: 0 }),
  );
  TestValidator.predicate(
    "normalize of zero stays zero",
    vclose(Vector3.normalize(Vector3.create()), Vector3.create()),
  );
}
