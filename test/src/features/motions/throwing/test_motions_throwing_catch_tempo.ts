import type { IAutoMovieMotionClock } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { catchObject } from "../../../../../packages/motions/src/throwing/internal/catchObject";
import { nclose } from "../../internal/nclose";

/**
 * The catch clock moves hand phases around a fixed interception.
 *
 * Scenarios:
 *
 * 1. Doubling the tempo doubles reach, give and carry time. The contact,
 *    preparation lead and final hold stay fixed.
 * 2. An earlier planned reach starts at action entry when time runs out.
 * 3. A contact less than 100 ms after entry still refuses.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the fixed interception, pace changes and late entry case.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the catch clock used by the law and reads its named phases.
 * @evidence contracts/development/testing.md#independent-expectations Derives the times from the prescribed contact and the scaled reach, give and carry spans. The original hold and the minimum lead constrain independent intervals.
 */
export function test_motions_throwing_catch_tempo(): void {
  const nominal: IAutoMovieMotionClock = catchObject.clock(
    1.5,
    0.4,
    1,
    "release",
  );
  const slower: IAutoMovieMotionClock = catchObject.clock(
    1.5,
    0.4,
    2,
    "release",
  );
  for (const clock of [nominal, slower])
    TestValidator.predicate(
      "contact, lead and hold stay fixed",
      nclose(clock.at("contact"), 1.5, 1e-12) &&
        nclose(clock.at("prepare"), 1.4, 1e-12) &&
        nclose(clock.duration - clock.at("held"), 0.6, 1e-12),
    );
  TestValidator.predicate(
    "moving windows scale on either side of contact",
    nclose(nominal.at("reach"), 1.1, 1e-12) &&
      nclose(nominal.at("secured"), 1.65, 1e-12) &&
      nclose(nominal.at("held"), 2.05, 1e-12) &&
      nclose(slower.at("reach"), 0.7, 1e-12) &&
      nclose(slower.at("secured"), 1.8, 1e-12) &&
      nclose(slower.at("held"), 2.6, 1e-12),
  );
  TestValidator.predicate(
    "an early reach starts at action entry",
    nclose(catchObject.clock(0.35, 0.4, 2, "release").at("reach"), 0, 1e-12),
  );
  TestValidator.error("slower motion keeps the late entry refusal", () =>
    catchObject.clock(0.05, 0.4, 2, "release"),
  );
}
