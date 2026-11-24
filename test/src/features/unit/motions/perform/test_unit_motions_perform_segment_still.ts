import type { IAutoMovieMotionHumanSegment } from "@automovie/interface";
import {
  HumanSegmentSelection,
  HumanSegmentStill,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { syntheticHumanPerson } from "../../../internal/synthetic/syntheticHumanPerson";
import { syntheticHumanSegment } from "../../../internal/synthetic/syntheticHumanSegment";

/**
 * `HumanSegmentSelection.last` is the last action entered by a second, and
 * `HumanSegmentStill` reads where the shown pose holds still: the same active
 * action, no offset still decaying, and the same clamped plan second or a
 * declared still window.
 *
 * One action enters at 1 s with its law's zero there, lasts 2 s and declares
 * its posture still from 0.5 to 1.5 plan seconds; a second enters at 4 s.
 *
 * Scenarios:
 *
 * 1. Before 1 s no action is active; from 1 s the first, from 4 s the second.
 * 2. Within the still window the pose is constant, across its edge it is not.
 * 3. Past the plan's end (3 s to 4 s) the pose is constant; across the next
 *    entry it is not.
 * 4. The representative of 2.2 s is the window's start, 1.5 s; of 3.5 s the
 *    plan's end, 3 s; of 1.2 s, before the window, none.
 * 5. A layer makes nothing still.
 */
export function test_unit_motions_perform_segment_still(): void {
  const first: IAutoMovieMotionHumanSegment = syntheticHumanSegment({
    entryTime: 1,
    end: 4,
    duration: 2,
    still: [0.5, 1.5],
  });
  const second: IAutoMovieMotionHumanSegment = syntheticHumanSegment({
    index: 1,
    entryTime: 4,
    end: 6,
    duration: 2,
  });
  const person: IAutoMovieMotionHumanSegment.IPerson = syntheticHumanPerson(
    "ann",
    [first, second],
  );

  // 1. Selection.
  TestValidator.predicate(
    "the last entered action is active",
    HumanSegmentSelection.last(person.segments, 0.5) === undefined &&
      HumanSegmentSelection.last(person.segments, 1) === first &&
      HumanSegmentSelection.last(person.segments, 4) === second,
  );

  // 2. The still window.
  TestValidator.predicate(
    "constant within the still window only",
    HumanSegmentStill.within(person, 1.6, 2.4) &&
      !HumanSegmentStill.within(person, 1.2, 1.8),
  );

  // 3. Past the plan's end.
  TestValidator.predicate(
    "constant past the plan's end, not across an entry",
    HumanSegmentStill.within(person, 3.1, 3.9) &&
      !HumanSegmentStill.within(person, 3.5, 4.5),
  );

  // 4. Representatives.
  TestValidator.predicate(
    "the earliest second showing the same pose",
    Math.abs(HumanSegmentStill.representative(person, 2.2)! - 1.5) < 1e-12 &&
      Math.abs(HumanSegmentStill.representative(person, 3.5)! - 3) < 1e-12 &&
      HumanSegmentStill.representative(person, 1.2) === undefined,
  );

  // 5. A layer.
  const layered: IAutoMovieMotionHumanSegment.IPerson = {
    ...person,
    layers: [
      {
        layer: {
          name: "sway",
          apply: (posture) => posture,
        },
        from: -Infinity,
        to: Infinity,
        fade: 0,
      },
    ],
  };
  TestValidator.predicate(
    "a layer makes nothing still",
    !HumanSegmentStill.within(layered, 1.6, 2.4),
  );
}
