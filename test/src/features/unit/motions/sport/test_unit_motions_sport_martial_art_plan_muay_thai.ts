import type {
  AutoMovieHumanSide,
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

import type { humanFixture } from "../../../internal/fixtures/humanFixture";
import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";
import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

/**
 * The two stagings: the average man leading with the left foot and the smallest
 * woman with the right, each at the origin facing +Z.
 */
const CASES: readonly (readonly [humanFixture.Name, AutoMovieHumanSide])[] = [
  ["m-average", "left"],
  ["f-small", "right"],
];

/** The marks' rounding, seconds and degrees. */
const ROUNDING: number = 1e-9;

/**
 * `martialArt.plan` stages the Muay Thai stance reset on one phrase clock: the
 * lead step in over 0.72 s, the forward and back transfers over 0.7 and 0.6 s,
 * the held second stance and the 0.72 s return (`MartialArtStanceForms`), under
 * the high guard, both fists at ear height. The pelvis stays square, opening
 * only 2 degrees with the step.
 *
 * Each staging runs; a right lead mirrors the plants and the pelvis turn.
 *
 * Scenarios:
 *
 * 1. Held 0.24 s, the phrase lasts 2.98 s with its marks at 0.72, 1.42, 2.02 and
 *    2.26 s; the rear foot plants throughout and the lead from `ready` to
 *    `relax`.
 * 2. The pelvis heads 2 degrees away from the lead at both `stroke` and
 *    `strokeEnd`.
 * 3. Both fists hold above the shoulders.
 * 4. At the first mark the square, deeper stance (41 degrees of knee bend against
 *    16) holds the hips over 2 cm lower below their start than the upright,
 *    bladed taekwondo reset does, the contrast that tells the two silhouettes
 *    apart.
 * 5. Every sampled posture resolves with both guard fists on their sites and the
 *    arms clear, and the last returns to the first.
 */
export async function test_unit_motions_sport_martial_art_plan_muay_thai(): Promise<void> {
  for (const [name, lead] of CASES) {
    // Whole body: the form places both legs and arms on goals the full rig
    // resolves.
    const body: IAutoMovieMotionHumanBody = await humanFixtureBody(name);
    const rear: AutoMovieHumanSide = lead === "left" ? "right" : "left";
    const away: number = lead === "left" ? -1 : 1;
    const plan: IAutoMovieMotionHumanActionPlan = martialArt.plan(
      motionActionContext(body, {
        kind: "muayThaiStanceReset",
        hold: 0.24,
        lead,
      }),
    );
    plan.prepare?.();
    const at = (mark: string): number =>
      plan.events.find((e: IAutoMovieMotionEvent): boolean => e.name === mark)!
        .share * plan.duration;
    const plant = (part: string): IAutoMovieMotionHumanContactWindow =>
      plan.contacts.find(
        (w: IAutoMovieMotionHumanContactWindow): boolean => w.part === part,
      )!;
    TestValidator.predicate(
      `${name}: the phrase and its plants`,
      nclose(plan.duration, 2.98, ROUNDING) &&
        nclose(at("ready"), 0.72, ROUNDING) &&
        nclose(at("stroke"), 1.42, ROUNDING) &&
        nclose(at("strokeEnd"), 2.02, ROUNDING) &&
        nclose(at("relax"), 2.26, ROUNDING) &&
        plant(`${rear}Foot`).from === 0 &&
        plant(`${rear}Foot`).to === 1 &&
        nclose(plant(`${lead}Foot`).from, 0.72 / 2.98, ROUNDING) &&
        nclose(plant(`${lead}Foot`).to, 2.26 / 2.98, ROUNDING),
    );
    TestValidator.predicate(
      `${name}: the pelvis turns`,
      nclose(plan.posture(at("stroke")).yaw, away * 2, ROUNDING) &&
        nclose(plan.posture(at("strokeEnd")).yaw, away * 2, ROUNDING),
    );
    // The guard reads at the first mark: both wrists over 3 cm, six times the
    // 5 mm sole-contact tolerance, above their shoulder joints.
    const bones: ReturnType<typeof poseBones> = poseBones(
      body,
      resolveHumanPosture(body, plan.posture(at("stroke"))),
    );
    const raised = (side: AutoMovieHumanSide): number =>
      bones.get(`${side}Hand`)!.worldPosition.y -
      bones.get(`${side}UpperArm`)!.worldPosition.y;
    TestValidator.predicate(
      `${name}: the guard above the shoulders`,
      raised("left") > 0.03 && raised("right") > 0.03,
    );
    const bladed: IAutoMovieMotionHumanActionPlan = martialArt.plan(
      motionActionContext(body, {
        kind: "taekwondoStanceReset",
        hold: 0.24,
        lead,
      }),
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
      `${name}: lower than the taekwondo reset`,
      drop(plan) - drop(bladed) > 0.02,
    );
    for (let s: number = 0; s < plan.duration; s += 0.1) plan.posture(s);
    TestValidator.predicate(
      `${name}: the return`,
      vclose(
        plan.posture(plan.duration).root,
        plan.posture(0).root,
        ROUNDING,
      ) && nclose(plan.posture(plan.duration).yaw, 0, ROUNDING),
    );
  }
}
