import { Vector3 } from "@automovie/engine";
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
 * A porter's tray load set on the head, on its own: the pickUp by its end grip
 * and the putDown on the head bone of the head-load scene of
 * `test_motion_mechanism_carriage`, at the crown frame the original authors, on
 * the average man and the small woman, entered standing (the placing is the
 * scene's first action).
 *
 * Scenarios:
 *
 * 1. The pickUp closes the right hand on the basket's right handle and the basket
 *    rides it (`motionGraspUnit.pickUp`: the grasp and pickUp contracts).
 * 2. From `placed` the basket lies at the authored crown frame on the head, within
 *    the touch contract's 10 mm, and stays there within 5 mm to the putDown's
 *    end: the putDown contract wears a prop put `on` a bone at its offset in
 *    the bone's posed frame from `placed`.
 * 3. At the putDown's end the basket rests on the head: its origin above the head
 *    joint, the original's check.
 * 4. The pickUp and the putDown keep the shipped bounds over their own spans.
 *
 * Decomposes the original's resting check, read here at the placing's own end,
 * and adds the putDown's worn-frame goal, which the original reads only through
 * the walk after it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the original, its steps and checks, the entry, the bodies and every bound.
 * @evidence contracts/development/testing.md#behavioral-verification Performs stand > pickUp > putDown on the head and reads the displayed hand, basket and head, with the verdict report over each action's span; a hand off the handle, a basket off its crown frame or below the head or a finding in either action fails.
 * @evidence contracts/development/testing.md#independent-expectations The crown frame is the original's authored value; the placement bound is the touch contract's 10 mm, the custody bound the everyday prop specs' 5 mm; the putDown's worn goal is its public contract (`IAutoMovieMotionHumanPutDown`).
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies of opposite stature; the basket carried on the crown through the walk is the integration spec's.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances through the public chain, entered through `test_motion_mechanism_carriage_head_load_place`.
 */
export function test_motion_mechanism_carriage_head_load_place(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const name of ["m-average", "f-small"] as const) {
    const label: string = `${name} sets the load on the head`;
    try {
      place(checks, label, motionHumanBody(name));
    } catch (error: unknown) {
      checks.check(`${label}: ${everydayTake.describe(error)}`, false);
    }
  }
  checks.assert("a load is set on the crown of the head");
}

/** One body's placing and its checks. */
function place(
  checks: motionComplaints.IGatherer,
  label: string,
  body: IAutoMovieMotionHumanBody,
): void {
  const h: carriageScene.IHeadLoad = carriageScene.headLoad(body);
  const take: HumanPerformance = carriageScene.perform(
    `${label} head load`,
    body,
    h.props,
    carriageScene.place(HumanChain.subject("actor").stand(), h),
  );
  motionGraspUnit.pickUp(checks, label, take, body, {
    subject: "actor",
    side: "right",
    prop: "basket",
    model: h.basket,
    handle: "rightHandle",
    lift: 0,
  });
  const act: IAutoMovieMotionHumanSegment = motionActionUnit.segment(
    take,
    "actor",
    "putDown",
  );
  const placed: number = motionActionUnit.event(act, "placed");
  const worn: number = Vector3.distance(
    carriageScene.relative(take, "head", "basket", placed).position,
    h.crown.position,
  );
  checks.check(
    `${label}: the basket lies at its crown frame once placed (${(worn * 1000).toFixed(1)} mm)`,
    worn <= motionActionUnit.GRIP,
  );
  const drift: number = carriageScene.onBone(
    take,
    "head",
    "basket",
    placed,
    act.end,
  );
  checks.check(
    `${label}: the basket stays on the crown to the putDown's end (${(drift * 1000).toFixed(1)} mm)`,
    drift <= carriageScene.HOLD,
  );
  const above: number =
    take.prop("basket", act.end).position.y -
    take.bones("actor", act.end).get("head")!.worldPosition.y;
  checks.check(
    `${label}: the basket rests on the head (${(above * 1000).toFixed(0)} mm above the head joint)`,
    above > 0,
  );
  motionActionUnit.bounds(checks, label, take, "actor", act);
}
