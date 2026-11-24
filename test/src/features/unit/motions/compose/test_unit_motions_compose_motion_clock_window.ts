import type { IAutoMovieMotionClock } from "@automovie/interface";
import { AutoMovieMotionClock } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * `AutoMovieMotionClock.prepare` and `prepareEnvelope` resolve a window's
 * instants once: the uniform share across the window, its minimum-jerk
 * progress, and an envelope that rises over one window and falls over another.
 *
 * A 2 s clock names `a` at 0.5 s and `b` at 1.5 s.
 *
 * Scenarios:
 *
 * 1. Across `a` to `b`, the share is 0 at and before `a`, one half at 1 s and 1 at
 *    and after `b`; the minimum-jerk progress is one half at 1 s too.
 * 2. Rising from `start` to `a` and falling from `b` to `end`, the envelope is 0
 *    at 0 s, 1 at 1 s and one half at 1.75 s.
 */
export function test_unit_motions_compose_motion_clock_window(): void {
  const clock: IAutoMovieMotionClock = AutoMovieMotionClock(2, [
    { name: "a", seconds: 0.5 },
    { name: "b", seconds: 1.5 },
  ]);

  // 1. The window.
  const window: ReturnType<typeof AutoMovieMotionClock.prepare> =
    AutoMovieMotionClock.prepare(clock, "a", "b");
  TestValidator.predicate(
    "the window's share and progress",
    window.linear(0.2) === 0 &&
      nclose(window.linear(1), 0.5, 1e-12) &&
      window.linear(1.8) === 1 &&
      nclose(window.progress(1), 0.5, 1e-12),
  );

  // 2. The envelope.
  const envelope: (seconds: number) => number =
    AutoMovieMotionClock.prepareEnvelope(clock, ["start", "a"], ["b", "end"]);
  TestValidator.predicate(
    "the envelope rises, holds and falls",
    envelope(0) === 0 &&
      nclose(envelope(1), 1, 1e-12) &&
      nclose(envelope(1.75), 0.5, 1e-12),
  );
}
