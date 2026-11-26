import { AutoMovieEngineSoftBody } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { softPanel } from "../../internal/softFixtures";

/**
 * `softBodyTravelNumber` is dt × reference speed ÷ the shortest rest edge, the
 * fraction of an edge a particle at the reference speed crosses in one step;
 * zero when there is no edge.
 *
 * Scenarios:
 *
 * 1. Dt = 1/64 s, speed 4 m/s, edges 0.25 m: (1/64)(4)/0.25 = 0.25.
 * 2. A single particle: 0.
 */
export function test_engine_soft_body_travel_number(): void {
  TestValidator.predicate(
    "the worked travel",
    nclose(
      AutoMovieEngineSoftBody.softBodyTravelNumber(softPanel({ columns: 2, rows: 2 })),
      0.25,
      1e-15,
    ),
  );
  TestValidator.equals(
    "no edge, no travel",
    AutoMovieEngineSoftBody.softBodyTravelNumber(softPanel({ columns: 1, rows: 1 })),
    0,
  );
}
