import { AutoMovieRecoveryCameraGeometry } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * `normalizeRecoveryImagePoints` is Hartley's normalization (Hartley 1997, "In
 * Defense of the Eight-Point Algorithm"): centre the points and scale their
 * mean distance from the centroid to √2, returning the 3 × 3 similarity.
 *
 * Scenarios:
 *
 * 1. (0,0), (2,0), (2,2), (0,2): centroid (1,1), mean distance √2, so the scale is
 *    1 and the points become (±1, ±1); the transform is [1,0,−1, 0,1,−1,
 *    0,0,1].
 * 2. Coincident points and no point refuse.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the centroid and mean-distance target, with coincident and empty refusals.
 * @evidence contracts/development/testing.md#behavioral-verification Normalizes an explicit four-corner chart and submits both degenerate point sets.
 * @evidence contracts/development/testing.md#independent-expectations The (0, 0) to (2, 2) square has centroid (1, 1) and mean radius sqrt(2), so the expected transform is pure translation.
 */
export function test_recovery_internal_normalize_image_points(): void {
  const result: ReturnType<typeof AutoMovieRecoveryCameraGeometry.normalizeImagePoints> =
    AutoMovieRecoveryCameraGeometry.normalizeImagePoints([
      [0, 0],
      [2, 0],
      [2, 2],
      [0, 2],
    ]);
  TestValidator.predicate(
    "the normalized square",
    result.points.every(
      (point: readonly [number, number]): boolean =>
        nclose(Math.abs(point[0]), 1, 1e-15) &&
        nclose(Math.abs(point[1]), 1, 1e-15),
    ) &&
      result.transform.every((value: number, i: number): boolean =>
        nclose(value, [1, 0, -1, 0, 1, -1, 0, 0, 1][i]!, 1e-15),
      ),
  );
  TestValidator.error("coincident points", (): unknown =>
    AutoMovieRecoveryCameraGeometry.normalizeImagePoints([
      [3, 3],
      [3, 3],
    ]),
  );
  TestValidator.error("no point", (): unknown =>
    AutoMovieRecoveryCameraGeometry.normalizeImagePoints([]),
  );
}
