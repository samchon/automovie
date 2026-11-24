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

/**
 * A suitcase's pull handle drawn out, on its own: the operate step of the
 * airport arrival of `test_motion_mechanism_carriage`, the stooped left hand
 * drawing the `telescope` slider by its whole travel, on the average man and
 * the small woman, entered standing (the backpack's donning before it is left
 * out: it moves neither the case nor the left arm).
 *
 * Scenarios:
 *
 * 1. At the operation's end the telescope stands drawn by the asked travel, the
 *    archetype's own `travel`, within the touch contract's 10 mm: the operate
 *    drive moves the articulation from where the performance has it at the
 *    start by the mechanism's amount, metres for a slider.
 * 2. The operation keeps the shipped bounds over its own span.
 *
 * The original reads no goal of this step; a handle left undrawn shows there
 * only as a grasp of the pull bar at its stowed height.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the original and step it decomposes, the entry, the bodies and every bound.
 * @evidence contracts/development/testing.md#behavioral-verification Performs stand > operate(slider) and reads the case's articulation state at the operation's end, with the verdict report over its span; a handle drawn short or past its travel or a finding in the operation fails.
 * @evidence contracts/development/testing.md#independent-expectations The travel is the archetype's (`createBag`'s `telescope`), the drive's rule is the operate contract's (`IAutoMovieMotionHumanOperateDrive`), the bound the touch contract's 10 mm.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies of opposite stature; taking the drawn handle and pulling the case is `test_motion_mechanism_carriage_pull_suitcase`'s.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances through the public chain, entered through `test_motion_mechanism_carriage_draw_handle`.
 */
export function test_motion_mechanism_carriage_draw_handle(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const name of ["m-average", "f-small"] as const) {
    const label: string = `${name} draws the suitcase's handle`;
    try {
      draw(checks, label, motionHumanBody(name));
    } catch (error: unknown) {
      checks.check(`${label}: ${everydayTake.describe(error)}`, false);
    }
  }
  checks.assert("a suitcase's pull handle is drawn out by its travel");
}

/** One body's operation and its checks. */
function draw(
  checks: motionComplaints.IGatherer,
  label: string,
  body: IAutoMovieMotionHumanBody,
): void {
  const a: carriageScene.IArrival = carriageScene.arrival(body);
  const take: HumanPerformance = carriageScene.perform(
    `${label} draw`,
    body,
    a.props,
    carriageScene.draw(HumanChain.subject("actor").stand(), a),
  );
  const act: IAutoMovieMotionHumanSegment = motionActionUnit.segment(
    take,
    "actor",
    "operate",
  );
  const travel: number = a.telescope.travel!;
  const drawn: number = take.state("case", act.end)["telescope"] ?? 0;
  checks.check(
    `${label}: the telescope stands drawn by its travel (${(drawn * 1000).toFixed(1)} mm of ${(travel * 1000).toFixed(1)})`,
    Math.abs(drawn - travel) <= motionActionUnit.GRIP,
  );
  motionActionUnit.bounds(checks, label, take, "actor", act);
}
