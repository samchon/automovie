import { riseSeatOff, seated, seatedCourse } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Rounding of a few sums and quotients. */
const ROUNDING: number = 1e-12;

/**
 * A seat is judged by the popliteal height, `seated.popliteal`: the ankle
 * height and the shank less the thigh's radius; `ratio` is a seat's height over
 * the floor as a share of it and `high` a seat above `RATIO`'s 1.2 of it. The
 * sit's descent and knee flexion follow the ratio (`seatedCourse`), and the
 * rise leaves the seat a little over a third into rising (`riseSeatOff`).
 *
 * Scenarios, a 0.08 m ankle height, a 0.42 m shank and a 0.07 m thigh radius (a
 * 0.43 m popliteal height):
 *
 * 1. The popliteal height is 0.43 m.
 * 2. A 0.43 m seat is ratio 1 and not high; a 0.6 m seat is high; a 0.6 m seat on
 *    a 0.1 m floor is ratio 0.5 / 0.43.
 * 3. A seat at the popliteal height descends over 2 s with the knees at 35
 *    degrees; at half of it over 2.6 s with 60.
 * 4. Rising for 1 s leaves the seat at 0.36 s.
 */
export function test_unit_motions_everyday_seated_popliteal(): void {
  const body: seated.IPopliteal = {
    measure: { ankleHeight: 0.08, shank: 0.42, thighRadius: 0.07 },
  };
  TestValidator.predicate(
    "the popliteal height",
    nclose(seated.popliteal(body), 0.43, ROUNDING),
  );
  const seat: (y: number) => Parameters<typeof seated.ratio>[1] = (
    y: number,
  ): Parameters<typeof seated.ratio>[1] => ({
    at: { x: 0, y, z: 0 },
  });
  TestValidator.predicate(
    "the seat's ratio",
    nclose(seated.ratio(body, seat(0.43)), 1, ROUNDING) &&
      !seated.high(body, seat(0.43)) &&
      seated.high(body, seat(0.6)) &&
      nclose(seated.ratio(body, seat(0.6), 0.1), 0.5 / 0.43, ROUNDING),
  );
  TestValidator.predicate(
    "the sit's course",
    nclose(seatedCourse.descent(1), 2, ROUNDING) &&
      nclose(seatedCourse.flexion(1), 35, ROUNDING) &&
      nclose(seatedCourse.descent(0.5), 2.6, ROUNDING) &&
      nclose(seatedCourse.flexion(0.5), 60, ROUNDING),
  );
  TestValidator.predicate(
    "the seat left",
    nclose(riseSeatOff(1), 0.36, ROUNDING),
  );
}
