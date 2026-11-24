import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
} from "@automovie/interface";
import { martialArt } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";
import { nclose } from "../../../internal/nclose";

/**
 * An arm placed through a held form is seeded at its hold from every start the
 * caller has (`HumanArmSeed`): the configuration it hands, the law's goal arm
 * and the rest, each one deterministic attempt in turn, as an inverse
 * kinematics search restarts from another seed when one attempt fails. One
 * start alone refused the karate stance transfer's last hold instant for the
 * average man, its left hand 13.1 mm off its site at 1.630 s, from a start
 * another seed clears.
 *
 * The average man stands at the origin facing +Z and leads with the left.
 *
 * Scenarios:
 *
 * 1. The karate stance transfer held 0.24 s plans: it lasts 2.18 s, its second
 *    pose held 0.24 s from `strokeEnd` to `relax`.
 */
export async function test_unit_motions_compose_arm_seed_starts(): Promise<void> {
  // Whole body: the form places both arms and legs on the full rig.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const plan: IAutoMovieMotionHumanActionPlan = martialArt.plan(
    motionActionContext(
      body,
      { kind: "karateStanceTransfer", lead: "left", hold: 0.24 },
      { seed: "same-camera-forms", subject: "form" },
    ),
  );
  const at = (name: string): number =>
    plan.events.find((e: IAutoMovieMotionEvent): boolean => e.name === name)!
      .share * plan.duration;
  TestValidator.predicate(
    "the held form plans",
    nclose(plan.duration, 2.18, 1e-9) &&
      nclose(at("relax") - at("strokeEnd"), 0.24, 1e-9),
  );
}
