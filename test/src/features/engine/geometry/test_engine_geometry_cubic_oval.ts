import { AutoMovieCubicOval64 } from "@automovie/engine";
import type { IAutoMovieCubicOval64 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../../internal/predicates";

/**
 * `AutoMovieCubicOval64.axesBySimpson` sizes an oval of a given girth and
 * breadth-to-depth aspect.
 *
 * Scenarios:
 *
 * 1. Girth 100 at the largest finite aspect gives a positive depth and a breadth
 *    within 0.1 percent of 50, half the girth.
 * 2. Aspects 4 and 0.25 exchange breadth and depth; doubling the girth to 200
 *    doubles both.
 * 3. The smallest positive girth, whose diameters underflow, is refused.
 */
export function test_engine_geometry_cubic_oval(): void {
  const extreme: IAutoMovieCubicOval64.IAxesBySimpsonResult =
    AutoMovieCubicOval64.axesBySimpson(100, Number.MAX_VALUE);
  TestValidator.predicate("extreme depth", extreme.depthMm > 0);
  TestValidator.predicate(
    "extreme breadth",
    Math.abs(extreme.breadthMm / 50 - 1) < 1e-3,
  );
  const wide: IAutoMovieCubicOval64.IAxesBySimpsonResult =
    AutoMovieCubicOval64.axesBySimpson(100, 4);
  const tall: IAutoMovieCubicOval64.IAxesBySimpsonResult =
    AutoMovieCubicOval64.axesBySimpson(100, 0.25);
  const large: IAutoMovieCubicOval64.IAxesBySimpsonResult =
    AutoMovieCubicOval64.axesBySimpson(200, 4);
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
    throwsError(() => AutoMovieCubicOval64.axesBySimpson(Number.MIN_VALUE)),
  );
}
