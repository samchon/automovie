import type {
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanSegment,
} from "@automovie/interface";
import { HumanPerformanceMeeting } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { actingPerformanceState } from "../../../internal/fixtures/actingPerformanceState";

/**
 * `HumanPerformanceMeeting.seated` reads whether a seat bears a performer at a
 * second: the action active then holds a seat window open at its share of that
 * second, the last action after every end.
 *
 * A first action from 0 to 2 s seats the performer over the middle half of its
 * plan; a second from 2 to 4 s seats nothing; a third, entered at 4.5 s from
 * its zero at 4 s, seats the performer over its first tenth.
 *
 * Scenarios:
 *
 * 1. Seated at 1 s and at the window's edges, 0.5 and 1.5 s; not at 0.2 s.
 * 2. From 2 s the second action is active: not seated.
 * 3. Between the second's end and the third's entry (4.2 s) no action is
 *    active, and the last placed one is read: its share, a tenth, is on its
 *    first window; at 4.5 s its share is a quarter, past it.
 * 4. After every end the last action's share is clamped to its end.
 * 5. Without actions nobody is seated.
 */
export async function test_unit_motions_perform_meeting_seated(): Promise<void> {
  const seat = (
    from: number,
    to: number,
  ): IAutoMovieMotionHumanContactWindow => ({
    part: "seat",
    kind: "seat",
    from,
    to,
    support: { kind: "ground" },
  });
  const self = await actingPerformanceState(
    [],
    [
      { start: 0, end: 2, duration: 2, plan: { contacts: [seat(0.25, 0.75)] } },
      { start: 2, end: 4, duration: 2 },
      {
        start: 4,
        entryTime: 4.5,
        end: 6,
        duration: 2,
        plan: { contacts: [seat(0, 0.1), seat(0.9, 1)] },
      },
    ],
  );
  const segments: readonly IAutoMovieMotionHumanSegment[] =
    self.people.get("actor")!.segments;
  const at = (seconds: number): boolean =>
    HumanPerformanceMeeting.seated(segments, seconds);
  TestValidator.equals(
    "seated by the active action's windows",
    [1, 0.5, 1.5, 0.2, 2, 3, 4.2, 4.5, 9].map(at),
    [true, true, true, false, false, false, true, false, true],
  );
  TestValidator.predicate(
    "nobody seated without actions",
    !HumanPerformanceMeeting.seated([], 1),
  );
}
