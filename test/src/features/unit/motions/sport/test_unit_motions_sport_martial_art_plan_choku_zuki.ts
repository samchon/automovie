import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
} from "@automovie/interface";
import { martialArt } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";
import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

/**
 * `martialArt.plan` stages choku-zuki from the horse stance: after the 0.6 s
 * step out, punch i starts at `0.6 + 2 i PUNCH` s, the right hand first, each
 * extending over `PUNCH` (0.2 s, inside the 400 ms VencesBrito et al. 2011
 * measured), staying as long and returning as long; the middle lasts `(2 count
 *
 * - 1. PUNCH` and the step back 0.6 s. Each fist leaves its chamber outside the
 *        flank, drives ahead along it and turns in to the midline only once
 *        clear of the chest's front.
 *
 * The average man stands at the origin facing +Z.
 *
 * Scenarios:
 *
 * 1. Two punches last 0.6 + 5 PUNCH + 0.6 = 2.2 s.
 * 2. Every posture sampled each 50 ms resolves with both fists on their sites and
 *    the forearms clear of the trunk, through both punches and both returns to
 *    chamber, and the last returns to the first.
 */
export async function test_unit_motions_sport_martial_art_plan_choku_zuki(): Promise<void> {
  // Whole body: the punches place both arms on goals the full rig resolves
  // against the whole trunk.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const plan: IAutoMovieMotionHumanActionPlan = martialArt.plan(
    motionActionContext(body, { kind: "chokuZuki", count: 2 }),
  );
  plan.prepare?.();
  TestValidator.predicate(
    "two punches",
    nclose(plan.duration, 0.6 + 5 * martialArt.PUNCH + 0.6, 1e-9),
  );
  for (let s: number = 0; s < plan.duration; s += 0.05) plan.posture(s);
  TestValidator.predicate(
    "the return",
    vclose(plan.posture(plan.duration).root, plan.posture(0).root, 1e-9),
  );
}
