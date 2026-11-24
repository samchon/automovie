import type { IAutoMovieMotionEvent } from "@automovie/interface";
import { FamilyCaseKit } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/throwsError";

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
 * `FamilyCaseKit.event` is the film second of a named event of a subject's
 * first action that has it: the segment's start plus the event's share of its
 * plan.
 *
 * Subject `a` walks over 1 to 3 s, stepping at its middle, then waves over 3 to
 * 4 s, peaking a quarter in.
 *
 * Scenarios:
 *
 * 1. The step lands at 2 s and the peak at 3.25 s.
 * 2. An event no action has, or a subject with no action, is refused.
 */
export function test_unit_motions_executable_family_case_kit_event(): void {
  const shown: Parameters<typeof FamilyCaseKit.event>[0] = {
    segments: SEGMENTS,
  };
  TestValidator.equals(
    "the events' seconds",
    [FamilyCaseKit.event(shown, "step"), FamilyCaseKit.event(shown, "peak")],
    [2, 3.25],
  );
  TestValidator.predicate(
    "missing",
    throwsError(() => FamilyCaseKit.event(shown, "jump")) &&
      throwsError(() => FamilyCaseKit.event(shown, "step", "b")),
  );
}
