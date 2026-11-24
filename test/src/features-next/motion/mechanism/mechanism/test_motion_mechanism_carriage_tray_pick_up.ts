import { createServingTray } from "@automovie/archetypes";
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
 * A waiter's tray taken on the flat palm with a bowl on it, on its own: the
 * pickUp of the tray scene of `test_motion_mechanism_carriage`, on the average
 * man and the small woman, entered standing (the pickUp is the scene's first
 * action).
 *
 * Scenarios:
 *
 * 1. The pickUp lays the right hand on the tray's `palm` support and the tray
 *    rides it (`motionGraspUnit.pickUp`: the grasp and pickUp contracts).
 * 2. The bowl mounted on the tray stays on it over the pickUp: its distance from
 *    the tray's origin changes by at most the original's 5 mm.
 * 3. The pickUp keeps the shipped bounds over its own span.
 *
 * The original reads no goal of this step; its bowl check spans the walks after
 * the raise.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the original and step it decomposes, the entry, the bodies and every bound.
 * @evidence contracts/development/testing.md#behavioral-verification Performs stand > pickUp and reads the displayed hand, tray and bowl, with the verdict report over the pickUp's span; a hand off the tray's support, a tray slipping on it, a bowl sliding off or a finding in the pickUp fails.
 * @evidence contracts/development/testing.md#independent-expectations The support's place is the archetype's `palm` affordance under the pickUp contract; the 5 mm custody bound is the original's.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies of opposite stature; the level raise is `test_motion_mechanism_carriage_tray_raise`'s and the carry through the walks the integration spec's.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances through the public chain, entered through `test_motion_mechanism_carriage_tray_pick_up`.
 */
export function test_motion_mechanism_carriage_tray_pick_up(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const name of ["m-average", "f-small"] as const) {
    const label: string = `${name} takes the tray on the palm`;
    try {
      take(checks, label, motionHumanBody(name));
    } catch (error: unknown) {
      checks.check(`${label}: ${everydayTake.describe(error)}`, false);
    }
  }
  checks.assert("a tray is taken on the flat palm with its bowl on it");
}

/** One body's pickUp and its checks. */
function take(
  checks: motionComplaints.IGatherer,
  label: string,
  body: IAutoMovieMotionHumanBody,
): void {
  const film: HumanPerformance = carriageScene.perform(
    `${label} tray pick-up`,
    body,
    carriageScene.trayProps(),
    carriageScene.lift(HumanChain.subject("actor").stand()),
  );
  motionGraspUnit.pickUp(checks, label, film, body, {
    subject: "actor",
    side: "right",
    prop: "tray",
    model: createServingTray({ id: "tray" }),
    handle: "palm",
    lift: 0,
  });
  const act: IAutoMovieMotionHumanSegment = motionActionUnit.segment(
    film,
    "actor",
    "pickUp",
  );
  const moved: number = Math.abs(
    carriageScene.bowl(film, act.end) - carriageScene.bowl(film, act.start),
  );
  checks.check(
    `${label}: the bowl stays on the tray (${(moved * 1000).toFixed(1)} mm)`,
    moved <= carriageScene.HOLD,
  );
}
