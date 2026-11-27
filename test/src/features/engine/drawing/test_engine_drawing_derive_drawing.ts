import { AutoMovieEngineDrawing } from "@automovie/engine";
import type {
  IAutoMovieDrawing,
  IAutoMovieDrawingGap,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  drawingEnvironment,
  drawingView,
} from "../../internal/drawingFixtures";

/**
 * `deriveDrawing` derives one sheet from a built environment and a
 * view.
 *
 * Scenarios, on the authored atelier of a 10 x 6 m slab cut by a downward plan
 * at 1.2 m:
 *
 * 1. The sheet names its protocol, view, projection, scale and environment.
 * 2. The frame sits at the view origin (0, 1.2, 0).
 * 3. The same inputs give the same digest, and a different scale a different one.
 * 4. A view restricted to a space the design does not declare reports one
 *    `view-space-filter` gap, status `not-run`.
 */
export function test_engine_drawing_derive_drawing(): void {
  const sheet: IAutoMovieDrawing =
    AutoMovieEngineDrawing.deriveAutoMovieDrawing({
      environment: drawingEnvironment(),
      view: drawingView(),
    });
  TestValidator.equals(
    "the echoed identity",
    [
      sheet.protocol,
      sheet.view,
      sheet.projection,
      sheet.scale,
      sheet.environment,
    ],
    ["automovie.drawing.v1", "plan-ground", "plan", 50, "atelier"],
  );
  TestValidator.equals("the frame origin", sheet.frame.origin, {
    x: 0,
    y: 1.2,
    z: 0,
  });
  TestValidator.equals(
    "a stable digest",
    AutoMovieEngineDrawing.deriveAutoMovieDrawing({
      environment: drawingEnvironment(),
      view: drawingView(),
    }).digest,
    sheet.digest,
  );
  TestValidator.predicate(
    "a different scale, a different digest",
    AutoMovieEngineDrawing.deriveAutoMovieDrawing({
      environment: drawingEnvironment(),
      view: drawingView({ scale: 100 }),
    }).digest !== sheet.digest,
  );
  const filtered: IAutoMovieDrawing =
    AutoMovieEngineDrawing.deriveAutoMovieDrawing({
      environment: drawingEnvironment(),
      view: drawingView({ spaces: ["ghost"] }),
    });
  TestValidator.equals(
    "a dangling space filter",
    filtered.gaps
      .filter(
        (gap: IAutoMovieDrawingGap): boolean =>
          gap.subject === "view-space-filter",
      )
      .map((gap: IAutoMovieDrawingGap): string => gap.status),
    ["not-run"],
  );
}
