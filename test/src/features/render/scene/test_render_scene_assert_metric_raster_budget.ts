import {
  assertMetricRasterBudget
} from "../../../../../packages/render/src/scene/internal/assertMetricRasterBudget";
import { TestValidator } from "@nestia/e2e";
import { doesNotThrow } from "node:assert/strict";

import { throwsError } from "../../internal/throwsError";

/**
 * Metric capture admits a physical raster only when its positive pixel area
 * fits the declared budget.
 *
 * Scenarios:
 *
 * 1. A 1 by 1 raster fits one pixel; a 2 by 3 raster fits six exactly.
 * 2. A budget of five refuses 2 by 3. A zero side refuses before allocation.
 * 3. An unordered side or budget supplies no true area inequality and refuses.
 *
 * These small rectangles have exactly representable pixel counts. The guard
 * decides allocation before the host reads or allocates a native buffer.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names exact-budget success and refusal of a smaller budget, zero dimensions and unordered numbers.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the metric raster admission guard with tiny numeric raster and budget fixtures before any native buffer is needed.
 * @evidence contracts/development/testing.md#independent-expectations The literal areas are 1 and 6 pixels. Budget 6 includes the 2 by 3 boundary, and budget 5 excludes it. A zero side or an unordered operand cannot satisfy the valid positive area rule.
 */
export function test_render_scene_assert_metric_raster_budget(): void {
  doesNotThrow((): void => assertMetricRasterBudget(1, 1, 1));
  doesNotThrow((): void => assertMetricRasterBudget(2, 3, 6));
  const refused: [number, number, number][] = [
    [2, 3, 5],
    [0, 3, 6],
    [2, 0, 6],
    [NaN, 3, 6],
    [2, NaN, 6],
    [2, 3, NaN],
    [Infinity, 3, 6],
  ];
  for (const shape of refused)
    TestValidator.predicate(
      `raster ${shape.join(" by ")} refuses`,
      throwsError(
        (): void => assertMetricRasterBudget(...shape),
        "positive bounded physical pixel dimensions",
      ),
    );
}
