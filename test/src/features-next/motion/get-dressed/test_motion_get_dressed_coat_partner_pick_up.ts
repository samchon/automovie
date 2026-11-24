import { HumanPerformance } from "@automovie/motions";

import { everydayTake } from "../../../features/internal/everydayTake";
import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { coatPartnerScene } from "../../internal/coatPartnerScene";
import { motionGraspUnit } from "../../internal/motionGraspUnit";

/**
 * The dresser takes up the jacket by its back collar, on its own: the pickUp of
 * `test_motion_get_dressed_coat_partner`, the average man and the small woman
 * each with either holding hand as the original's dressers, entered standing
 * alone at the dresser's place (the pickUp is the dresser's first action; the
 * partner is left out, as the pickUp reads nothing of it).
 *
 * Scenarios:
 *
 * 1. The pickUp closes the holding hand on the jacket's `backCollar` and the wrist
 *    rises the asked 20 mm, and the jacket rides the hand
 *    (`motionGraspUnit.pickUp`: the grasp and pickUp contracts).
 * 2. The pickUp keeps the shipped bounds over its own span.
 *
 * The original reads no goal of this step.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the original and step it decomposes, the entry, the bodies, the hands and every bound.
 * @evidence contracts/development/testing.md#behavioral-verification Performs stand > pickUp alone and reads the displayed hand and jacket, with the verdict report over the pickUp's span; a hand off the collar, a lift short or long, a jacket slipping in the hand or a finding in the pickUp fails.
 * @evidence contracts/development/testing.md#independent-expectations The collar's place is the archetype's `backCollar` under the pickUp contract; the lift is the original's asked 20 mm.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies of opposite stature, each with either hand; the coat's hold is `test_motion_get_dressed_coat_partner_hold`'s.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances through the public chain, entered through `test_motion_get_dressed_coat_partner_pick_up`.
 */
export function test_motion_get_dressed_coat_partner_pick_up(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const c of coatPartnerScene.CASES) {
    const label: string = `${c.dresser} takes up the jacket (${c.hand} hand)`;
    try {
      const model: coatPartnerScene.JacketModel = coatPartnerScene.jacket();
      const film: HumanPerformance = coatPartnerScene.pickUp(
        motionHumanBody(c.dresser),
        model,
        c.hand,
      );
      motionGraspUnit.pickUp(checks, label, film, motionHumanBody(c.dresser), {
        subject: "a",
        side: c.hand,
        prop: "jacket",
        model,
        handle: "backCollar",
        lift: coatPartnerScene.LIFT,
      });
    } catch (error: unknown) {
      checks.check(`${label}: ${everydayTake.describe(error)}`, false);
    }
  }
  checks.assert("the dresser takes up the jacket by its back collar");
}
