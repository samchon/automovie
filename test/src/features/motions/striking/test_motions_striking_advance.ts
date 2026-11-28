import type { IAutoMovieMotionHumanContactWindow } from "@automovie/interface";
import {
  motionClock
} from "../../../../../packages/motions/src/compose/internal/motionClock";
import {
  StrikingAdvance
} from "../../../../../packages/motions/src/striking/internal/StrikingAdvance";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** A product of two binary64 literals incurs less than four ulps below 1 m. */
const TRAVEL_ROUNDING_METRES: number = 4 * Number.EPSILON;

/**
 * An advancing stroke (`StrikingAdvance.travel`, `plants`): a step carries the
 * lead foot 0.2 statures, a lunge 0.45, none not at all; the rear foot stays
 * planted, the lead foot lifts between the stroke's start and the stroke, and
 * comes back between the relax and the end unless the striker stays.
 *
 * Scenarios:
 *
 * 1. A 1.8 m striker steps 0.36 m, lunges 0.81 m and holds still.
 * 2. On a 0.2 / 0.3 / 0.1 / 0.4 s phrase with the right foot leading, the left
 *    plants throughout, the right to 0.2 and from 0.5 to 0.6 of the stroke, or
 *    from 0.5 to the end staying.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines animation travel and lead and rear plant windows for step, lunge and stay.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the travel and plant helpers for a 1.8 m rig and a timed phrase with the right foot leading.
 * @evidence contracts/development/testing.md#independent-expectations Factors 0.2 and 0.45 yield 0.36 m and 0.81 m. Authored phase boundaries fix continuous rear plant and the distinct lead-foot windows.
 */
export function test_motions_striking_advance(): void {
  const tall = { body: { measure: { stature: 1.8 } } };
  TestValidator.predicate(
    "the travel",
      nclose(StrikingAdvance.travel(tall, "step"), 0.36, TRAVEL_ROUNDING_METRES) &&
      nclose(StrikingAdvance.travel(tall, "lunge"), 0.81, TRAVEL_ROUNDING_METRES) &&
      StrikingAdvance.travel(tall, "none") === 0,
  );
  const clock = motionClock.phrase({
    prepare: 0.2,
    attack: 0.3,
    hold: 0.1,
    retract: 0.4,
  });
  const ground: IAutoMovieMotionHumanContactWindow["support"] = {
    kind: "ground",
  };
  TestValidator.equals(
    "the plants",
    StrikingAdvance.plants("right", clock, false),
    [
      { part: "leftFoot", kind: "plant", from: 0, to: 1, support: ground },
      { part: "rightFoot", kind: "plant", from: 0, to: 0.2, support: ground },
      { part: "rightFoot", kind: "plant", from: 0.5, to: 0.6, support: ground },
    ],
  );
  TestValidator.equals(
    "staying",
    StrikingAdvance.plants("right", clock, true)[2]!.to,
    1,
  );
}
