import type {
  AutoMovieHumanSide,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
} from "@automovie/interface";
import { martialArt } from "@automovie/motions/internal";
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
 * `martialArt.plan` stages the tai chi transfer on one slow phrase clock: the
 * lead step in over 2 s, the forward shift and the rollback over 2.5 s each,
 * the held second stance and the 2 s return (`MartialArtStanceForms`), with
 * open palms and the pelvis square throughout.
 *
 * Each staging runs; a right lead mirrors the plants and the pelvis turn.
 *
 * Scenarios:
 *
 * 1. Held 0.24 s, the phrase lasts 9.24 s with its marks at 2, 4.5, 7 and 7.24 s;
 *    the rear foot plants throughout and the lead from `ready` to `relax`.
 * 2. The pelvis heads 0 degrees at both `stroke` and `strokeEnd`.
 * 3. Every sampled posture resolves with the palms on their sites, and the last
 *    returns to the first.
 */
export async function test_unit_motions_sport_martial_art_plan_tai_chi(): Promise<void> {
  for (const [name, lead] of CASES) {
    // Whole body: the form places both legs and arms on goals the full rig
    // resolves.
    const body: IAutoMovieMotionHumanBody = await humanFixtureBody(name);
    const rear: AutoMovieHumanSide = lead === "left" ? "right" : "left";
    const away: number = lead === "left" ? -1 : 1;
    const plan: IAutoMovieMotionHumanActionPlan = martialArt.plan(
      motionActionContext(body, { kind: "taiChiTransfer", hold: 0.24, lead }),
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
      nclose(plan.duration, 9.24, ROUNDING) &&
        nclose(at("ready"), 2, ROUNDING) &&
        nclose(at("stroke"), 4.5, ROUNDING) &&
        nclose(at("strokeEnd"), 7, ROUNDING) &&
        nclose(at("relax"), 7.24, ROUNDING) &&
        plant(`${rear}Foot`).from === 0 &&
        plant(`${rear}Foot`).to === 1 &&
        nclose(plant(`${lead}Foot`).from, 2 / 9.24, ROUNDING) &&
        nclose(plant(`${lead}Foot`).to, 7.24 / 9.24, ROUNDING),
    );
    TestValidator.predicate(
      `${name}: the pelvis turns`,
      nclose(plan.posture(at("stroke")).yaw, away * 0, ROUNDING) &&
        nclose(plan.posture(at("strokeEnd")).yaw, away * 0, ROUNDING),
    );
    for (let s: number = 0; s < plan.duration; s += 0.3) plan.posture(s);
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
