import { AutoMovieRecoveryProfileFitting } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieRecoveryProfileFitting.selectScalarIntervals` keeps, in priority
 * order, the slabs [levels[i], levels[i + 1]] that overlap a window with
 * positive length.
 *
 * Scenarios:
 *
 * 1. Levels [0, 10, 20, 30], order [2, 0, 1], window [5, 15]: slabs 0 and 1 in the
 *    order [0, 1], whole bounds [0, 20], one excluded.
 * 2. A window touching only the end, [30, 40], selects none.
 * 3. No window selects all.
 * 4. Unordered or nonfinite levels and invalid order indices refuse.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the positive-overlap decision, whole slab extent, default selection and invalid inputs.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the package selector on fixed scalar planes and checks selected indices, retained extent and admission exceptions.
 * @evidence contracts/development/testing.md#independent-expectations Enumerates the slabs intersecting [5, 15] by hand and distinguishes overlap from endpoint contact and a missing window. NaN levels or noninteger addresses cannot define a saved interval.
 */
export function test_recovery_internal_select_scalar_intervals(): void {
  TestValidator.equals(
    "an overlapped window",
    AutoMovieRecoveryProfileFitting.selectScalarIntervals(
      [0, 10, 20, 30],
      [2, 0, 1],
      {
        lowerMm: 5,
        upperMm: 15,
      },
    ),
    {
      intervals: [0, 1],
      windowMm: [5, 15],
      wholeSlabBoundsMm: [0, 20],
      excludedIntervals: 1,
    },
  );
  TestValidator.equals(
    "a touching window",
    AutoMovieRecoveryProfileFitting.selectScalarIntervals(
      [0, 10, 20, 30],
      [2, 0, 1],
      {
        lowerMm: 30,
        upperMm: 40,
      },
    ).intervals,
    [],
  );
  TestValidator.equals(
    "no window",
    AutoMovieRecoveryProfileFitting.selectScalarIntervals(
      [0, 10, 20, 30],
      [2, 0, 1],
    ).intervals,
    [2, 0, 1],
  );
  TestValidator.error("unordered levels", (): unknown =>
    AutoMovieRecoveryProfileFitting.selectScalarIntervals([0, 10, 5], [0, 1]),
  );
  TestValidator.error("an incomplete order", (): unknown =>
    AutoMovieRecoveryProfileFitting.selectScalarIntervals([0, 10, 20], [0, 0]),
  );
  const invalid: [number[], number[]][] = [
    [
      [0, NaN, 20],
      [0, 1],
    ],
    [
      [0, 10, Infinity],
      [0, 1],
    ],
    [
      [0, 10, 20],
      [NaN, 1],
    ],
    [
      [0, 10, 20],
      [0.5, 1],
    ],
  ];
  const unrefused: number[] = [];
  for (const [index, [levels, order]] of invalid.entries())
    try {
      AutoMovieRecoveryProfileFitting.selectScalarIntervals(levels, order);
      unrefused.push(index);
    } catch {}
  TestValidator.equals("invalid levels and ordinals refuse", unrefused, []);
}
