import { AutoMovieEngineCubicOval64 } from "@automovie/engine";
import type { IAutoMovieCubicOval64 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../../internal/predicates";

/**
 * `AutoMovieEngineCubicOval64.axesBySimpson` sizes an oval of a given girth and
 * breadth-to-depth aspect.
 *
 * Scenarios:
 *
 * 1. Girth 100 at the largest finite aspect gives a positive depth and a breadth
 *    within 0.1 percent of 50, half the girth.
 * 2. Aspects 4 and 0.25 exchange breadth and depth; doubling the girth to 200
 *    doubles both.
 * 3. The smallest positive girth, whose diameters underflow, is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the extreme aspect, reciprocal axes, scale proportionality and underflow refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Sizes ovals at finite aspect extremes and both reciprocal ratios, then feeds the smallest positive girth.
 * @evidence contracts/development/testing.md#independent-expectations Swapping the aspect reciprocates breadth and depth. Similarity doubles both at double perimeter. In the thin limit the breadth tends to half of the perimeter.
 */
export function test_engine_geometry_cubic_oval(): void {
  const extreme: IAutoMovieCubicOval64.IAxesBySimpsonResult =
    AutoMovieEngineCubicOval64.axesBySimpson(100, Number.MAX_VALUE);
  TestValidator.predicate("extreme depth", extreme.depthMm > 0);
  TestValidator.predicate(
    "extreme breadth",
    Math.abs(extreme.breadthMm / 50 - 1) < 1e-3,
  );
  const wide: IAutoMovieCubicOval64.IAxesBySimpsonResult =
    AutoMovieEngineCubicOval64.axesBySimpson(100, 4);
  const tall: IAutoMovieCubicOval64.IAxesBySimpsonResult =
    AutoMovieEngineCubicOval64.axesBySimpson(100, 0.25);
  const large: IAutoMovieCubicOval64.IAxesBySimpsonResult =
    AutoMovieEngineCubicOval64.axesBySimpson(200, 4);
  TestValidator.predicate(
    "reciprocal breadth",
    nclose(wide.breadthMm, tall.depthMm, 1e-9),
  );
  TestValidator.predicate(
    "reciprocal depth",
    nclose(wide.depthMm, tall.breadthMm, 1e-9),
  );
  TestValidator.predicate(
    "doubled breadth",
    nclose(large.breadthMm, 2 * wide.breadthMm, 1e-9),
  );
  TestValidator.predicate(
    "doubled depth",
    nclose(large.depthMm, 2 * wide.depthMm, 1e-9),
  );
  TestValidator.predicate(
    "underflow",
    throwsError(() => AutoMovieEngineCubicOval64.axesBySimpson(Number.MIN_VALUE)),
  );
}
