import { AutoMovieGravity } from "@automovie/engine";
import { GymnasticsFlight } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * `GymnasticsFlight.fall` is the time a drag-free centre launched at a height
 * with a vertical speed takes to come down to another height: the later root
 * of `from + vy t - g t² / 2 = to`.
 *
 * Scenarios:
 *
 * 1. Dropped from 1 m it lands at `sqrt(2 / g)` s.
 * 2. Thrown up at 3 m/s from the floor it returns at `6 / g` s.
 * 3. A height the parabola never reaches, or reaches only at the launch, has no
 *    fall.
 */
export function test_unit_motions_sport_gymnastics_flight_fall(): void {
  const g: number = AutoMovieGravity.STANDARD;
  TestValidator.predicate(
    "the descending root",
    nclose(GymnasticsFlight.fall(1, 0, 0)!, Math.sqrt(2 / g), 1e-12) &&
      nclose(GymnasticsFlight.fall(0, 3, 0)!, 6 / g, 1e-12) &&
      GymnasticsFlight.fall(0, 1, 10) === null &&
      GymnasticsFlight.fall(0, -1, 0) === null,
  );
}
