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

import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { courseArmGoal } from "../compose/courseArmGoal";
import { precisionStrokePeak } from "./precisionStrokePeak";

/** The segments of each hand that close on a two-handed implement, the grasp's contact between the two arms. */
const GRASP: NonNullable<IAutoMovieMotionHumanArmCarry.ICarry["grasp"]> = [
  "hand",
  "lowerArm",
];

/**
 * A precision stroke's arms laid as one course on the stroke's own goals
 * (`courseArmGoal`), instead of a fit per instant: the striking arm reaches
 * through its backswing to halfway down the downswing, holds the stroke's goal
 * through the contact and follow-through to `relax` and returns by `end`, admitted against the
 * stroke's own speed, the hand goal's peak along its whole path
 * (`precisionStrokePeak`). A second hand on the same implement (a putter, a
 * club, a stick, a bat) is laid in the same course, the two hands' closing
 * segments the grasp's contact.
 *
 * @param plan The stroke's plan, whose posture writes the arms' goals.
 * @param body The body.
 * @param side The striking arm.
 * @param entry The pose the stroke starts from, whose arm angles the reach leaves.
 * @param clock The stroke's clock.
 * @param hand The striking hand's grip point at the entry, world metres, where the reach to the backswing starts and the return ends.
 * @param second The other hand on the implement; none for a one-handed stroke.
 * @returns The plan with its arms written by the course.
 * @throws {HumanRefusal} When no arm course meets the trajectory's constraints, as the plan is composed.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the course's span, its speed bound and when the second hand joins it.
 * @evidence contracts/development/implementation.md#principled-implementation A moving hand goal is one trajectory problem with branch continuity and clearance (the planner's); the bound is the stroke's own delivery peak, and two hands on one implement are one problem, excused from each other only at the segments that grasp it.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One `courseArmGoal` call with the stroke's instants.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The goals, the span and the pace are the stroke's own; no constant is added to the pace and the planner's refusal stands.
 * @evidence contracts/development/implementation.md#efficient-algorithms The peak is read once, when the planner first asks for it.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `courseArmGoal`, `AutoMovieMotionHumanArm.angles` and `precisionStrokePeak`.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the plan and the peak once read, released with the coursed plan.
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
  let fastest: number | undefined;
  // The tool's attitude must hold only into the contact: the hold starts
  // halfway through the downswing, and the backswing before it is the arm's
  // reach, free to find an attitude it reaches clear of the body.
  const ready: number = (clock.at("strokeStart") + clock.at("stroke")) / 2;
  // ... and only out of it: the hold ends halfway through the
  // follow-through, whose end the arm reaches freely back to its rest, so the
  // swing's last attitude is not asked of an arm wrapped past its reach.
  const relax: number = (clock.at("stroke") + clock.at("strokeEnd")) / 2;
  return courseArmGoal({
    body,
    side,
    plan,
    rest: AutoMovieMotionHumanArm.angles(entry, side),
    span: {
      start: 0,
      ready,
      relax,
      end: clock.duration,
    },
    pace: (): number =>
      (fastest ??= Math.max(
        precisionStrokePeak(plan.posture, `${side}Arm`, clock.duration),
        // The reach from the entry to the backswing, a minimum-jerk
        // movement over the stroke's preparation: its peak is 15/8 of its
        // mean speed.
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
      )),
    ...(second === undefined
      ? {}
      : {
          grasp: GRASP,
          with: [
            {
              side: second,
              rest: AutoMovieMotionHumanArm.angles(entry, second),
              grasp: GRASP,
            },
          ],
        }),
  });
}
