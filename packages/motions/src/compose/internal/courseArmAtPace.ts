import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieVector3,
} from "@automovie/interface";

import { courseArmGoal } from "./courseArmGoal";

/**
 * Samples a second the goal's path is read at: well above the film rate, so a
 * stroke's peak is not stepped over.
 */
const RATE: number = 240;

/**
 * Course a law's moving arm goal (`courseArmGoal`) at the law's own pace: the
 * fastest the law's goal moves its hand's site or any task point it limits over
 * the span (its contact surface and a held tool's points turned with the hand,
 * as a wrist's snap moves a grip and a blade's tip faster than the wrist), read
 * on a fine grid. That peak is the delivery or reach speed the law itself
 * declares by its goal, so the course may move as fast as the law asks and no
 * faster, with no constant added.
 *
 * @param context The body and the pose the course leaves from
 *   (courseArmGoal.IContext).
 * @param goals The law's goal plan, whose posture writes the arm's goal.
 * @param side The arm.
 * @param span Where the goal is written: from its start through its reach to
 *   the end.
 * @returns The coursed plan.
 */
export function courseArmAtPace(
  context: courseArmGoal.IContext,
  goals: IAutoMovieMotionHumanActionPlan,
  side: AutoMovieHumanSide,
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
    context,
    plan: goals,
    side,
    span,
    pace: (): number => peak,
  });
}

/**
 * The points the goal moves: its site and every task point it limits (a held
 * tool's tip and its working line), each where the goal's rotation puts it. In
 * a rotating stroke the tool's points outrun the hand, and the arm's probes
 * move with them, so the law's pace is the fastest of all.
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
