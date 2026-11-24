import type { IAutoMovieMotionEvent } from "@automovie/interface";
import { TouchVerdicts } from "@automovie/motions/internal";
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
 * `TouchVerdicts.event` is the film second of an event of a performer's action,
 * the first when no index is given, refusing an event that action lacks.
 *
 * Subject `a` walks over 1 to 3 s, stepping at its middle, then waves over 3 to
 * 4 s, peaking a quarter in.
 *
 * Scenarios:
 *
 * 1. The step lands at 2 s; the second action's peak at 3.25 s.
 * 2. A peak asked of the walk is refused.
 */
export function test_unit_motions_executable_touch_verdicts_event(): void {
  const shown: Parameters<typeof TouchVerdicts.event>[0] = {
    segments: SEGMENTS,
  };
  TestValidator.equals(
    "the events' seconds",
    [
      TouchVerdicts.event(shown, "a", "step"),
      TouchVerdicts.event(shown, "a", "peak", 1),
    ],
    [2, 3.25],
  );
  TestValidator.predicate(
    "not in that action",
    throwsError(() => TouchVerdicts.event(shown, "a", "peak")),
  );
}
