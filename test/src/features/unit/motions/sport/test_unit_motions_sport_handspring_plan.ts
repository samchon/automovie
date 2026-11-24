import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
} from "@automovie/interface";
import { handspring, jump } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";
import { nclose } from "../../../internal/nclose";

/**
 * `handspring.plan` wheels the body over its hands to `handspring.RELEASE`
 * (145) degrees of tip, flies arched to `handspring.LAND` (330, that is -30),
 * and lands on both feet, absorbing over the jump's `ABSORB` (0.3 s) and
 * rising over its `RISE` (0.45 s) to stand.
 *
 * The average man stands at the origin facing +Z, the left leg leading.
 *
 * Scenarios:
 *
 * 1. The events run hands down, release, touchdown, settled, relax; settled is
 *    `ABSORB` after touchdown and the end `RISE` after settled.
 * 2. At the release the body tips 145 degrees, at touchdown -30, and at the end
 *    it stands untipped.
 * 3. Both hands bear from hands down to the release, and both feet from
 *    touchdown to the end.
 */
export async function test_unit_motions_sport_handspring_plan(): Promise<void> {
  // Whole body: the wheel and the flight read the full rig's mass model and
  // resolve its shapes at every row.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const plan: IAutoMovieMotionHumanActionPlan = handspring.plan(
    motionActionContext(body, {}),
  );
  const at = (name: string): number =>
    plan.duration *
    plan.events.find((e: IAutoMovieMotionEvent): boolean => e.name === name)!
      .share;
  const bears = (part: string, from: number, to: number): boolean =>
    plan.contacts.some(
      (w: IAutoMovieMotionHumanContactWindow): boolean =>
        w.part === part &&
        nclose(w.from * plan.duration, from, 1e-9) &&
        nclose(w.to * plan.duration, to, 1e-9),
    );

  // 1. Timing.
  TestValidator.predicate(
    "the events and the landing's phases",
    at("handsDown") < at("release") &&
      at("release") < at("touchdown") &&
      nclose(at("settled") - at("touchdown"), jump.ABSORB, 1e-9) &&
      nclose(plan.duration - at("settled"), jump.RISE, 1e-9) &&
      at("relax") === plan.duration,
  );

  // 2. The tip.
  TestValidator.predicate(
    "released, landed and stood",
    nclose(plan.posture(at("release")).pitch, handspring.RELEASE, 1e-9) &&
      nclose(
        plan.posture(at("touchdown")).pitch,
        handspring.LAND - 360,
        1e-9,
      ) &&
      nclose(plan.posture(plan.duration).pitch, 0, 1e-9),
  );

  // 3. The supports.
  TestValidator.predicate(
    "hands, then feet",
    bears("leftHand", at("handsDown"), at("release")) &&
      bears("rightHand", at("handsDown"), at("release")) &&
      bears("leftFoot", at("touchdown"), plan.duration) &&
      bears("rightFoot", at("touchdown"), plan.duration),
  );
}
