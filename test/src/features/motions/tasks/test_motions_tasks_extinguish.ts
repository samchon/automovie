import type { IAutoMovieMotionClock } from "@automovie/interface";
import {
  extinguishSweep
} from "../../../../../packages/motions/src/tasks/internal/extinguishSweep";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";

/**
 * The `extinguish` law's own logic (`extinguishSweep`), OSHA's PASS aim and
 * sweep: the aim over `AIM` (0.5 s), `sweeps` sweeps of `SWEEP` (1.2 s) each,
 * `span / 2 sin(2 pi sweeps u)` degrees from the aim, and the release.
 *
 * Scenarios:
 *
 * 1. Two sweeps over 60 degrees squeeze from 0.5 s to 2.9 s and end at 3.4 s; a
 *    quarter into the first sweep (0.8 s) the nozzle is 30 degrees aside, back
 *    on the aim halfway through it.
 * 2. Twice as slow, the squeeze starts at 1 s.
 * 3. No sweep, or a span of a half turn, is refused.
 */
export function test_motions_tasks_extinguish(): void {
  const sweep: extinguishSweep.ISweep = extinguishSweep(2, 60, 1);
  const clock: IAutoMovieMotionClock = sweep.clock;
  TestValidator.predicate(
    "the aim, the sweeps and the release",
    nclose(clock.at("strokeStart"), 0.5, 1e-12) &&
      nclose(clock.at("strokeEnd"), 2.9, 1e-12) &&
      nclose(clock.duration, 3.4, 1e-12) &&
      nclose(sweep.yaw(0.8), 30, 1e-9) &&
      nclose(sweep.yaw(1.1), 0, 1e-9),
  );
  TestValidator.predicate(
    "slower, and refused",
    nclose(extinguishSweep(2, 60, 2).clock.at("strokeStart"), 1, 1e-12) &&
      throwsError(() => extinguishSweep(0, 60, 1)) &&
      throwsError(() => extinguishSweep(2, 180, 1)),
  );
}
