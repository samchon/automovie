import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
} from "@automovie/interface";
import { HumanChain, HumanPerformance } from "@automovie/motions";

import { everydayTake } from "../../../../features/internal/everydayTake";
import { motionComplaints } from "../../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../../features/internal/motionHumanBody";
import { carriageScene } from "../../../internal/carriageScene";
import { motionActionUnit } from "../../../internal/motionActionUnit";
import { motionGraspUnit } from "../../../internal/motionGraspUnit";

/**
 * A worn backpack taken off by its strap, on its own: the last two actions of
 * the airport arrival of `test_motion_mechanism_carriage`, pickUp by the right
 * strap off the back and workHeld swinging it round before the body, on the
 * average man and the small woman, entered by the minimal chain stand > pickUp
 *
 * > PutDown on the chest (the pack worn; the case and the walks between are left
 * > out).
 *
 * Scenarios:
 *
 * 1. The second pickUp closes the right hand on the worn pack's right strap and
 *    the pack rides it (`motionGraspUnit.pickUp`: the grasp and pickUp
 *    contracts).
 * 2. The pack comes off by its strap: from the pickUp's start to the film's end it
 *    leaves its worn frame on the chest by at least 50 mm, and from the
 *    pickUp's end it rides the right hand within 5 mm, the original's check.
 * 3. The pickUp and the workHeld keep the shipped bounds over their own spans.
 *
 * Decomposes the original's doffing check, read here on a pack entered worn by
 * its own minimal chain.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the original, its steps and check, the entry, the bodies and every bound.
 * @evidence contracts/development/testing.md#behavioral-verification Performs stand > pickUp > putDown on the chest > pickUp > workHeld and reads the displayed hand and pack on the chest bone and in the hand, with the verdict report over each doffing action's span; a pack left on the back, slipping in the hand or a finding in either action fails.
 * @evidence contracts/development/testing.md#independent-expectations The 50 mm departure and the 5 mm custody are the original's bounds; the grasp's place is the pickUp contract's on the archetype's strap.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies of opposite stature; the donning is `test_motion_mechanism_carriage_don_backpack`'s.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances through the public chain, entered through `test_motion_mechanism_carriage_doff_backpack`.
 */
export function test_motion_mechanism_carriage_doff_backpack(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const name of ["m-average", "f-small"] as const) {
    const label: string = `${name} takes off the backpack`;
    try {
      doff(checks, label, motionHumanBody(name));
    } catch (error: unknown) {
      checks.check(`${label}: ${everydayTake.describe(error)}`, false);
    }
  }
  checks.assert("a worn backpack comes off by its strap");
}

/** One body's doffing and its checks. */
function doff(
  checks: motionComplaints.IGatherer,
  label: string,
  body: IAutoMovieMotionHumanBody,
): void {
  const a: carriageScene.IArrival = carriageScene.arrival(body);
  const take: HumanPerformance = carriageScene.perform(
    `${label} doff`,
    body,
    a.props,
    carriageScene.doff(
      carriageScene.don(HumanChain.subject("actor").stand(), a),
      body,
    ),
  );
  motionGraspUnit.pickUp(checks, label, take, body, {
    subject: "actor",
    side: "right",
    prop: "pack",
    model: a.pack,
    handle: "rightStrap",
    lift: 0,
    occurrence: 2,
  });
  const off: IAutoMovieMotionHumanSegment = motionActionUnit.segment(
    take,
    "actor",
    "pickUp",
    2,
  );
  const left: number = carriageScene.onBone(
    take,
    "chest",
    "pack",
    off.start,
    take.duration,
  );
  const held: number = everydayTake.drift(
    take,
    "right",
    "pack",
    off.end,
    take.duration,
  );
  checks.check(
    `${label}: the backpack comes off by its strap (${(left * 1000).toFixed(0)} mm off the back, ${(held * 1000).toFixed(1)} mm in the hand)`,
    left >= carriageScene.OFF && held <= carriageScene.HOLD,
  );
  motionActionUnit.bounds(
    checks,
    label,
    take,
    "actor",
    motionActionUnit.segment(take, "actor", "workHeld"),
  );
}
