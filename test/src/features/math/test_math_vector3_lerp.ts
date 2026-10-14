import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { equalGeometryTestValues } from "../internal/equalGeometryTestValues";

/**
 * Component-wise vector interpolation retains both endpoints and the midpoint of the original integer-coordinate segment with zero numeric tolerance.
 *
 * Scenarios (interpolating (0,0,0) → (2,4,6)):
 *
 * 1. T=0 returns the start vector exactly.
 * 2. T=1 returns the end vector exactly.
 * 3. T=0.5 returns the midpoint (1,2,3).
 *
 * @evidence contracts/testing.md#behavioral-verification Runs lerp at zero, one and one-half and checks all output components and record fields. Reversed endpoints or an incorrect blend fails while the existing endpoint values remain exact.
 * @evidence contracts/testing.md#independent-expectations The affine definition a+(b-a)*t gives (0,0,0), (2,4,6) and (1,2,3) independently of production output. The shared observer uses nclose with zero tolerance on finite coordinates and retains structural comparison.
 * @evidence contracts/testing.md#distinguishing-cases Preserves start, end and strict-interior midpoint. Extrapolation, cancellation, nonfinite input and mutation ownership are not tested here; motion tests own interpolation through easing and clip time.
 * @evidence contracts/testing.md#execution-ownership The discoverable named math entry executes portable runtime source synchronously without a host process, browser, GPU, native build, installed consumer or dynamic case registration.
 */
export function test_math_vector3_lerp(): void {
  const a: IAutoMovieVector3 = Vector3.create(0, 0, 0);
  const b: IAutoMovieVector3 = Vector3.create(2, 4, 6);
  TestValidator.predicate(
    "lerp at 0",
    equalGeometryTestValues(Vector3.lerp(a, b, 0), a),
  );
  TestValidator.predicate(
    "lerp at 1",
    equalGeometryTestValues(Vector3.lerp(a, b, 1), b),
  );
  TestValidator.predicate(
    "lerp midpoint",
    equalGeometryTestValues(Vector3.lerp(a, b, 0.5), {
      x: 1,
      y: 2,
      z: 3,
    }),
  );
}
