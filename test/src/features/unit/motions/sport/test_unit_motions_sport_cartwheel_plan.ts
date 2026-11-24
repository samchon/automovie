import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanCartwheel,
  IAutoMovieMotionHumanContactWindow,
} from "@automovie/interface";
import { cartwheel } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";
import { throwsError } from "../../../internal/throwsError";

/**
 * `cartwheel.plan` turns the body once about its front-to-back axis as a
 * four-spoke wheel, the turn's angle `360 · s(t / T)` on the minimum-jerk share
 * `s`, so it is half turned at half the time; the leading foot bears first,
 * then the hands, then the feet, the wheel rolling toward the side it turns to
 * (a left wheel toward the body's left, +X when facing +Z).
 *
 * The average man stands at the origin facing +Z.
 *
 * Scenarios:
 *
 * 1. A left cartwheel lasts its default 1.6 s, is inverted at half of it, and its
 *    events run hands down, inverted, feet down, relax.
 * 2. It rolls 0 at the start and -180 degrees at 0.8 s; a right cartwheel rolls
 *    +180.
 * 3. The left wheel bears first on the left foot and last on both feet to the end,
 *    and lands toward +X; the right wheel lands toward -X.
 * 4. A non-positive duration is refused.
 */
export async function test_unit_motions_sport_cartwheel_plan(): Promise<void> {
  // Whole body: the wheel resolves its shape over the full rig at every row of
  // its turn and lays the bearing limbs.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const plan = (
    params: IAutoMovieMotionHumanCartwheel.IParams,
  ): IAutoMovieMotionHumanActionPlan =>
    cartwheel.plan(motionActionContext(body, params));
  const left: IAutoMovieMotionHumanActionPlan = plan({ to: "left" });
  const right: IAutoMovieMotionHumanActionPlan = plan({ to: "right" });
  const share = (name: string): number =>
    left.events.find((e: IAutoMovieMotionEvent): boolean => e.name === name)!
      .share;

  // 1. Timing.
  TestValidator.predicate(
    "the turn's timing",
    left.duration === cartwheel.SECONDS &&
      Math.abs(share("inverted") - 0.5) < 1e-9 &&
      share("handsDown") < share("inverted") &&
      share("inverted") < share("feetDown") &&
      share("relax") === 1,
  );

  // 2. The roll.
  TestValidator.predicate(
    "rolled on the minimum-jerk turn",
    left.posture(0).roll === 0 &&
      Math.abs(left.posture(0.8).roll + 180) < 1e-9 &&
      Math.abs(right.posture(0.8).roll - 180) < 1e-9,
  );

  // 3. The spokes and the travel.
  const contacts: IAutoMovieMotionHumanContactWindow[] = left.contacts;
  TestValidator.predicate(
    "foot, hands, feet, and the side",
    contacts[0]!.part === "leftFoot" &&
      contacts.some((w: IAutoMovieMotionHumanContactWindow): boolean =>
        w.part.endsWith("Hand"),
      ) &&
      contacts
        .filter((w: IAutoMovieMotionHumanContactWindow): boolean => w.to === 1)
        .every((w: IAutoMovieMotionHumanContactWindow): boolean =>
          w.part.endsWith("Foot"),
        ) &&
      left.posture(left.duration).root.x > left.posture(0).root.x &&
      right.posture(right.duration).root.x < right.posture(0).root.x,
  );

  // 4. Refusal.
  TestValidator.predicate(
    "no time to turn",
    throwsError(() => plan({ duration: 0 })),
  );
}
