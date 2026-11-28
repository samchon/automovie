import { AutoMovieRecoveryCameraMap } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { recoveryStereoChart as chart } from "./recoveryStereoChart";

/**
 * The original 2-by-2 coupled block has determinant 16. Allow 128 roundoffs at
 * magnitude 32 through QR and whitening, doubled for the final squared norm.
 */
const METRIC_ROUNDING: number = 8192 * Number.EPSILON;

/**
 * Block elimination preserves the original physical inverse metric.
 *
 * Scenarios:
 *
 * 1. One camera coordinate and a point have original normal matrix whose leading
 *    block is [5, 2; 2, 4] and remaining diagonal is (16, 64). The mixed
 *    covector (2, 4, 8, 16) has inverse-metric norm squared 12.
 * 2. Damping by one adds the original column norms squared to the diagonal. The
 *    leading block then has determinant 76 and the same covector has norm
 *    squared 116/19. A camera parallel to the point cannot gain rank.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States physical covector order, block couplings and damping.
 * @evidence contracts/development/testing.md#behavioral-verification Measures a fixed coupled metric with and without damping and probes a rank-deficient camera direction.
 * @evidence contracts/development/testing.md#independent-expectations Inverting the leading block with rows (5, 2) and (2, 4) and remaining diagonal 16 and 64 gives squared inverse norm 12. The damped block gives 116/19.
 */
export function test_recovery_internal_factor_map_metric(): void {
  const block: Parameters<typeof AutoMovieRecoveryCameraMap.factorMapMetric>[0][number] = {
    pointRows: [
      [2, 0, 0],
      [0, 4, 0],
      [0, 0, 8],
      [0, 0, 0],
    ],
    cameraRows: [[1], [0], [0], [2]],
    right: [0, 0, 0, 0],
  };
  for (const damping of [0, 1]) {
    const measured: ReturnType<typeof AutoMovieRecoveryCameraMap.factorMapMetric> =
      AutoMovieRecoveryCameraMap.factorMapMetric(
        [block],
        chart.minimumRatio,
        damping,
        chart.budget,
      );
    const row: ReturnType<typeof measured.metric.whiten> =
      measured.metric.whiten({
        indices: [0, 1, 2, 3],
        values: [2, 4, 8, 16],
        offset: 7,
      });
    const squared: number = row.values.reduce(
      (sum: number, value: number): number => sum + value ** 2,
      0,
    );
    TestValidator.equals(
      "the covector offset survives whitening",
      row.offset,
      7,
    );
    TestValidator.predicate(
      "original physical inverse metric norm",
      nclose(squared, damping === 0 ? 12 : 116 / 19, METRIC_ROUNDING),
    );
  }
  TestValidator.error(
    "point elimination removes all camera evidence",
    (): unknown =>
      AutoMovieRecoveryCameraMap.factorMapMetric(
        [{ ...block, cameraRows: [[1], [0], [0], [0]] }],
        chart.minimumRatio,
        1,
        chart.budget,
      ),
  );
}
