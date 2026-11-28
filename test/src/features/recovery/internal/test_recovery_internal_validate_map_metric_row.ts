import type { IAutoMovieSimplexAtom } from "@automovie/interface";
import { AutoMovieRecoveryCameraMap } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

/**
 * `validateRecoveryMapMetricRow` admits a sparse row whose column indices are
 * strictly increasing inside the row width and pair one-to-one with values.
 *
 * Scenarios:
 *
 * 1. Indices [0, 2] with two values in width 3 are admitted.
 * 2. Repeated [1, 1], descending [2, 0] and out-of-width [3] indices refuse.
 * 3. Two indices with one value, and a zero width, refuse.
 * 4. Fractional or nonfinite addresses and widths, missing coefficients, and a
 *    nonfinite offset refuse before a metric action.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names increasing original column indices and matching values.
 * @evidence contracts/development/testing.md#behavioral-verification Admits a sparse row and exercises both shape and finite value checks before any metric action.
 * @evidence contracts/development/testing.md#independent-expectations Width three admits addresses zero and two. An authored zero value and negative finite offset are valid. Fractional indices and sparse missing slots cannot address a finite row.
 */
export function test_recovery_internal_validate_map_metric_row(): void {
  AutoMovieRecoveryCameraMap.validateMapMetricRow(
    { indices: [0, 2], values: [0, -1], offset: -0.5 },
    3,
  );
  for (const indices of [[1, 1], [2, 0], [3]])
    TestValidator.error(`indices ${indices.join(", ")}`, (): void =>
      AutoMovieRecoveryCameraMap.validateMapMetricRow(
        { indices, values: indices.map((): number => 1), offset: 0 },
        3,
      ),
    );
  TestValidator.error("unpaired values", (): void =>
    AutoMovieRecoveryCameraMap.validateMapMetricRow(
      { indices: [0, 1], values: [1], offset: 0 },
      3,
    ),
  );
  TestValidator.error("a zero width", (): void =>
    AutoMovieRecoveryCameraMap.validateMapMetricRow(
      { indices: [], values: [], offset: 0 },
      0,
    ),
  );
  const row: IAutoMovieSimplexAtom = { indices: [0], values: [1], offset: 0 };
  const sparse: number[] = [1];
  delete sparse[0];
  const malformed: [string, IAutoMovieSimplexAtom, number][] = [
    ["fractional address", { ...row, indices: [0.5] }, 3],
    ["NaN address", { ...row, indices: [NaN] }, 3],
    ["missing address", { ...row, indices: sparse }, 3],
    ["nonfinite coefficient", { ...row, values: [Infinity] }, 3],
    ["missing coefficient", { ...row, values: sparse }, 3],
    ["nonfinite offset", { ...row, offset: NaN }, 3],
    ["infinite width", row, Infinity],
    ["fractional width", row, 2.5],
  ];
  const admitted: string[] = [];
  for (const [name, sample, width] of malformed) {
    try {
      AutoMovieRecoveryCameraMap.validateMapMetricRow(sample, width);
      admitted.push(name);
    } catch (error: unknown) {
      if (
        !(error instanceof Error) ||
        !error.message.startsWith("camera-feasible: ")
      )
        throw error;
    }
  }
  TestValidator.equals(
    "unrepresentable sparse row fields are refused at admission",
    admitted,
    [],
  );
}
