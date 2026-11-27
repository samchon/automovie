import type {
  IAutoMovieMotionHumanLayer,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";
import {
  HumanSegmentSelection
} from "../../../../../packages/motions/src/perform/internal/HumanSegmentSelection";
import {
  HumanSegmentStill
} from "../../../../../packages/motions/src/perform/internal/HumanSegmentStill";
import { TestValidator } from "@nestia/e2e";

import { syntheticHumanPlan } from "../../internal/synthetic/syntheticHumanPlan";

/** Rounding of a representative second's step to its plan second, seconds. */
const ROUNDING: number = 1e-12;

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
 * 3. Past the plan's end (3 s to 4 s) the pose is constant; across the next entry
 *    it is not.
 * 4. The representative of 2.2 s is the window's start, 1.5 s; of 3.5 s the plan's
 *    end, 3 s; of 1.2 s, before the window, none.
 * 5. A layer makes nothing still.
 */
export function test_motions_perform_segment_still(): void {
  const first: HumanSegmentStill.ISegment = {
    entryTime: 1,
    start: 1,
    plan: syntheticHumanPlan({ duration: 2, still: [0.5, 1.5] }),
  };
  const second: HumanSegmentStill.ISegment = {
    entryTime: 4,
    start: 4,
    plan: syntheticHumanPlan({ duration: 2 }),
  };
  const person: HumanSegmentStill.IPerson = {
    layers: [],
    overlays: [],
    holds: [],
    stops: new Map(),
    segments: [first, second],
  };

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
    Math.abs(HumanSegmentStill.representative(person, 2.2)! - 1.5) < ROUNDING &&
      Math.abs(HumanSegmentStill.representative(person, 3.5)! - 3) < ROUNDING &&
      HumanSegmentStill.representative(person, 1.2) === undefined,
  );

  // 5. A layer.
  const sway: IAutoMovieMotionHumanLayer = {
    name: "sway",
    apply: (
      posture: IAutoMovieMotionHumanPosture,
    ): IAutoMovieMotionHumanPosture => posture,
  };
  TestValidator.predicate(
    "a layer makes nothing still",
    !HumanSegmentStill.within(
      {
        ...person,
        layers: [{ layer: sway, from: -Infinity, to: Infinity, fade: 0 }],
      },
      1.6,
      2.4,
    ),
  );
}
