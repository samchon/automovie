import type { IAutoMovieMotionHumanContactWindow } from "@automovie/interface";
import { punchFootwork } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** A rear-hand punch shown at 0.4 s of 1 s, the right foot rear. */
const STILL: punchFootwork.ISchedule = {
  duration: 1,
  shown: 0.4,
  first: "left",
  next: "right",
  rear: "right",
  which: "rear",
  stepping: false,
  firstStart: 0,
  dragFrom: 0.2,
  dragTo: 0.6,
  landing: { left: 0, right: 0 },
};

/**
 * A punch's footwork (`punchFootwork.drag`, `carried`, `contacts`): the rear
 * foot drags from halfway to the shown reach to halfway through the recoil; at
 * the shown reach the body has carried halfway plus half the drag; the rear
 * foot pivots under a rear-hand punch; stepping, the first foot leaves and
 * lands at the shown reach, the following foot bears until it leaves and plants
 * from its landing.
 *
 * Scenarios:
 *
 * 1. Shown at 0.4 s and recoiling 0.4 s, the drag runs 0.2 to 0.6 s: none, half
 *    and all at 0.2, 0.4 and 0.6 s; at the shown reach the body has carried
 *    0.75.
 * 2. Standing, the left plants and the right pivots throughout.
 * 3. Stepping, the left plants until it leaves at 0.1 s and again from 0.4 s; the
 *    right pivots until it leaves at 0.2 s and plants from 0.6 s.
 */
export function test_unit_motions_striking_punch_footwork(): void {
  const timing = { shown: 0.4, recoil: 0.4 };
  TestValidator.predicate(
    "the drag",
    nclose(punchFootwork.drag(timing, 0.2), 0, 1e-12) &&
      nclose(punchFootwork.drag(timing, 0.4), 0.5, 1e-12) &&
      nclose(punchFootwork.drag(timing, 0.6), 1, 1e-12) &&
      nclose(punchFootwork.carried(timing), 0.75, 1e-12),
  );
  const ground: IAutoMovieMotionHumanContactWindow["support"] = {
    kind: "ground",
  };
  TestValidator.equals("standing", punchFootwork.contacts(STILL), [
    { part: "leftFoot", kind: "plant", from: 0, to: 1, support: ground },
    { part: "rightFoot", kind: "pivot", from: 0, to: 1, support: ground },
  ]);
  TestValidator.equals(
    "stepping",
    punchFootwork.contacts({ ...STILL, stepping: true, firstStart: 0.1 }),
    [
      { part: "leftFoot", kind: "plant", from: 0.4, to: 1, support: ground },
      { part: "leftFoot", kind: "plant", from: 0, to: 0.1, support: ground },
      { part: "rightFoot", kind: "pivot", from: 0, to: 0.2, support: ground },
      { part: "rightFoot", kind: "plant", from: 0.6, to: 1, support: ground },
    ],
  );
}
