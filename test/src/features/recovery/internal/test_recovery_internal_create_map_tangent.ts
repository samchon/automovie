import { AutoMovieRecoveryCameraMap } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * `createRecoveryMapTangent` gives an orthonormal basis (a, t × a) of the plane
 * tangent to the unit sphere at a seed translation t, a being the axis of t's
 * smallest component with its t part removed.
 *
 * Scenarios:
 *
 * 1. T = (0, 0, 1): a = (1, 0, 0) and t × a = (0, 1, 0).
 * 2. T = (0.6, 0, 0.8): both directions are unit and orthogonal to t and to each
 *    other.
 * 3. A non-unit t, (0, 0, 2), refuses.
 */
export function test_recovery_internal_create_map_tangent(): void {
  TestValidator.equals(
    "the tangent at +Z",
    AutoMovieRecoveryCameraMap.createMapTangent([0, 0, 1]),
    [
      [1, 0, 0],
      [0, 1, 0],
    ],
  );
  const t: [number, number, number] = [0.6, 0, 0.8];
  const tangent: [number, number, number][] = AutoMovieRecoveryCameraMap.createMapTangent(t);
  const a: [number, number, number] = tangent[0]!;
  const b: [number, number, number] = tangent[1]!;
  const dot: (p: readonly number[], q: readonly number[]) => number = (
    p: readonly number[],
    q: readonly number[],
  ): number => p[0]! * q[0]! + p[1]! * q[1]! + p[2]! * q[2]!;
  TestValidator.predicate(
    "an orthonormal tangent basis",
    nclose(dot(a, a), 1, 1e-15) &&
      nclose(dot(b, b), 1, 1e-15) &&
      nclose(dot(a, t), 0, 1e-15) &&
      nclose(dot(b, t), 0, 1e-15) &&
      nclose(dot(a, b), 0, 1e-15),
  );
  TestValidator.error("a non-unit translation", (): unknown =>
    AutoMovieRecoveryCameraMap.createMapTangent([0, 0, 2]),
  );
}
