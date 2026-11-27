import { hingedArmSwivel } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmAngles,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
  IAutoMovieSwivelNear,
  IAutoMovieSwivelSeed,
} from "@automovie/interface";

import { HumanArmClearance } from "../../posture/internal/HumanArmClearance";
import { HumanLimbFit } from "../../posture/internal/HumanLimbFit";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { AutoMovieMotionHumanArm } from "./AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanArmCourse } from "./AutoMovieMotionHumanArmCourse";
import { courseArmGoal } from "./courseArmGoal";
import { courseLimbSwivels } from "./courseLimbSwivels";

/**
 * The arms a display shows as courses that start after their action take them
 * over, at one start: each course's rest there. Before its course an arm is the
 * plan's own. Where the plan writes it no goal at the display's last knot
 * before the start (the frame grid from the action's start and the plan's
 * events, `courseLimbSwivels`), the display shows its joints, read at the start
 * without the goal. Where it writes one, the display places the goal at the
 * swivel and branch of its course of the plan's goals, continued from the arms
 * the action is entered with (`readHumanSegmentLeaf.swivels`), and holds that
 * knot's swivel and branch until the course takes over
 * (`courseLimbSwivelKnots.between`). That course is laid here on the same knots
 * and the goal at the start placed at its last knot, so the rest is the arm
 * shown, not a cold fit of the goal, which may turn the upper arm and the
 * forearm another way for the same hand place.
 *
 * @param context The action's context: the body and the arms it is entered
 *   with.
 * @param plan The law's plan, whose events the display knots at.
 * @param shown The posture the display shows before the courses.
 * @param arms The arms whose courses start at `start`.
 * @param start The courses' start, seconds since the plan's start, positive.
 * @returns Each arm's rest.
 */
export function courseArmGoalShownRests(
  context: courseArmGoal.IContext,
  plan: IAutoMovieMotionHumanActionPlan,
  shown: (seconds: number) => IAutoMovieMotionHumanPosture,
  arms: readonly courseArmGoal.IArm[],
  start: number,
): Map<courseArmGoal.Limb, IAutoMovieMotionHumanArmAngles.IAngles> {
  const body: IAutoMovieMotionHumanBody = context.body;
  const out: Map<courseArmGoal.Limb, IAutoMovieMotionHumanArmAngles.IAngles> =
    new Map();
  const limb = (arm: courseArmGoal.IArm): courseArmGoal.Limb =>
    `${arm.side}Arm`;
  const step: number = AutoMovieMotionHumanArmCourse.STEP;
  const instants: number[] = plan.events
    .map((event: IAutoMovieMotionEvent): number => event.share * plan.duration)
    .filter((t: number): boolean => t > 0 && t < start - 1e-9);
  let last: number = step * Math.floor((start - 1e-9) / step);
  for (const t of instants) if (t > last) last = t;
  const written: courseArmGoal.IArm[] = arms.filter(
    (arm: courseArmGoal.IArm): boolean =>
      shown(last).limbs[limb(arm)] !== undefined,
  );
  const at: IAutoMovieMotionHumanPosture = shown(start);

  // An arm with no goal before its course: the plan's own joints.
  if (written.length < arms.length) {
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...at.limbs };
    for (const arm of arms) delete limbs[limb(arm)];
    const pose: IAutoMoviePose = resolveHumanPosture(body, { ...at, limbs });
    for (const arm of arms)
      if (!written.includes(arm))
        out.set(limb(arm), AutoMovieMotionHumanArm.angles(pose, arm.side));
  }
  if (written.length === 0) return out;

  // An arm on a goal before its course: the display's course of the goals,
  // its first knot placed at the arms as entered (`rest`, on the plan's own
  // posture at its start), read at its last knot before the start.
  const first: IAutoMovieMotionHumanPosture = shown(0);
  const bare: IAutoMovieMotionHumanPosture["limbs"] = { ...first.limbs };
  for (const arm of written) delete bare[limb(arm)];
  let entered: IAutoMoviePose = resolveHumanPosture(body, {
    ...first,
    limbs: bare,
  });
  for (const arm of written)
    entered = HumanArmClearance.posed(
      entered,
      arm.side,
      courseArmGoal.rest(context, arm),
    );
  const entry: Map<AutoMovieHumanLimb, IAutoMovieSwivelSeed> = new Map();
  for (const arm of written) {
    const seed: IAutoMovieSwivelSeed | null = HumanLimbFit.seed(
      body,
      entered,
      limb(arm),
    );
    if (seed !== null) entry.set(limb(arm), seed);
  }
  const seeds: ReadonlyMap<AutoMovieHumanLimb, IAutoMovieSwivelSeed> =
    courseLimbSwivels.swivels({
      body,
      posture: shown,
      limbs: written.map(limb),
      span: { start: 0, end: last },
      instants,
      entry,
    })(last);
  const near: Partial<Record<AutoMovieHumanLimb, IAutoMovieSwivelNear>> = {};
  for (const [held, seed] of seeds)
    near[held] = {
      ...seed,
      tolerance: hingedArmSwivel.RESOLUTION,
      prescribed: true,
    };
  const pose: IAutoMoviePose = resolveHumanPosture.seeded(
    body,
    at,
    undefined,
    near,
  ).pose;
  for (const arm of written)
    out.set(limb(arm), AutoMovieMotionHumanArm.angles(pose, arm.side));
  return out;
}
