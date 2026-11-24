import type { IAutoMovieMotionEvent } from "@automovie/interface";
import { everydayCaseKit } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/** Two segments of subject `a`: a walk over 1 to 3 s and a wave over 3 to 4 s. */
const SEGMENTS = (
  subject: string,
): {
  name: "walk" | "wave";
  start: number;
  plan: { duration: number; events: IAutoMovieMotionEvent[] };
}[] =>
  subject === "a"
    ? [
        {
          name: "walk",
          start: 1,
          plan: { duration: 2, events: [{ name: "step", share: 0.5 }] },
        },
        {
          name: "wave",
          start: 3,
          plan: { duration: 1, events: [{ name: "peak", share: 0.25 }] },
        },
      ]
    : [];
/**
 * `everydayCaseKit.event` is the film second of an event of a person's n-th
 * action: that segment's start plus the event's share of its plan.
 *
 * Subject `a` walks over 1 to 3 s, stepping at its middle, then waves over 3 to
 * 4 s, peaking a quarter in.
 *
 * Scenarios:
 *
 * 1. The first action's step lands at 2 s, the second action's peak at 3.25 s.
 */
export function test_unit_motions_executable_everyday_case_kit_event(): void {
  const shown: Parameters<typeof everydayCaseKit.event>[0] = {
    segments: SEGMENTS,
  };
  TestValidator.equals(
    "by action index",
    [
      everydayCaseKit.event(shown, "a", 0, "step"),
      everydayCaseKit.event(shown, "a", 1, "peak"),
    ],
    [2, 3.25],
  );
}
