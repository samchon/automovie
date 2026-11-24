import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
} from "@automovie/interface";
import { workout } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";
import { nclose } from "../../../internal/nclose";

/**
 * `workout.plan` gets the body from standing into an exercise's first posture,
 * through its repetitions and up again, the bones that bear held in place while
 * the exercise lasts.
 *
 * Two push-ups from standing: the push-up's 1.5 s way down (`enter`), each
 * repetition lowering for 1 s and pressing for 1 s, and the same 1.5 s up.
 *
 * Scenarios:
 *
 * 1. It lasts `1.5 + 2 · 2 + 1.5 = 7` s; `lower1` at 1.5 s, `bottom1` and `press1`
 *    at 2.5 s, `top1` and `lower2` at 3.5 s, `bottom2` and `press2` at 4.5 s,
 *    `top2` and `release` at 5.5 s, `relax` at 7 s.
 * 2. Both hands and both feet bear on the floor from 1.5 s to 5.5 s.
 * 3. Kept on its support (`stay`), it declares that base and ends at the release.
 */
export async function test_unit_motions_exercise_workout_plan(): Promise<void> {
  // Whole body: each key is a full-rig posture placed by what bears it.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const pushUps: IAutoMovieMotionHumanActionPlan = workout.plan(
    motionActionContext(body, { kind: "pushUp", count: 2 }),
  );
  TestValidator.equals(
    "the repetitions",
    pushUps.events.map((e: IAutoMovieMotionEvent): [string, number] => [
      e.name,
      Math.round(e.share * pushUps.duration * 1e9) / 1e9,
    ]),
    [
      ["enter", 0],
      ["lower1", 1.5],
      ["bottom1", 2.5],
      ["press1", 2.5],
      ["top1", 3.5],
      ["lower2", 3.5],
      ["bottom2", 4.5],
      ["press2", 4.5],
      ["top2", 5.5],
      ["release", 5.5],
      ["relax", 7],
    ],
  );
  TestValidator.predicate(
    "the supports",
    nclose(pushUps.duration, 7, 1e-12) &&
      ["leftHand", "rightHand", "leftFoot", "rightFoot"].every(
        (part: string): boolean =>
          pushUps.contacts.some(
            (c: IAutoMovieMotionHumanContactWindow): boolean =>
              c.part === part &&
              c.kind === "plant" &&
              nclose(c.from, 1.5 / 7, 1e-9) &&
              nclose(c.to, 5.5 / 7, 1e-9),
          ),
      ),
  );
  const stay: IAutoMovieMotionHumanActionPlan = workout.plan(
    motionActionContext(body, { kind: "pushUp", count: 2, stay: true }),
  );
  TestValidator.predicate(
    "kept down",
    stay.base !== undefined &&
      stay.base.kind === "leaning" &&
      nclose(stay.duration, 5.5, 1e-9),
  );
}
