import { AutoMovieEngineDrawing } from "@automovie/engine";
import type { IAutoMovieOpeningProfile } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/** A 2 m wide, 1 m tall rectangle, straight edged. */
const RECTANGLE: IAutoMovieOpeningProfile = {
  outline: [
    { x: 0, y: 0 },
    { x: 2, y: 0 },
    { x: 2, y: 1 },
    { x: 0, y: 1 },
  ],
};

/**
 * `openingArea` and `openingExtent` measure an opening's
 * outline.
 *
 * Scenarios:
 *
 * 1. A 2 x 1 rectangle has area 2 and extent 2 wide by 1 tall.
 * 2. The area does not depend on the winding.
 */
export function test_engine_drawing_opening_area_extent(): void {
  TestValidator.equals(
    "area",
    AutoMovieEngineDrawing.autoMovieOpeningArea(RECTANGLE),
    2,
  );
  TestValidator.equals(
    "extent",
    AutoMovieEngineDrawing.autoMovieOpeningExtent(RECTANGLE),
    {
      width: 2,
      height: 1,
    },
  );
  TestValidator.equals(
    "clockwise area",
    AutoMovieEngineDrawing.autoMovieOpeningArea({
      outline: [...RECTANGLE.outline].reverse(),
    }),
    2,
  );
}
