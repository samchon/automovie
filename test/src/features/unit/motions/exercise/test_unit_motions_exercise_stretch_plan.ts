import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanStretch,
} from "@automovie/interface";
import { stretch } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";
import { nclose } from "../../../internal/nclose";
import { throwsError } from "../../../internal/throwsError";

/**
 * `stretch.plan` holds a standing stretch as a phrase: 1.5 s in (`ENTER`), the
 * hold, 1.5 s out, with `enter`, `reachEnd` and `release` at those instants; a
 * one-leg pose takes the weight onto the standing foot over the first half of
 * the entry before the other foot leaves the floor, and sets it down over the
 * second half of the release.
 *
 * The average man stands at the origin facing +Z.
 *
 * Scenarios:
 *
 * 1. A 10 s neck side bend lasts 13 s, reaching its end at 1.5 s and releasing at
 *    11.5 s.
 * 2. Mid-hold the neck bends to the side asked, a right bend the mirror of a left
 *    one; at the start and the end it is as it entered.
 * 3. A right quadriceps stretch stands on the left foot throughout, the right foot
 *    bearing until 0.75 s and again from 12.25 s.
 * 4. A negative hold is refused.
 */
export async function test_unit_motions_exercise_stretch_plan(): Promise<void> {
  // Whole body: each pose is composed over the full rig, its arms and legs
  // solved on the body's own segments.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const plan = (
    params: IAutoMovieMotionHumanStretch.IParams,
  ): IAutoMovieMotionHumanActionPlan =>
    stretch.plan(motionActionContext(body, params));
  const right: IAutoMovieMotionHumanActionPlan = plan({
    kind: "neckSide",
    side: "right",
    hold: 10,
  });
  const share = (name: string): number =>
    right.events.find((e: IAutoMovieMotionEvent): boolean => e.name === name)!
      .share;
  TestValidator.predicate(
    "the phrase",
    nclose(right.duration, 13, 1e-12) &&
      share("enter") === 0 &&
      nclose(share("reachEnd"), 1.5 / 13, 1e-12) &&
      nclose(share("release"), 11.5 / 13, 1e-12),
  );

  const left: IAutoMovieMotionHumanActionPlan = plan({
    kind: "neckSide",
    side: "left",
    hold: 10,
  });
  const bend = (p: IAutoMovieMotionHumanActionPlan, t: number): number =>
    p.posture(t).joints.neck?.[1] ?? 0;
  const entered: number = bend(right, 0);
  TestValidator.predicate(
    "the neck's bend",
    Math.abs(bend(right, 6.5) - entered) > 1 &&
      nclose(bend(right, 6.5) - entered, -(bend(left, 6.5) - entered), 1e-9) &&
      nclose(bend(right, 13), entered, 1e-9),
  );

  const quadriceps: IAutoMovieMotionHumanActionPlan = plan({
    kind: "quadriceps",
    side: "right",
    hold: 10,
  });
  const plants = (part: string): number[][] =>
    quadriceps.contacts
      .filter(
        (c: IAutoMovieMotionHumanContactWindow): boolean =>
          c.part === part && c.kind === "plant",
      )
      .map((c: IAutoMovieMotionHumanContactWindow): number[] => [c.from, c.to]);
  const standing: number[][] = plants("leftFoot");
  const lifted: number[][] = plants("rightFoot");
  TestValidator.predicate(
    "one leg",
    standing.length === 1 &&
      standing[0]![0] === 0 &&
      standing[0]![1] === 1 &&
      lifted.length === 2 &&
      nclose(lifted[0]![1]!, 0.75 / 13, 1e-12) &&
      nclose(lifted[1]![0]!, 12.25 / 13, 1e-12),
  );

  TestValidator.predicate(
    "a negative hold",
    throwsError(() => plan({ kind: "neckSide", hold: -1 })),
  );
}
