import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanBody,
  IAutoMovieVector3,
} from "@automovie/interface";

import { courseArmGoal } from "./courseArmGoal";

/** Samples a second the goal's path is read at: well above the film rate, so a stroke's peak is not stepped over. */
const RATE: number = 240;

/**
 * Course a law's moving arm goal (`courseArmGoal`) at the law's own pace:
 * the fastest the law's goal moves its hand's site over the span (its
 * contact surface turned with the hand, as a wrist's snap moves a grip
 * faster than the wrist), read on a fine grid. That peak is the delivery or reach speed the
 * law itself declares by its goal, so the course may move as fast as the
 * law asks and no faster, with no constant added.
 *
 * @param body The body.
 * @param goals The law's goal plan, whose posture writes the arm's goal.
 * @param side The arm.
 * @param rest The arm's angles before the span.
 * @param span Where the goal is written: from its start through its reach to the end.
 * @returns The coursed plan.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the pace and why.
 * @evidence contracts/development/implementation.md#principled-implementation The central difference of the goal point on a 240 Hz grid over the span; its maximum is the law's own peak.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop, one course.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No constant is added; the peak is the goal's.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the span's samples, once per plan.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The shared course planner.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The course retains one number.
 */
export function courseArmAtPace(
  body: IAutoMovieMotionHumanBody,
  goals: IAutoMovieMotionHumanActionPlan,
  side: AutoMovieHumanSide,
  rest: Parameters<typeof courseArmGoal>[0]["rest"],
  span: IAutoMovieMotionHumanArmPlanned.ISpan,
): IAutoMovieMotionHumanActionPlan {
  const limb: AutoMovieHumanLimb = side === "left" ? "leftArm" : "rightArm";
  const steps: number = Math.max(2, Math.ceil((span.end - span.start) * RATE));
  let peak: number = 0;
  let last: IAutoMovieVector3 | undefined;
  for (let i: number = 0; i <= steps; i++) {
    const t: number = span.start + ((span.end - span.start) * i) / steps;
    const goal: IAutoMovieHumanLimbGoal | undefined =
      goals.posture(t).limbs?.[limb];
    const now: IAutoMovieVector3 | undefined =
      goal === undefined ? undefined : site(goal);
    if (now !== undefined && last !== undefined)
      peak = Math.max(
        peak,
        (Vector3.distance(now, last) * steps) / (span.end - span.start),
      );
    last = now;
  }
  return courseArmGoal({
    body,
    plan: goals,
    side,
    rest,
    span,
    pace: (): number => peak,
  });
}

/** The goal's site: its contact surface where it names one, else its end joint. */
function site(goal: IAutoMovieHumanLimbGoal): IAutoMovieVector3 {
  return goal.contact === undefined || goal.rotation === undefined
    ? goal.point
    : Vector3.add(
        goal.point,
        Quaternion.rotateVector(goal.rotation, goal.contact),
      );
}
