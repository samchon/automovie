import { validateRecoveryMapMetricRow } from "@automovie/recovery";
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
 */
export function test_unit_recovery_internal_validate_map_metric_row(): void {
  validateRecoveryMapMetricRow({ indices: [0, 2], values: [1, -1] }, 3);
  for (const indices of [[1, 1], [2, 0], [3]])
    TestValidator.error(`indices ${indices.join(", ")}`, (): void =>
      validateRecoveryMapMetricRow(
        { indices, values: indices.map((): number => 1) },
        3,
      ),
    );
  TestValidator.error("unpaired values", (): void =>
    validateRecoveryMapMetricRow({ indices: [0, 1], values: [1] }, 3),
  );
  TestValidator.error("a zero width", (): void =>
    validateRecoveryMapMetricRow({ indices: [], values: [] }, 0),
  );
}