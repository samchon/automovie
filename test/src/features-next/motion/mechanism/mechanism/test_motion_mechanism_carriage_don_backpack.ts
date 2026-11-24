import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanPerformance } from "@automovie/motions";

import { everydayTake } from "../../../../features/internal/everydayTake";
import { motionComplaints } from "../../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../../features/internal/motionHumanBody";
import { carriageScene } from "../../../internal/carriageScene";
import { motionActionUnit } from "../../../internal/motionActionUnit";
import { motionGraspUnit } from "../../../internal/motionGraspUnit";

/**
 * A backpack put on by its strap, on its own: the first two actions of the
 * airport arrival of `test_motion_mechanism_carriage`, pickUp by the right
 * strap and putDown on the chest bone at the worn frame the original authors,
 * on the average man and the small woman, entered standing (the donning is the
 * scene's first action).
 *
 * Scenarios:
 *
 * 1. The pickUp closes the right hand on the right strap and the pack rides it
 *    (`motionGraspUnit.pickUp`: the grasp and pickUp contracts).
 * 2. At the putDown's end each strap passes over its own shoulder: the strap's
 *    point within 100 mm of the shoulder joint, read level, the original's
 *    bound.
 * 3. From `placed` the pack lies at the authored worn frame on the chest, within
 *    the touch contract's 10 mm, and stays there within 5 mm to the putDown's
 *    end: the putDown contract wears a prop put `on` a bone at its offset in
 *    the bone's posed frame from `placed`.
 * 4. The pickUp and the putDown keep the shipped bounds over their own spans,
 *    which include prop and body penetration: no strap passes through an arm or
 *    the trunk.
 *
 * Decomposes the original's strap check, read here at the donning's own end,
 * and adds the putDown's worn-frame goal, which the original reads only through
 * the walk after it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the original, its steps and checks, the entry, the bodies and every bound.
 * @evidence contracts/development/testing.md#behavioral-verification Performs stand > pickUp > putDown on the chest and reads the displayed hand, straps, shoulders and pack on the chest bone, with the verdict report over each action's span; a hand off the strap, a strap off its shoulder, a pack off its worn frame or a finding in either action fails.
 * @evidence contracts/development/testing.md#independent-expectations The worn frame and the 100 mm strap bound are the original's authored values; the placement bound is the touch contract's 10 mm, the custody bound the everyday prop specs' 5 mm; the putDown's worn goal is its public contract (`IAutoMovieMotionHumanPutDown`).
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies of opposite stature; the doffing is `test_motion_mechanism_carriage_doff_backpack`'s and the pack worn through the walk the integration spec's.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances through the public chain, entered through `test_motion_mechanism_carriage_don_backpack`.
 */
export function test_motion_mechanism_carriage_don_backpack(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const name of ["m-average", "f-small"] as const) {
    const label: string = `${name} dons the backpack`;
    try {
      don(checks, label, motionHumanBody(name));
    } catch (error: unknown) {
      checks.check(`${label}: ${everydayTake.describe(error)}`, false);
    }
  }
  checks.assert("a backpack is put on by its strap over both shoulders");
}

/** One body's donning and its checks. */
function don(
  checks: motionComplaints.IGatherer,
  label: string,
  body: IAutoMovieMotionHumanBody,
): void {
  const a: carriageScene.IArrival = carriageScene.arrival(body);
  const take: HumanPerformance = carriageScene.perform(
    `${label} don`,
    body,
    a.props,
    carriageScene.don(HumanChain.subject("actor").stand(), a),
  );
  motionGraspUnit.pickUp(checks, label, take, body, {
    subject: "actor",
    side: "right",
    prop: "pack",
    model: a.pack,
    handle: "rightStrap",
    lift: 0,
  });
  const act: IAutoMovieMotionHumanSegment = motionActionUnit.segment(
    take,
    "actor",
    "putDown",
  );
  for (const side of ["left", "right"] as const) {
    const strap: IAutoMovieVector3 = everydayTake.point(
      take,
      a.pack,
      "pack",
      `${side}Strap`,
      act.end,
    );
    const shoulder: IAutoMovieVector3 = take
      .bones("actor", act.end)
      .get(`${side}UpperArm`)!.worldPosition;
    const off: number = Vector3.distance(
      { ...strap, y: 0 },
      { ...shoulder, y: 0 },
    );
    checks.check(
      `${label}: the ${side} strap passes over the ${side} shoulder (${(off * 1000).toFixed(0)} mm, read level)`,
      off <= carriageScene.STRAP,
    );
  }
  const placed: number = motionActionUnit.event(act, "placed");
  const worn: number = Vector3.distance(
    carriageScene.relative(take, "chest", "pack", placed).position,
    a.worn.position,
  );
  checks.check(
    `${label}: the pack lies at its worn frame on the chest once placed (${(worn * 1000).toFixed(1)} mm)`,
    worn <= motionActionUnit.GRIP,
  );
  const drift: number = carriageScene.onBone(
    take,
    "chest",
    "pack",
    placed,
    act.end,
  );
  checks.check(
    `${label}: the pack stays worn on the chest to the putDown's end (${(drift * 1000).toFixed(1)} mm)`,
    drift <= carriageScene.HOLD,
  );
  motionActionUnit.bounds(checks, label, take, "actor", act);
}
