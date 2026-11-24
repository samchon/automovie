import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
} from "@automovie/interface";
import {
  martialArt,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";
import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

/**
 * `martialArt.plan` stages the Muay Thai stance reset on one phrase clock: the
 * lead step in over 0.72 s, the forward and back transfers over 0.7 and 0.6 s,
 * the held second stance and the 0.72 s return (`MartialArtStanceForms`), under
 * the high guard, both fists at ear height. The pelvis stays square, opening
 * only 2 degrees with the step.
 *
 * The average man stands at the origin facing +Z, the left foot leading.
 *
 * Scenarios:
 *
 * 1. Held 0.24 s, the phrase lasts 2.98 s with its marks at 0.72, 1.42, 2.02 and
 *    2.26 s; the rear foot plants throughout and the lead from `ready` to
 *    `relax`.
 * 2. The pelvis heads -2 degrees at both `stroke` and `strokeEnd`.
 * 3. Both fists hold above the shoulders.
 * 4. At the first mark the square, deeper stance (41 degrees of knee bend against
 *    16) holds the hips over 2 cm lower below their start than the upright,
 *    bladed taekwondo reset does, the contrast that tells the two silhouettes
 *    apart.
 * 5. Every sampled posture resolves with both guard fists on their sites and the
 *    arms clear, and the last returns to the first.
 */
export async function test_unit_motions_sport_martial_art_plan_muay_thai(): Promise<void> {
  // Whole body: the form places both legs and arms on goals the full rig
  // resolves.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const plan: IAutoMovieMotionHumanActionPlan = martialArt.plan(
    motionActionContext(body, { kind: "muayThaiStanceReset", hold: 0.24 }),
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
    nclose(plan.duration, 2.98, 1e-9) &&
      nclose(at("ready"), 0.72, 1e-9) &&
      nclose(at("stroke"), 1.42, 1e-9) &&
      nclose(at("strokeEnd"), 2.02, 1e-9) &&
      nclose(at("relax"), 2.26, 1e-9) &&
      plant("rightFoot").from === 0 &&
      plant("rightFoot").to === 1 &&
      nclose(plant("leftFoot").from, 0.72 / 2.98, 1e-9) &&
      nclose(plant("leftFoot").to, 2.26 / 2.98, 1e-9),
  );
  TestValidator.predicate(
    "the pelvis turns",
    nclose(plan.posture(at("stroke")).yaw, -2, 1e-9) &&
      nclose(plan.posture(at("strokeEnd")).yaw, -2, 1e-9),
  );
  // The guard reads at the first mark: both wrists over 3 cm, six times the
  // 5 mm sole-contact tolerance, above their shoulder joints.
  const bones: ReturnType<typeof poseBones> = poseBones(
    body,
    resolveHumanPosture(body, plan.posture(at("stroke"))),
  );
  const raised = (side: "left" | "right"): number =>
    bones.get(`${side}Hand`)!.worldPosition.y -
    bones.get(`${side}UpperArm`)!.worldPosition.y;
  TestValidator.predicate(
    "the guard above the shoulders",
    raised("left") > 0.03 && raised("right") > 0.03,
  );
  const bladed: IAutoMovieMotionHumanActionPlan = martialArt.plan(
    motionActionContext(body, { kind: "taekwondoStanceReset", hold: 0.24 }),
  );
  bladed.prepare?.();
  const drop = (of: IAutoMovieMotionHumanActionPlan): number =>
    of.posture(0).root.y -
    of.posture(
      of.events.find(
        (e: IAutoMovieMotionEvent): boolean => e.name === "stroke",
      )!.share * of.duration,
    ).root.y;
  TestValidator.predicate(
    "lower than the taekwondo reset",
    drop(plan) - drop(bladed) > 0.02,
  );
  for (let s: number = 0; s < plan.duration; s += 0.1) plan.posture(s);
  TestValidator.predicate(
    "the return",
    vclose(plan.posture(plan.duration).root, plan.posture(0).root, 1e-9) &&
      nclose(plan.posture(plan.duration).yaw, 0, 1e-9),
  );
}
