import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
} from "@automovie/interface";
import { martialArt } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";
import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

/**
 * `martialArt.plan` stages the karate stance transfer on one phrase clock: the
 * lead step in over 0.55 s, the forward and back transfers over 0.42 s each,
 * the held second stance and the 0.55 s return (`MartialArtStanceForms`). The
 * pelvis opens 5 degrees with the step and turns 20 more over the back
 * transfer, away from the lead.
 *
 * The average man stands at the origin facing +Z, the left foot leading.
 *
 * Scenarios:
 *
 * 1. Held 0.24 s, the phrase lasts 2.18 s with its marks at 0.55, 0.97, 1.39 and
 *    1.63 s; the rear foot plants throughout and the lead from `ready` to
 *    `relax`.
 * 2. The pelvis heads -5 degrees at `stroke` and -25 at `strokeEnd`.
 * 3. Every sampled posture resolves with the arms on their sites, and the last
 *    returns to the first.
 */
export async function test_unit_motions_sport_martial_art_plan_karate(): Promise<void> {
  // Whole body: the form places both legs and arms on goals the full rig
  // resolves.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const plan: IAutoMovieMotionHumanActionPlan = martialArt.plan(
    motionActionContext(body, { kind: "karateStanceTransfer", hold: 0.24 }),
  );
  plan.prepare?.();
  const at = (name: string): number =>
    plan.events.find((e: IAutoMovieMotionEvent): boolean => e.name === name)!
      .share * plan.duration;
  const plant = (part: string): IAutoMovieMotionHumanContactWindow =>
    plan.contacts.find(
      (w: IAutoMovieMotionHumanContactWindow): boolean => w.part === part,
    )!;
  TestValidator.predicate(
    "the phrase and its plants",
    nclose(plan.duration, 2.18, 1e-9) &&
      nclose(at("ready"), 0.55, 1e-9) &&
      nclose(at("stroke"), 0.97, 1e-9) &&
      nclose(at("strokeEnd"), 1.39, 1e-9) &&
      nclose(at("relax"), 1.63, 1e-9) &&
      plant("rightFoot").from === 0 &&
      plant("rightFoot").to === 1 &&
      nclose(plant("leftFoot").from, 0.55 / 2.18, 1e-9) &&
      nclose(plant("leftFoot").to, 1.63 / 2.18, 1e-9),
  );
  TestValidator.predicate(
    "the pelvis turns",
    nclose(plan.posture(at("stroke")).yaw, -5, 1e-9) &&
      nclose(plan.posture(at("strokeEnd")).yaw, -25, 1e-9),
  );
  for (let s: number = 0; s < plan.duration; s += 0.1) plan.posture(s);
  TestValidator.predicate(
    "the return",
    vclose(plan.posture(plan.duration).root, plan.posture(0).root, 1e-9) &&
      nclose(plan.posture(plan.duration).yaw, 0, 1e-9),
  );
}
