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
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the rectangular area and width and height and the repeated area in reverse winding.
 * @evidence contracts/development/testing.md#behavioral-verification Calls Drawing.autoMovieOpeningArea and autoMovieOpeningExtent on the same typed outline, then calls area on its reversal.
 * @evidence contracts/development/testing.md#independent-expectations A 2 m by 1 m closed rectangle encloses exactly 2 square metres in either winding. The coordinate differences give width 2 and height 1.
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
