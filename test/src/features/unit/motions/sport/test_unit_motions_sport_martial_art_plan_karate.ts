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
 * `martialArt.plan` stages the karate stance transfer on one phrase clock: the
 * lead step in over 0.55 s, the forward and back transfers over 0.42 s each,
 * the held second stance and the 0.55 s return (`MartialArtStanceForms`). The
 * pelvis opens 5 degrees with the step and turns 20 more over the back
 * transfer, away from the lead.
 *
 * Each staging runs; a right lead mirrors the plants and the pelvis turn.
 *
 * Scenarios:
 *
 * 1. Held 0.24 s, the phrase lasts 2.18 s with its marks at 0.55, 0.97, 1.39 and
 *    1.63 s; the rear foot plants throughout and the lead from `ready` to
 *    `relax`.
 * 2. The pelvis heads 5 degrees away from the lead at `stroke` and 25 at
 *    `strokeEnd`.
 * 3. Every sampled posture resolves with the arms on their sites, and the last
 *    returns to the first.
 */
export async function test_unit_motions_sport_martial_art_plan_karate(): Promise<void> {
  for (const [name, lead] of CASES) {
    // Whole body: the form places both legs and arms on goals the full rig
    // resolves.
    const body: IAutoMovieMotionHumanBody = await humanFixtureBody(name);
    const rear: AutoMovieHumanSide = lead === "left" ? "right" : "left";
    const away: number = lead === "left" ? -1 : 1;
    // A refusal names its staging, so a failure tells the stagings apart.
    try {
      const plan: IAutoMovieMotionHumanActionPlan = martialArt.plan(
        motionActionContext(body, {
          kind: "karateStanceTransfer",
          hold: 0.24,
          lead,
        }),
      );
      plan.prepare?.();
      const at = (mark: string): number =>
        plan.events.find(
          (e: IAutoMovieMotionEvent): boolean => e.name === mark,
        )!.share * plan.duration;
      const plant = (part: string): IAutoMovieMotionHumanContactWindow =>
        plan.contacts.find(
          (w: IAutoMovieMotionHumanContactWindow): boolean => w.part === part,
        )!;
      TestValidator.predicate(
        `${name}: the phrase and its plants`,
        nclose(plan.duration, 2.18, ROUNDING) &&
          nclose(at("ready"), 0.55, ROUNDING) &&
          nclose(at("stroke"), 0.97, ROUNDING) &&
          nclose(at("strokeEnd"), 1.39, ROUNDING) &&
          nclose(at("relax"), 1.63, ROUNDING) &&
          plant(`${rear}Foot`).from === 0 &&
          plant(`${rear}Foot`).to === 1 &&
          nclose(plant(`${lead}Foot`).from, 0.55 / 2.18, ROUNDING) &&
          nclose(plant(`${lead}Foot`).to, 1.63 / 2.18, ROUNDING),
      );
      TestValidator.predicate(
        `${name}: the pelvis turns`,
        nclose(plan.posture(at("stroke")).yaw, away * 5, ROUNDING) &&
          nclose(plan.posture(at("strokeEnd")).yaw, away * 25, ROUNDING),
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
    } catch (error) {
      throw new Error(
        `${name} leading ${lead}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
