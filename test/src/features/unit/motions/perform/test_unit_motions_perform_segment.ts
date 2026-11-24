import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanSegment,
} from "@automovie/interface";
import { HumanSegment } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/throwsError";
import { syntheticHumanSegment } from "../../../internal/synthetic/syntheticHumanSegment";

/**
 * `HumanSegment`'s small readers: a weapon's key among its person's stops, whether
 * a plan drives a hand, and a share of a plan from a share or an event name.
 *
 * Scenarios:
 *
 * 1. A weapon's key is the action's order and the weapon's id.
 * 2. A plan drives a hand it holds a contact window on or names, and no other.
 * 3. A share is itself; an event name gives its share; an unknown name is
 *    refused.
 */
export function test_unit_motions_perform_segment(): void {
  // 1. The stop key.
  const third: IAutoMovieMotionHumanSegment = syntheticHumanSegment({
    index: 2,
    entryTime: 0,
    end: 1,
    duration: 1,
  });
  TestValidator.equals(
    "the weapon key",
    HumanSegment.weapon(third, "fist"),
    "2:fist",
  );

  // 2. Driven hands.
  const gripping: IAutoMovieMotionHumanActionPlan = syntheticHumanSegment({
    entryTime: 0,
    end: 1,
    duration: 1,
    contacts: [
      {
        part: "leftHand",
        kind: "grip",
        from: 0,
        to: 1,
        support: { kind: "ground" },
      },
    ],
    hands: ["right"],
  }).plan;
  const idle: IAutoMovieMotionHumanActionPlan = third.plan;
  TestValidator.predicate(
    "a plan drives the hands it grips with or names",
    HumanSegment.drives(gripping, "left") &&
      HumanSegment.drives(gripping, "right") &&
      !HumanSegment.drives(idle, "left"),
  );

  // 3. Shares.
  const timed: IAutoMovieMotionHumanActionPlan = {
    ...idle,
    events: [{ name: "impact", share: 0.4 }],
  };
  TestValidator.predicate(
    "a share from a share or an event",
    HumanSegment.share(0.25, timed) === 0.25 &&
      HumanSegment.share("impact", timed) === 0.4 &&
      throwsError((): number => HumanSegment.share("release", timed)),
  );
}
