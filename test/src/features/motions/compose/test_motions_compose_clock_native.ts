import { AutoMovieEngineMotionSampling } from "@automovie/engine";
import type { IAutoMovieMotionClock } from "@automovie/interface";
import {
  motionClock
} from "../../../../../packages/motions/src/compose/internal/motionClock";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";

/** Rounding of a quintic, a share. */
const ROUNDING: number = 1e-12;

/**
 * An action's clock: named instants over a positive duration, `start` at zero
 * and `end` at the duration, each other name once and within the duration (one
 * a rounding past the end held at it), the instants sorted by second; a
 * window's linear share, its minimum-jerk progress, an envelope rising over one
 * window and falling over another, never below zero, and the instants as events
 * at their shares.
 *
 * Scenarios, a 4 s clock naming `b` at 3 s and `a` at 1 s:
 *
 * 1. The instants sorted, `start` and `end` at 0 and 4, the events at 0.25 and
 *    0.75.
 * 2. From `a` to `b` at 2 s: linear 0.5, progress s(0.5); before and after held.
 * 3. Rising from `start` to `a` and falling from `a` to `b`: at 2 s, 1 − s(½).
 * 4. A zero duration, a repeated name, `start` named again, an instant past the
 *    end and an unknown name are refused; an instant a rounding past the end is
 *    held at it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names ordered instants, reserved endpoints, window and envelope values, rounding near the end and malformed clock or name refusals.
 * @evidence contracts/development/testing.md#behavioral-verification Builds motionClock from an unsorted typed instant list and reads instants, events and timing methods, alongside invalid durations and names.
 * @evidence contracts/development/testing.md#independent-expectations In a four-second clock, the authored seconds 1 and 3 are shares 0.25 and 0.75. At second 2 the interval midpoint has share 0.5. The progress comparisons exercise forwarding of the established timing law.
 */
export function test_motions_compose_clock_native(): void {
  const clock: IAutoMovieMotionClock = motionClock(4, [
    { name: "b", seconds: 3 },
    { name: "a", seconds: 1 },
  ]);

  // 1. Instants and events.
  TestValidator.equals(
    "sorted instants and their shares",
    [
      clock.instants.map((i: { name: string }): string => i.name),
      clock.at("start"),
      clock.at("end"),
      clock.events().map((e: { share: number }): number => e.share),
    ],
    [["a", "b"], 0, 4, [0.25, 0.75]],
  );

  // 2. Linear and progress.
  TestValidator.predicate(
    "a window's linear share and its minimum-jerk progress",
    clock.linear("a", "b", 2) === 0.5 &&
      nclose(clock.progress("a", "b", 2), AutoMovieEngineMotionSampling.minimumJerkShare(0.5), ROUNDING) &&
      clock.linear("a", "b", 0) === 0 &&
      clock.linear("a", "b", 4) === 1,
  );

  // 3. The envelope.
  TestValidator.predicate(
    "the envelope",
    nclose(
      clock.envelope(["start", "a"], ["a", "b"], 2),
      1 - AutoMovieEngineMotionSampling.minimumJerkShare(0.5),
      ROUNDING,
    ) && clock.envelope(["a", "b"], ["start", "a"], 2) === 0,
  );

  // 4. Refusals.
  TestValidator.predicate(
    "invalid clocks and names are refused, a rounding past the end held",
    throwsError((): unknown => motionClock(0, [])) &&
      throwsError((): unknown =>
        motionClock(4, [
          { name: "a", seconds: 1 },
          { name: "a", seconds: 2 },
        ]),
      ) &&
      throwsError((): unknown =>
        motionClock(4, [{ name: "start", seconds: 1 }]),
      ) &&
      throwsError((): unknown =>
        motionClock(4, [{ name: "a", seconds: 5 }]),
      ) &&
      throwsError((): unknown => clock.at("c"), "no instant") &&
      motionClock(4, [{ name: "a", seconds: 4 + 1e-12 }]).at("a") ===
        4,
  );
}
