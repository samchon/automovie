import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanRoundOff,
} from "@automovie/interface";
import { roundOff } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";
import { nclose } from "../../../internal/nclose";
import { throwsError } from "../../../internal/throwsError";

/**
 * `roundOff.plan` turns a cartwheel's wheel once on the minimum-jerk share of
 * its seconds, adding a quarter turn of heading toward the trailing side by
 * `ENTRY` (60) degrees of the wheel and a second quarter over `SNAP` (120)
 * degrees past the handstand, so the body lands facing back along its run.
 *
 * The average man stands at the origin facing +Z.
 *
 * Scenarios:
 *
 * 1. A left-lead round-off lasts its default 1.2 s, is inverted at half of it, and
 *    its events run hands down, inverted, feet down, relax.
 * 2. Half way (the wheel at 180 degrees) it rolls -180 and heads -90: the first
 *    quarter made, the second not begun.
 * 3. At the end it stands unrolled, heading -180; a right lead heads +180.
 * 4. A non-positive duration is refused.
 */
export async function test_unit_motions_sport_round_off_plan(): Promise<void> {
  // Whole body: the wheel resolves its shape over the full rig at every row of
  // its turn and lays the bearing limbs.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const plan = (
    params: IAutoMovieMotionHumanRoundOff.IParams,
  ): IAutoMovieMotionHumanActionPlan =>
    roundOff.plan(motionActionContext(body, params));
  const left: IAutoMovieMotionHumanActionPlan = plan({});
  const share = (name: string): number =>
    left.events.find((e: IAutoMovieMotionEvent): boolean => e.name === name)!
      .share;

  // 1. Timing.
  TestValidator.predicate(
    "the wheel's timing",
    left.duration === roundOff.SECONDS &&
      nclose(share("inverted"), 0.5, 1e-9) &&
      share("handsDown") < share("inverted") &&
      share("inverted") < share("feetDown") &&
      share("relax") === 1,
  );

  // 2. Half way.
  TestValidator.predicate(
    "inverted, a quarter turned",
    nclose(left.posture(0.6).roll, -180, 1e-9) &&
      nclose(left.posture(0.6).yaw, -90, 1e-9),
  );

  // 3. The landing.
  TestValidator.predicate(
    "landed facing back",
    left.posture(left.duration).roll === 0 &&
      nclose(left.posture(left.duration).yaw, -180, 1e-9) &&
      nclose(plan({ lead: "right" }).posture(1.2).yaw, 180, 1e-9),
  );

  // 4. Refusal.
  TestValidator.predicate(
    "no time to turn",
    throwsError(() => plan({ duration: 0 })),
  );
}
