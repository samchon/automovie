import { swimImmersedCoast } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";

/**
 * The immersed swim's coast: under a constant quadratic drag `dv/dt = -k v²`
 * (Nakashima, Satou and Miura 2007, the held shape in still water) the distance
 * from an initial speed is `log(1 + k v0 t) / k`, read within the coast's
 * duration.
 *
 * Scenarios:
 *
 * 1. At k = 0.5 /m from 2 m/s, after 1 s the body has coasted `2 ln 2` m, and past
 *    its 3 s duration it holds the `2 ln 4` m it had then.
 * 2. Without drag it moves uniformly, 3 m in 1.5 s at 2 m/s.
 * 3. A negative coefficient that would drive `1 + k v0 t` to zero within the coast
 *    is refused.
 */
export function test_motions_sport_swim_immersed(): void {
  const coast: (seconds: number) => number = swimImmersedCoast(0.5, 2, 3);
  TestValidator.predicate(
    "the coast's closed form",
    nclose(coast(1), 2 * Math.LN2, 1e-12) &&
      nclose(coast(10), 2 * Math.log(4), 1e-12) &&
      nclose(swimImmersedCoast(0, 2, 3)(1.5), 3, 1e-12) &&
      throwsError(() => swimImmersedCoast(-0.5, 2, 3)),
  );
}
