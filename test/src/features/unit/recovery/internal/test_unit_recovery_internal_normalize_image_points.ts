import { normalizeRecoveryImagePoints } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

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
 */
export function test_unit_recovery_internal_normalize_image_points(): void {
  const result: ReturnType<typeof normalizeRecoveryImagePoints> =
    normalizeRecoveryImagePoints([
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
    normalizeRecoveryImagePoints([
      [3, 3],
      [3, 3],
    ]),
  );
  TestValidator.error("no point", (): unknown =>
    normalizeRecoveryImagePoints([]),
  );
}
