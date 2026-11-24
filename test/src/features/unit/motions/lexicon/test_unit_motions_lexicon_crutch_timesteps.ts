import { crutchHeldLeg } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * `crutchHeldLeg.timesteps` cuts the held leg's fold into TrajOpt's evenly
 * spaced timesteps, its arm trajectories' eleven (Schulman et al. 2013, RSS,
 * section VI), and keeps the law's contact events after the held pose as
 * timesteps of their own.
 *
 * The leg lifts at 1 s and is held at 2 s; the law's events are at 1.5, 2.4 and
 * 2.4 + 0.25 s.
 *
 * Scenarios:
 *
 * 1. Eleven timesteps from the lift to the held pose, a tenth of a second apart,
 *    the first at the lift and the eleventh at the held pose.
 * 2. The events after the held pose follow unchanged; the one before it is
 *    dropped.
 * 3. With no events the fold's eleven timesteps are all.
 */
export function test_unit_motions_lexicon_crutch_timesteps(): void {
  const steps: number[] = crutchHeldLeg.timesteps(1, 2, [1.5, 2.4, 2.65]);
  TestValidator.predicate(
    "eleven even timesteps from the lift to the held pose",
    steps
      .slice(0, 11)
      .every((t: number, i: number): boolean => nclose(t, 1 + i / 10, 1e-12)) &&
      steps[0] === 1 &&
      steps[10] === 2,
  );
  TestValidator.equals("the later events follow", steps.slice(11), [2.4, 2.65]);
  TestValidator.equals(
    "no events, the fold alone",
    crutchHeldLeg.timesteps(1, 2).length,
    11,
  );
}
