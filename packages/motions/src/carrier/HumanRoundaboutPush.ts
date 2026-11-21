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
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { courseArmGoal } from "../compose/courseArmGoal";
import { HumanMountRider } from "../lexicon/HumanMountRider";
import { readPropGrip } from "./readPropGrip";

type Params = IAutoMovieMotionHumanPlayground.IRoundaboutPushParams;
type Plan = IAutoMovieMotionHumanActionPlan;
type Posture = IAutoMovieMotionHumanPosture;

/** Seconds over which the hand reaches the bar at the walk's start (provisional staging). */
const REACH: number = 0.4;

/**
 * Run alongside a roundabout pushing one grab bar: the walk on the ground
 * (`walk`) with the named hand closing on the bar as the walk starts and
 * holding it where the turning disc carries it, read from the scene at
 * each second; the arm reaches and holds it on one planned course
 * (`courseArmGoal`).
 *
 * @param context The standing entry, the walk's path, the disc and the bar.
 * @returns The walk with the hand on the moving bar.
 * @throws {HumanRefusal} When the disc lacks the bar, or the walk refuses its path.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the walk it wraps, the reach and the moving grip.
 * @evidence contracts/development/implementation.md#principled-implementation Each sample fits the arm to the bar where the scene's disc has it, so the hand moves with the disc.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Plan the walk, check the bar once, then fit the arm per sample.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The disc's turn is never authored here. The reach time is a named provisional staging value.
 * @evidence contracts/development/implementation.md#efficient-algorithms One bar read and one arm fit per sample.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the walk and the rider's hand fit.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the walk plan for the action.
 */
export function HumanRoundaboutPush(
  context: IAutoMovieMotionHumanActionContext<Params>,
): Plan {
  const { to, via, on, bar, hand }: Params = context.params;
  const path: Plan = walk.plan({
    ...context,
    params: via === undefined ? { to } : { to, via },
  });
  readPropGrip(context, on, bar, context.start, "bar");
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
      const fingers: Posture["joints"] = {};
      for (const [bone, angles] of Object.entries(arm.fingers))
        if (angles !== undefined)
          fingers[bone as keyof Posture["joints"]] = [
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
    body: context.body,
    plan: goals,
    side: hand,
    rest: AutoMovieMotionHumanArm.angles(context.entry.pose, hand),
    span: { start: 0, ready: reach, relax: path.duration, end: path.duration },
  });
}
