import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
} from "@automovie/interface";
import { gymnastics } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";
import { nclose } from "../../../internal/nclose";
import { throwsError } from "../../../internal/throwsError";

/**
 * `gymnastics.plan` kicks up into a handstand over `gymnastics.ENTER` (1.5 s),
 * holds it, and comes down over `ENTER`: the hands come down half way into the
 * entry, the body is inverted when the entry ends, and the feet land half way
 * through the exit, the hands bearing between.
 *
 * The average man stands at the origin.
 *
 * Scenarios:
 *
 * 1. Held 1 s it lasts 4 s: hands down at 0.75 s, inverted at 1.5 s, the feet
 *    down at (2.5 + 4) / 2 = 3.25 s.
 * 2. Both hands bear from hands down to the release.
 * 3. The default 2 s hold lasts 5 s; a negative hold is refused.
 */
export async function test_unit_motions_sport_gymnastics_plan(): Promise<void> {
  // Whole body: the handstand places both arms and legs on goals the full rig
  // resolves.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const plan: IAutoMovieMotionHumanActionPlan = gymnastics.plan(
    motionActionContext(body, { hold: 1 }),
  );
  const at = (name: string): number =>
    plan.duration *
    plan.events.find((e: IAutoMovieMotionEvent): boolean => e.name === name)!
      .share;

  // 1. Timing.
  TestValidator.predicate(
    "the entry, the hold and the exit",
    nclose(plan.duration, 4, 1e-9) &&
      nclose(at("handsDown"), 0.75, 1e-9) &&
      nclose(at("inverted"), 1.5, 1e-9) &&
      nclose(at("release"), 3.25, 1e-9),
  );

  // 2. The hands.
  TestValidator.predicate(
    "the hands bear the handstand",
    (["leftHand", "rightHand"] satisfies string[]).every((part: string): boolean =>
      plan.contacts.some(
        (w: IAutoMovieMotionHumanContactWindow): boolean =>
          w.part === part &&
          nclose(w.from * plan.duration, 0.75, 1e-9) &&
          nclose(w.to * plan.duration, 3.25, 1e-9),
      ),
    ),
  );

  // 3. The default and a refusal.
  TestValidator.predicate(
    "the default hold, and none negative",
    nclose(
      gymnastics.plan(motionActionContext(body, {})).duration,
      5,
      1e-9,
    ) && throwsError(() => gymnastics.plan(motionActionContext(body, { hold: -1 }))),
  );
}
