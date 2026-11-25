import { createRecoveryMapTriangularMetric } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** The triangular rows and every scale and pivot are small dyadic numbers. */
const EXACT_DYADIC_TOLERANCE: number = 0;

/**
 * The point-first factor acts on camera-first physical coordinates.
 *
 * Scenarios:
 *
 * 1. With a nonzero point-to-camera coupling, apply the explicit transpose and
 *    original scales to the five-coordinate covector. Transpose substitution
 *    recovers the original covector, and backward substitution gives the
 *    independently derived physical step.
 * 2. Zero pivots refuse whitening, and a mismatched step width refuses.
 */
export function test_unit_recovery_internal_triangular_map_metric(): void {
  const camera: number[][] = [[2, 1], [0, 4]];
  const point: number[][] = [[2, 1, 0, 1, 0], [0, 4, 2, 0, 1], [0, 0, 8, 2, 3]];
  const metric: ReturnType<typeof createRecoveryMapTriangularMetric> = createRecoveryMapTriangularMetric([point], camera, [[2, 4, 8]], [2, 4]);
  const whitened: number[] = [5, 8, 9, 8, 8];
  const physical: number[] = [70, 276, 36, 164, 640];
  const same = (actual: number[], expected: number[]): boolean => actual.length === expected.length && actual.every((value: number, index: number): boolean => nclose(value, expected[index]!, EXACT_DYADIC_TOLERANCE));
  TestValidator.predicate("transpose action and original scales", same(metric.toPhysicalCovector(whitened), physical));
  const row: ReturnType<typeof metric.whiten> = metric.whiten({indices: [0, 1, 2, 3, 4], values: physical, offset: 7});
  TestValidator.equals("whitened index order and offset", [row.indices, row.offset], [[0, 1, 2, 3, 4], 7]);
  TestValidator.predicate("transpose substitution", same(row.values, whitened));
  TestValidator.predicate("reverse substitution in physical order", same(metric.unwhiten(whitened), [3 / 4, 1 / 2, 95 / 64, 25 / 64, -1 / 64]));
  TestValidator.error("wrong step width", (): unknown => metric.unwhiten([1, 2]));

  const singular: ReturnType<typeof createRecoveryMapTriangularMetric> = createRecoveryMapTriangularMetric([point], [[0, 1], [0, 4]], [[2, 4, 8]], [2, 4]);
  const input: Parameters<typeof singular.whiten>[0] = {indices: [0], values: [2], offset: 0};
  TestValidator.equals("unresolved pivot can decline", singular.tryWhiten(input), null);
  TestValidator.error("unresolved pivot can refuse", (): unknown => singular.whiten(input));
}
