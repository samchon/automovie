import { AutoMovieEngineDrawing } from "@automovie/engine";
import type { IAutoMovieOpeningArc } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Rounding of a few trigonometric terms. */
const ROUNDING: number = 1e-12;

/**
 * `autoMovieOpeningArc` is the circular arc a bulge puts on a chord: bulge is
 * `tan(sweep / 4)`, so bulge 1 is a half circle.
 *
 * Scenarios:
 *
 * 1. Bulge 1 over the chord (0, 0)-(2, 0) is a circle at (1, 0), radius 1,
 *    starting at angle pi with sweep -pi.
 * 2. A zero bulge is a straight edge, null.
 * 3. A zero-length chord is null.
 */
export function test_engine_drawing_opening_arc(): void {
  const arc: IAutoMovieOpeningArc | null =
    AutoMovieEngineDrawing.autoMovieOpeningArc(
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      1,
    );
  TestValidator.predicate(
    "a half circle",
    arc !== null &&
      nclose(arc.center.x, 1, ROUNDING) &&
      nclose(arc.center.y, 0, ROUNDING) &&
      nclose(arc.radius, 1, ROUNDING) &&
      nclose(arc.start, Math.PI, ROUNDING) &&
      nclose(arc.sweep, -Math.PI, ROUNDING),
  );
  TestValidator.equals(
    "a straight edge",
    AutoMovieEngineDrawing.autoMovieOpeningArc(
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      0,
    ),
    null,
  );
  TestValidator.equals(
    "no chord",
    AutoMovieEngineDrawing.autoMovieOpeningArc(
      { x: 1, y: 1 },
      { x: 1, y: 1 },
      1,
    ),
    null,
  );
}
