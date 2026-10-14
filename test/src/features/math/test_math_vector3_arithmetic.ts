import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { equalGeometryTestValues } from "../internal/equalGeometryTestValues";
import { nclose } from "../internal/nclose";

/**
 * Component-wise vector arithmetic retains the independently calculated values and record shape; the authored integer-valued coordinates use zero numeric tolerance.
 *
 * Scenarios:
 *
 * 1. Add (1,2,3)+(4,5,6) → (5,7,9), the per-component sum.
 * 2. Subtract (4,5,6)−(1,2,3) → (3,3,3).
 * 3. Scale (1,2,3)·2 → (2,4,6).
 * 4. Dot (1,2,3)·(4,5,6) → 32, and the dot of two perpendicular axes is 0, pinning
 *    the orthogonality the projection and lighting math rely on.
 *
 * @evidence contracts/testing.md#behavioral-verification Executes create, add, subtract, scale and dot, asserting each original scalar/vector result and ordered enumerable record fields. Reversed subtraction, missing components or wrong products fail while the original exact arithmetic remains legal.
 * @evidence contracts/testing.md#independent-expectations Per-coordinate integer sums/differences/products give (5,7,9), (3,3,3), (2,4,6) and dot 32; orthogonal basis vectors have zero dot. The observer uses nclose with zero tolerance for numeric leaves and retains structural comparison; it does not generate expectations.
 * @evidence contracts/testing.md#distinguishing-cases Keeps nonzero addition/subtraction/scaling, an ordinary dot and the adjacent orthogonal zero dot. Negative scales, overflow and malformed input are outside this entry; magnitude and normalization have separate tests.
 * @evidence contracts/testing.md#execution-ownership The discoverable named entry directly calls portable Vector3 runtime methods and owns its synchronous assertions. It installs no consumer, builds no native artifact and starts no process, browser or GPU; no cases are dynamically registered.
 */
export function test_math_vector3_arithmetic(): void {
  const a: IAutoMovieVector3 = Vector3.create(1, 2, 3);
  const b: IAutoMovieVector3 = Vector3.create(4, 5, 6);
  TestValidator.predicate("add", equalGeometryTestValues(Vector3.add(a, b), { x: 5, y: 7, z: 9 }));
  TestValidator.predicate("subtract", equalGeometryTestValues(Vector3.subtract(b, a), {
    x: 3,
    y: 3,
    z: 3,
  }));
  TestValidator.predicate("scale", equalGeometryTestValues(Vector3.scale(a, 2), { x: 2, y: 4, z: 6 }));
  TestValidator.predicate("dot", nclose(Vector3.dot(a, b), 32, 0));
  TestValidator.predicate(
    "dot orthogonal is zero",
    nclose(Vector3.dot({ x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }), 0, 0),
  );
}
