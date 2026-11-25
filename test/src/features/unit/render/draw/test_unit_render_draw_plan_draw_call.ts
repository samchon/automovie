import { parseAutoMovieInspectionRequest, planAutoMovieDrawCall } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `planAutoMovieDrawCall` turns one capture cell into the call a draw page
 * answers.
 *
 * Scenarios:
 *
 * 1. A cell at 2 s of view `front` over a 100 by 50 subject, planned at 0 s and
 *    2 s with a 50 by 25 cell, is called with the subject's size, every
 *    planned second as its framing span and a label scale of 2.
 * 2. A view with `@follow` frames on the cell's own second alone.
 */
export function test_unit_render_draw_plan_draw_call(): void {
  const request = parseAutoMovieInspectionRequest((): undefined => undefined);
  const plan = {
    subject: { width: 100, height: 50 },
    times: [{ seconds: 0 }, { seconds: 2 }],
    layout: { cell: { width: 50, height: 25 } },
  };
  const cell = (view: string) => ({
    time: { seconds: 2, frame: null },
    view,
    request,
  });
  TestValidator.equals("front", planAutoMovieDrawCall(cell("front"), plan), {
    seconds: 2,
    view: "front",
    request,
    width: 100,
    height: 50,
    frame: [0, 2],
    scale: 2,
  });
  TestValidator.equals(
    "follow",
    planAutoMovieDrawCall(cell("front@follow"), plan).frame,
    [2],
  );
}