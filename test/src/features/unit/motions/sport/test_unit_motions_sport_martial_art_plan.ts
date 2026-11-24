import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanMartialArt,
  IAutoMovieVector3,
} from "@automovie/interface";
import { martialArt } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";
import { nclose } from "../../../internal/nclose";
import { throwsError } from "../../../internal/throwsError";
import { vclose } from "../../../internal/vclose";

/**
 * `martialArt.plan` stages the solo forms on one phrase clock: a 0.6 s step in,
 * the held middle, and a 0.6 s step out (3 s each way for tai chi, Wu and Hitt
 * 2005). In the horse stance the left foot steps out until the feet stand four
 * shoulder half-widths apart and the hips come half that way across and sink a
 * fifth of the thigh.
 *
 * The average man stands at the origin facing +Z, the left toward +X.
 *
 * Scenarios:
 *
 * 1. A horse stance held 1 s lasts 2.2 s; the left foot plants from the
 *    stance's `ready` (0.6 s) to its `relax` (1.6 s), the right throughout.
 * 2. Held, the root stands half the step out toward +X and a fifth of the thigh
 *    lower than at the start.
 * 3. A count rounding below one punch, or a negative hold, is refused.
 */
export async function test_unit_motions_sport_martial_art_plan(): Promise<void> {
  // Whole body: the forms place both legs and arms on goals the full rig
  // resolves.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const context = (
    params: IAutoMovieMotionHumanMartialArt.IParams,
  ): IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanMartialArt.IParams> =>
    motionActionContext(body, params);
  const horse: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanMartialArt.IParams> =
    context({ kind: "horseStance", hold: 1 });
  const plan: IAutoMovieMotionHumanActionPlan = martialArt.plan(horse);

  // 1. Timing and contacts.
  const plant = (
    part: string,
  ): IAutoMovieMotionHumanContactWindow | undefined =>
    plan.contacts.find(
      (w: IAutoMovieMotionHumanContactWindow): boolean => w.part === part,
    );
  TestValidator.predicate(
    "the phrase and its plants",
    nclose(plan.duration, 2.2, 1e-9) &&
      nclose(plant("leftFoot")!.from, 0.6 / 2.2, 1e-9) &&
      nclose(plant("leftFoot")!.to, 1.6 / 2.2, 1e-9) &&
      plant("rightFoot")!.from === 0 &&
      plant("rightFoot")!.to === 1,
  );

  // 2. The held stance.
  const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
  const apart: number =
    horse.entry.feet.left.ankle.x - horse.entry.feet.right.ankle.x;
  const out: number = Math.max(0, 4 * m.shoulderHalfWidth - apart);
  const start: IAutoMovieVector3 = plan.posture(0).root;
  TestValidator.predicate(
    "the hips half out and sunk",
    vclose(
      plan.posture(1.1).root,
      { x: start.x + out / 2, y: start.y - 0.2 * m.thigh, z: start.z },
      1e-9,
    ),
  );

  // 3. Refusals.
  TestValidator.predicate(
    "no punch, or a negative hold",
    throwsError(() =>
      martialArt.plan(context({ kind: "chokuZuki", count: 0 })),
    ) &&
      throwsError(() =>
        martialArt.plan(context({ kind: "horseStance", hold: -1 })),
      ),
  );
}
