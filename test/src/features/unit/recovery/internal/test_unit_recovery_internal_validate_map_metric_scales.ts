import { validateRecoveryMapMetricScales } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

/**
 * `validateRecoveryMapMetricScales` admits positive camera column scales, at
 * least one, and three positive scales per point.
 *
 * Scenarios:
 *
 * 1. Camera [1, 2] and points [[1, 1, 1]] are admitted.
 * 2. No camera scale, a zero camera scale, a negative point scale and a
 *    two-scale point refuse.
 */
export function test_unit_recovery_internal_validate_map_metric_scales(): void {
  validateRecoveryMapMetricScales([1, 2], [[1, 1, 1]]);
  const refused: [string, number[], number[][]][] = [
    ["no camera scale", [], [[1, 1, 1]]],
    ["a zero camera scale", [0], [[1, 1, 1]]],
    ["a negative point scale", [1], [[1, -1, 1]]],
    ["a two-scale point", [1], [[1, 1]]],
  ];
  for (const [name, camera, points] of refused)
    TestValidator.error(name, (): void =>
      validateRecoveryMapMetricScales(camera, points),
    );
}