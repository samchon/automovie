import { minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanMountRider,
  IAutoMovieMotionHumanPlayground,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import { walk } from "../actions/walk";
import { courseArmGoal } from "../compose/courseArmGoal";
import { HumanMountRider } from "../lexicon/HumanMountRider";
import { readPropGrip } from "./readPropGrip";

type Params = IAutoMovieMotionHumanPlayground.IRoundaboutPushParams;
type Plan = IAutoMovieMotionHumanActionPlan;
type Posture = IAutoMovieMotionHumanPosture;

/** An open joint-entry reader of one declared posture record. */
type JointEntries = Readonly<Record<string, Posture["joints"]["hips"]>>;

/**
 * Seconds over which the hand reaches the bar at the walk's start (provisional
 * staging).
 */
const REACH: number = 0.4;

/**
 * Run alongside a roundabout pushing one grab bar: the walk on the ground
 * (`walk`) with the named hand closing on the bar as the walk starts and
 * holding it where the turning disc carries it, read from the scene at each
 * second; the arm reaches and holds it on one planned course
 * (`courseArmGoal`).
 *
 * @param context The standing entry, the walk's path, the disc and the bar.
 * @returns The walk with the hand on the moving bar.
 * @throws {HumanRefusal} When the disc lacks the bar, or the walk refuses its
 *   path.
 */
export function HumanRoundaboutPush(
  context: IAutoMovieMotionHumanActionContext<Params>,
): Plan {
  const { to, via, on, bar, hand }: Params = context.params;
  // The bar is admitted before the walk is planned.
  readPropGrip(context, on, bar, context.start, "bar");
  const path: Plan = walk.plan({
    ...context,
    params: via === undefined ? { to } : { to, via },
  });
  const reach: number = Math.min(REACH, path.duration);
  const contacts: IAutoMovieMotionHumanContactWindow[] = [
    ...path.contacts,
    {
      part: `${hand}Hand`,
      kind: "grip",
      from: reach / path.duration,
      to: 1,
      support: { kind: "prop", subject: on },
    },
  ];
  // The goal is the hand on the bar where the disc has it at each second;
  // the arm reaches it and holds it on one planned course, so it keeps its
  // branch as the bar moves.
  const goals: Plan = {
    ...path,
    contacts,
    posture: (at: number): Posture => {
      const posture: Posture = path.posture(at);
      const arm: IAutoMovieMotionHumanMountRider.IHoldResult =
        HumanMountRider.hold(
          context.body,
          hand,
          posture,
          readPropGrip(context, on, bar, context.start + at, "bar"),
          1,
          {},
        );
      const closing: number = minimumJerk.share(at / reach);
      const held: JointEntries = arm.fingers;
      const fingers: Record<string, JointEntries[string]> = {};
      for (const [bone, angles] of Object.entries(held))
        if (angles !== undefined)
          fingers[bone] = [
            angles[0] * closing,
            angles[1] * closing,
            angles[2] * closing,
          ];
      return {
        ...posture,
        joints: { ...posture.joints, ...fingers },
        limbs: { ...posture.limbs, [`${hand}Arm`]: arm.arm },
      };
    },
  };
  return courseArmGoal({
    context,
    plan: goals,
    side: hand,
    span: { start: 0, ready: reach, relax: path.duration, end: path.duration },
  });
}
