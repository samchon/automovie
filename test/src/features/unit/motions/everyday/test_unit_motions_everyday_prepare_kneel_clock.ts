import { prepareKneelClock } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { linearMotionClock } from "../../../internal/synthetic/linearMotionClock";

/** Rounding of one quotient of film seconds and one quintic, unitless. */
const ROUNDING: number = 1e-12;

/** The minimum-jerk share at a quarter, `10/64 - 15/256 + 6/1024`. */
const QUARTER: number = 10 / 64 - 15 / 256 + 6 / 1024;

/**
 * `prepareKneelClock` finds the kneel's phase at a second, each phase running
 * from its own instant to the next phase's (the last to `end`), with its linear
 * share of the phase's time and that share's minimum-jerk progress. A phase
 * starts a nanosecond before its instant, so a read at an instant is in the
 * phase that opens there.
 *
 * On a linear clock of 4 s the phases open at 0.5, 1.5 and 3.5 s.
 *
 * Scenarios:
 *
 * 1. Before the first phase, it is the first phase at no progress.
 * 2. Half through the first it is index 0 at a half, both shares a half.
 * 3. At the second's instant it is index 1 at none.
 * 4. A quarter through the second its progress is `s(1/4)`.
 * 5. The last phase runs to the clock's end.
 */
export function test_unit_motions_everyday_prepare_kneel_clock(): void {
  const at: ReturnType<typeof prepareKneelClock<{ name: string }>> =
    prepareKneelClock(
      linearMotionClock(4, [
        { name: "a", seconds: 0.5 },
        { name: "b", seconds: 1.5 },
        { name: "c", seconds: 3.5 },
      ]),
      [{ name: "a" }, { name: "b" }, { name: "c" }],
    );

  // 1. Before the first.
  const before: ReturnType<typeof at> = at(0.2);
  TestValidator.equals(
    "before the first phase",
    [before.phase.name, before.index, before.u, before.linear],
    ["a", 0, 0, 0],
  );

  // 2. Half through the first.
  const half: ReturnType<typeof at> = at(1);
  TestValidator.predicate(
    "half through the first",
    half.index === 0 &&
      nclose(half.linear, 0.5, ROUNDING) &&
      nclose(half.u, 0.5, ROUNDING),
  );

  // 3. At the second's instant.
  const opening: ReturnType<typeof at> = at(1.5);
  TestValidator.predicate(
    "at the second's instant",
    opening.index === 1 && nclose(opening.linear, 0, ROUNDING),
  );

  // 4. A quarter through the second.
  const quarter: ReturnType<typeof at> = at(2);
  TestValidator.predicate(
    "a quarter through the second",
    quarter.phase.name === "b" &&
      nclose(quarter.linear, 0.25, ROUNDING) &&
      nclose(quarter.u, QUARTER, ROUNDING),
  );

  // 5. The last to the end.
  const last: ReturnType<typeof at> = at(3.75);
  TestValidator.predicate(
    "the last phase to the end",
    last.index === 2 && nclose(last.linear, 0.5, ROUNDING),
  );
}
