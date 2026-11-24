import { AutoMovieGravity } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { HumanUnseatFlight } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

/** No push. */
const NONE: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };

/**
 * `HumanUnseatFlight` flies an unseated rider's root from the release under
 * gravity, its push built at a constant rate over `TAKE`, to the floor, and
 * slides it to a stop under Coulomb friction.
 *
 * Scenarios:
 *
 * 1. Released 1.2 m up at 2 m/s level with no push, it lands after `sqrt(2.4 / g)`
 *    seconds, `2 sqrt(2.4 / g)` metres on, and slides `2² / (2 · 0.5 g)`
 *    further in `2 / (0.5 g)` seconds.
 * 2. Released 0.1 m up at rest with a 1 m/s push, it lands after `sqrt(0.2 / g)`,
 *    inside the push's build, `t² / (2 TAKE)` metres on, sliding at the push
 *    built so far.
 * 3. Released at the floor it has landed already.
 */
export function test_unit_motions_lexicon_unseat_flight(): void {
  const g: number = AutoMovieGravity.STANDARD;
  const thrown: HumanUnseatFlight.IFlight = HumanUnseatFlight(
    { x: 0, y: 1.2, z: 0 },
    { x: 2, y: 0, z: 0 },
    NONE,
    0,
  );
  const land: number = Math.sqrt(2.4 / g);
  const stop: number = 2 / (0.5 * g);
  TestValidator.predicate(
    "thrown level",
    nclose(thrown.land, land, 1e-12) &&
      vclose(thrown.landed, { x: 2 * land, y: 0, z: 0 }, 1e-12) &&
      nclose(thrown.stop, stop, 1e-12) &&
      vclose(
        HumanUnseatFlight.at(thrown, land + stop + 1),
        { x: 2 * land + 4 / g, y: 0, z: 0 },
        1e-12,
      ) &&
      vclose(
        HumanUnseatFlight.at(thrown, land / 2),
        {
          x: land,
          y: 1.2 - 0.5 * g * (land / 2) ** 2,
          z: 0,
        },
        1e-12,
      ),
  );

  const pushed: HumanUnseatFlight.IFlight = HumanUnseatFlight(
    { x: 0, y: 0.1, z: 0 },
    NONE,
    { x: 1, y: 0, z: 0 },
    0,
  );
  const early: number = Math.sqrt(0.2 / g);
  TestValidator.predicate(
    "pushed off low",
    early < HumanUnseatFlight.TAKE &&
      nclose(pushed.land, early, 1e-12) &&
      nclose(
        pushed.landed.x,
        (early * early) / (2 * HumanUnseatFlight.TAKE),
        1e-12,
      ) &&
      nclose(pushed.slide.x, early / HumanUnseatFlight.TAKE, 1e-12),
  );

  TestValidator.predicate(
    "at the floor",
    HumanUnseatFlight({ x: 0, y: 0, z: 0 }, NONE, NONE, 0).land === 0,
  );
}
