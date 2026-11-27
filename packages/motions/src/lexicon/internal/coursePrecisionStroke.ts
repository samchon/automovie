import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmCarry,
  IAutoMovieMotionHumanBody,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../../compose/internal/AutoMovieMotionHumanArm";
import { courseArmGoal } from "../../compose/internal/courseArmGoal";
import { precisionStrokePeak } from "./precisionStrokePeak";

/*
 * A precision stroke's arms laid as one course on the stroke's own goals
 * (`courseArmGoal`), instead of a fit per instant: the striking arm reaches
 * through its backswing to the contact, holds the stroke's goal on the contact
 * instant and returns by `end`, admitted against the stroke's own speed, the
 * hand goal's peak along its whole path (`precisionStrokePeak`). A second hand
 * on the same implement (a putter, a club, a stick, a bat) is laid in the same
 * course, the two hands' closing segments the grasp's contact.
 * Parameter plan: The stroke's plan, whose posture writes the arms' goals.
 * Parameter body: The body.
 * Parameter side: The striking arm.
 * Parameter entry: The pose the stroke starts from, whose arm angles the reach
 * leaves.
 * Parameter clock: The stroke's clock.
 * Parameter hand: The striking hand's grip point at the entry, world metres, where
 * the reach to the backswing starts and the return ends.
 * Parameter second: The other hand on the implement; none for a one-handed stroke.
 * Returns: The plan with its arms written by the course.
 * When no arm course meets the trajectory's constraints,
 * as the plan is composed.
 */
export function coursePrecisionStroke(
  plan: IAutoMovieMotionHumanActionPlan,
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
  entry: IAutoMoviePose,
  clock: IAutoMovieMotionClock,
  hand: IAutoMovieVector3,
  second?: AutoMovieHumanSide,
): IAutoMovieMotionHumanActionPlan {
  // The tool's attitude is the one hard constraint, at the contact: the
  // course holds the stroke's goal on the contact instant alone, the pose the
  // address found clear (`PrecisionStrokeForms.address`); the swing before
  // is the arm's reach, and after it the arm returns freely to its rest, each
  // finding its own clear attitude.
  const ready: number = clock.at("stroke");
  const relax: number = ready;
  const fastest: number = Math.max(
    precisionStrokePeak(plan.posture, `${side}Arm`, clock.duration),
    // The reach from the entry to the backswing, a minimum-jerk movement
    // over the stroke's preparation: its peak is 15/8 of its mean speed.
    ready > 0
      ? (15 / 8) *
          (Vector3.length(
            Vector3.subtract(
              plan.posture(ready).limbs[`${side}Arm`]?.point ?? hand,
              hand,
            ),
          ) /
            ready)
      : 0,
    // The return from the stroke's end to the entry's place, over the
    // stroke's recovery, the same minimum-jerk peak.
    (15 / 8) *
      (Vector3.length(
        Vector3.subtract(
          plan.posture(relax).limbs[`${side}Arm`]?.point ?? hand,
          hand,
        ),
      ) /
        (clock.duration - relax)),
  );
  return courseArmGoal({
    context: { body, entry: { pose: entry } },
    side,
    plan,
    span: {
      start: 0,
      ready,
      relax,
      end: clock.duration,
    },
    pace: (): number => fastest,
    ...(second === undefined
      ? {}
      : {
          grasp: coursePrecisionStroke.GRASP,
          with: [
            {
              side: second,
              rest: AutoMovieMotionHumanArm.angles(entry, second),
              grasp: coursePrecisionStroke.GRASP,
            },
          ],
        }),
  });
}

/*
 * Companion constants of `coursePrecisionStroke`.
 */
export namespace coursePrecisionStroke {
  /*
   * The segments of each hand that close on a two-handed implement, the grasp's
   * contact between the two arms; the address judges its contact pose with the
   * same grasp (`PrecisionStrokeForms.address`).
   */
  export const GRASP: NonNullable<
    IAutoMovieMotionHumanArmCarry.ICarry["grasp"]
  > = ["hand", "lowerArm"];
}
