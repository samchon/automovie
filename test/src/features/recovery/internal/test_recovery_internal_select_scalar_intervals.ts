import { AutoMovieRecoveryProfileFitting } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieRecoveryProfileFitting.selectScalarIntervals` keeps, in priority order, the slabs
 * [levels[i], levels[i + 1]] that overlap a window with positive length.
 *
 * Scenarios:
 *
 * 1. Levels [0, 10, 20, 30], order [2, 0, 1], window [5, 15]: slabs 0 and 1 in the
 *    order [0, 1], whole bounds [0, 20], one excluded.
 * 2. A window touching only the end, [30, 40], selects none.
 * 3. No window selects all.
 * 4. Unordered levels and an incomplete order refuse.
 */
export function test_recovery_internal_select_scalar_intervals(): void {
  TestValidator.equals(
    "an overlapped window",
    AutoMovieRecoveryProfileFitting.selectScalarIntervals([0, 10, 20, 30], [2, 0, 1], [5, 15]),
    {
      intervals: [0, 1],
      windowMm: [5, 15],
      wholeSlabBoundsMm: [0, 20],
      excludedIntervals: 1,
    },
  );
  TestValidator.equals(
    "a touching window",
    AutoMovieRecoveryProfileFitting.selectScalarIntervals([0, 10, 20, 30], [2, 0, 1], [30, 40])
      .intervals,
    [],
  );
  TestValidator.equals(
    "no window",
    AutoMovieRecoveryProfileFitting.selectScalarIntervals([0, 10, 20, 30], [2, 0, 1]).intervals,
    [2, 0, 1],
  );
  TestValidator.error("unordered levels", (): unknown =>
    AutoMovieRecoveryProfileFitting.selectScalarIntervals([0, 10, 5], [0, 1]),
  );
  TestValidator.error("an incomplete order", (): unknown =>
    AutoMovieRecoveryProfileFitting.selectScalarIntervals([0, 10, 20], [0, 0]),
  );
}
