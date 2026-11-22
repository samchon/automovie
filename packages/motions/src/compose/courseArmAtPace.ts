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
 * the fastest the law's goal moves its hand's site or any task point it
 * limits over the span (its contact surface and a held tool's points turned
 * with the hand, as a wrist's snap moves a grip and a blade's tip faster
 * than the wrist), read on a fine grid. That peak is the delivery or reach speed the
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
  let last: readonly IAutoMovieVector3[] | undefined;
  for (let i: number = 0; i <= steps; i++) {
    const t: number = span.start + ((span.end - span.start) * i) / steps;
    const goal: IAutoMovieHumanLimbGoal | undefined =
      goals.posture(t).limbs?.[limb];
    const now: readonly IAutoMovieVector3[] | undefined =
      goal === undefined ? undefined : points(goal);
    if (now !== undefined && last !== undefined && now.length === last.length)
      now.forEach((p: IAutoMovieVector3, k: number): void => {
        peak = Math.max(
          peak,
          (Vector3.distance(p, last![k]!) * steps) / (span.end - span.start),
        );
      });
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

/**
 * The points the goal moves: its site and every task point it limits (a
 * held tool's tip and its working line), each where the goal's rotation
 * puts it. In a rotating stroke the tool's points outrun the hand, and the
 * arm's probes move with them, so the law's pace is the fastest of all.
 */
function points(goal: IAutoMovieHumanLimbGoal): readonly IAutoMovieVector3[] {
  return [
    site(goal),
    ...(goal.rotation === undefined
      ? []
      : (goal.limits ?? []).map(
          (
            limit: NonNullable<IAutoMovieHumanLimbGoal["limits"]>[number],
          ): IAutoMovieVector3 =>
            Vector3.add(
              goal.point,
              Quaternion.rotateVector(goal.rotation!, limit.contact),
            ),
        )),
  ];
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
