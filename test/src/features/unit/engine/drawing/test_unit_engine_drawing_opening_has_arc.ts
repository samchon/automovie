import { autoMovieOpeningHasArc } from "@automovie/engine";
import type { IAutoMoviePlanarPoint } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/** Three corners of a triangle. */
const OUTLINE: IAutoMoviePlanarPoint[] = [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
];

/**
 * `autoMovieOpeningHasArc` says whether any edge of an opening profile bulges.
 *
 * Scenarios:
 *
 * 1. Bulges 0, 0.5, 0 have an arc.
 * 2. All-zero bulges, and no bulge list, have none.
 */
export function test_unit_engine_drawing_opening_has_arc(): void {
  TestValidator.predicate(
    "a bulge",
    autoMovieOpeningHasArc({ outline: OUTLINE, bulges: [0, 0.5, 0] }),
  );
  TestValidator.predicate(
    "straight edges",
    !autoMovieOpeningHasArc({ outline: OUTLINE, bulges: [0, 0, 0] }) &&
      !autoMovieOpeningHasArc({ outline: OUTLINE }),
  );
}
