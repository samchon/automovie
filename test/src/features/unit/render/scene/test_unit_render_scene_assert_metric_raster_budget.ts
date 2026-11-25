import { assertAutoMovieMetricRasterBudget } from "@automovie/render/internal";
import { TestValidator } from "@nestia/e2e";
import { doesNotThrow } from "node:assert/strict";

import { throwsError } from "../../../internal/throwsError";

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
 */
export function test_unit_render_scene_assert_metric_raster_budget(): void {
  doesNotThrow((): void => assertAutoMovieMetricRasterBudget(1, 1, 1));
  doesNotThrow((): void => assertAutoMovieMetricRasterBudget(2, 3, 6));
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
        (): void => assertAutoMovieMetricRasterBudget(...shape),
        "positive bounded physical pixel dimensions",
      ),
    );
}
