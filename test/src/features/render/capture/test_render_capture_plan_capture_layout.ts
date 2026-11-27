import type { IAutoMovieCaptureLayout } from "@automovie/interface";
import { AutoMovieRenderCapture } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `planCaptureLayout` lays captured stills into contact sheets within
 * a longest-edge budget.
 *
 * Scenarios:
 *
 * 1. One 100 by 50 still under a 4096 budget is one cell of its own size on one
 *    sheet of one column and one row.
 * 2. Eight stills under a 200 budget fit: every sheet's grid stays inside the
 *    longest edge, the sheets hold every still, and no cell exceeds its still.
 * 3. A count of zero is refused.
 */
export function test_render_capture_plan_capture_layout(): void {
  const single: IAutoMovieCaptureLayout = AutoMovieRenderCapture.planLayout({
    width: 100,
    height: 50,
    count: 1,
    group: 1,
    captions: [],
    budget: { longest: 4096, smallest: 16, reduction: "area" },
  });
  TestValidator.equals(
    "single",
    [single.cell, single.columns, single.rows, single.perSheet, single.sheets],
    [{ width: 100, height: 50 }, 1, 1, 1, 1],
  );

  const many: IAutoMovieCaptureLayout = AutoMovieRenderCapture.planLayout({
    width: 100,
    height: 50,
    count: 8,
    group: 1,
    captions: [],
    budget: { longest: 200, smallest: 16, reduction: "nearest" },
  });
  TestValidator.predicate(
    "inside the budget",
    many.columns * many.cell.width <= 200 &&
      many.rows * (many.cell.height + many.caption) <= 200,
  );
  TestValidator.predicate(
    "holds every still",
    many.sheets * many.perSheet >= 8 && many.perSheet <= 8,
  );
  TestValidator.predicate(
    "cell not larger than the still",
    many.cell.width <= 100 && many.cell.height <= 50,
  );
  TestValidator.equals("reduction carried", many.reduction, "nearest");
  TestValidator.error("no stills", (): void => {
    AutoMovieRenderCapture.planLayout({
      width: 100,
      height: 50,
      count: 0,
      group: 1,
      captions: [],
      budget: { longest: 200, smallest: 16, reduction: "area" },
    });
  });
}