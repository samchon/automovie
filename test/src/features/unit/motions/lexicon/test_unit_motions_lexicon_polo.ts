import { humanPoloTimetable } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { throwsError } from "../../../internal/throwsError";

/**
 * The `HumanPolo` law's timetable (`humanPoloTimetable`): around the authored
 * contact, the take-away 0.9 s before it (a 0.5 s take-away and a 0.4 s
 * down-swing), the top 0.4 s before it, the finish 0.35 s after it and a 0.6 s
 * settle; the lean out at most 45 degrees.
 *
 * Scenarios:
 *
 * 1. A contact at 2 s takes away at 1.1 s, tops at 1.6 s, finishes at 2.35 s and
 *    settles by 2.95 s, leaning the most, 45 degrees, at 20 m/s.
 * 2. A contact at 1 s, before the lean, take-away and down-swing fit, or a lean
 *    of 60 degrees, is refused.
 */
export function test_unit_motions_lexicon_polo(): void {
  const timetable: humanPoloTimetable.ITimetable = humanPoloTimetable({
    contact: 2,
  });
  TestValidator.predicate(
    "the stroke's instants",
    nclose(timetable.takeAway, 1.1, 1e-12) &&
      nclose(timetable.top, 1.6, 1e-12) &&
      nclose(timetable.finish, 2.35, 1e-12) &&
      nclose(timetable.duration, 2.95, 1e-12) &&
      timetable.lean === 45 &&
      timetable.speed === 20 &&
      nclose(timetable.events[2]!.share, 2 / 2.95, 1e-12),
  );
  TestValidator.predicate(
    "too soon, or too far out",
    throwsError(() => humanPoloTimetable({ contact: 1 })) &&
      throwsError(() => humanPoloTimetable({ contact: 2, lean: 60 })),
  );
}