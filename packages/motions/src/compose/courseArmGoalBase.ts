import type {
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanChannel,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
} from "@automovie/interface";

import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { AutoMovieMotionHumanChannel as HumanChannels } from "./AutoMovieMotionHumanChannel";
import { courseArmGoal } from "./courseArmGoal";

/**
 * The base a coursed plan is composed on (`courseArmGoal`): the plan with each
 * coursed arm's goal left out over its span, the plan's own arm before it, and
 * after it the angles its course ended with or the arm the course returns it
 * to; once laid, a second where every coursed arm is on its course asks the law
 * for every channel but those arms. Read from the course's props, plan, arms,
 * kept and returned angles, posture reader, and whether and how it is laid.
 *
 * @param scope What the course builds its base from.
 * @returns The base plan.
 */
export function courseArmGoalBase(
  scope: courseArmGoalBase.IScope,
): IAutoMovieMotionHumanActionPlan {
  const {
    props,
    plan,
    arms,
    kept,
    returned,
    read,
    laid,
    composed,
  }: courseArmGoalBase.IScope = scope;
  // Once laid, an arm on its course (`AutoMovieMotionHumanArmCarry.carried`
  // writes the planned trajectory there, not tracking a live goal) reads no
  // goal, and the base deletes it: the base asks the law for every channel
  // but those arms, so a law that honours the demand skips their goals
  // (`IAutoMovieMotionHumanActionPlan.posture`'s `channels`): demand-driven
  // evaluation of only the required parts, as an engine's animation graph
  // evaluates only its required bones. One
  // list per set of such arms, so the reads of a second share one posture.
  const demands: Map<string, readonly AutoMovieMotionHumanChannel[]> =
    new Map();
  const demand = (
    seconds: number,
  ): readonly AutoMovieMotionHumanChannel[] | undefined => {
    if (!laid()) return undefined;
    const unread: courseArmGoal.Limb[] = [];
    for (const arm of arms) {
      const span: IAutoMovieMotionHumanArmPlanned.ISpan =
        arm.span ?? props.span;
      if (
        arm.tracked !== true &&
        seconds > span.start &&
        (seconds <= span.end || props.after === "angles")
      )
        unread.push(`${arm.side}Arm`);
      // An arm whose carry writes this second off its course reads its goal
      // (`AutoMovieMotionHumanArmCarry.carried`): the whole posture is read
      // once for both, as before.
      else if (seconds >= span.start - 1e-9 && seconds <= span.end + 1e-9)
        return undefined;
    }
    if (unread.length === 0) return undefined;
    return HumanChannels.ORDER.filter(
      (channel: AutoMovieMotionHumanChannel): boolean =>
        !unread.some((limb: courseArmGoal.Limb): boolean => limb === channel),
    );
  };
  const base: IAutoMovieMotionHumanActionPlan = {
    ...plan,
    posture: (
      seconds: number,
      _channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
      resolution?: courseArmGoal.Resolution,
      projection?: courseArmGoal.Projection,
    ): IAutoMovieMotionHumanPosture => {
      // A law whose goal reads another performer gives its posture without
      // the coursed goals (`base`), so laying the course never evaluates the
      // live goal, and the other performer is read only as `perceived` says.
      const channels: readonly AutoMovieMotionHumanChannel[] | undefined =
        demand(seconds);
      const posture: IAutoMovieMotionHumanPosture =
        props.base === undefined
          ? read(seconds, resolution, projection, channels)
          : props.base.posture(seconds, channels, resolution, projection);
      const limbs: IAutoMovieMotionHumanPosture["limbs"] = {
        ...posture.limbs,
      };
      let joints: IAutoMovieMotionHumanPosture["joints"] = posture.joints;
      for (const arm of arms) {
        const limb: courseArmGoal.Limb = `${arm.side}Arm`;
        const span: IAutoMovieMotionHumanArmPlanned.ISpan =
          arm.span ?? props.span;
        // Before its course the arm is the plan's own: its goal stays, so a
        // course that starts after the action does takes over from the arm
        // the plan shows, never from a frozen rest.
        if (seconds < span.start) continue;
        if (seconds <= span.end) {
          delete limbs[limb];
          continue;
        }

        // After its course the arm keeps the angles the course ended with,
        // carried by the body as it moves on (`after: "angles"`), or is the
        // plan's own again, its goal fitted on the body as it moves on from
        // the arm the course ended on: the posture's arm joints carry that
        // arm, so the fit and the display's course of the goal both continue
        // its swivel and branch (Tolani, Goswami and Badler 2000: the
        // feasible swivel nearest the previous solution), never another
        // elbow side for the same goal at the seam.
        if (props.after === "angles") delete limbs[limb];
        let angles: IAutoMovieMotionHumanPosture["joints"] | undefined = laid()
          ? kept.get(limb)
          : returned.get(limb);
        if (angles === undefined) {
          // Until the composition is laid, another arm of the group whose
          // span runs on is planned on this base past this arm's end, before
          // the composition exists: the arm then stands where its course
          // returns it, the plan's own arm at the span's end (its `back`),
          // resolved once.
          angles = {};
          if (laid()) {
            const ended: IAutoMovieMotionHumanPosture["joints"] =
              composed().posture(span.end).joints;
            for (const bone of courseArmGoal.bones(arm.side))
              if (ended[bone] !== undefined) angles[bone] = ended[bone];
          } else {
            const back: IAutoMoviePose = resolveHumanPosture(
              props.context.body,
              read(span.end),
            );
            const chain: ReadonlySet<AutoMovieHumanoidBone> =
              new Set<AutoMovieHumanoidBone>(courseArmGoal.bones(arm.side));
            for (const joint of back.joints)
              if (chain.has(joint.bone))
                angles[joint.bone] = [
                  joint.flexion ?? 0,
                  joint.abduction ?? 0,
                  joint.twist ?? 0,
                ];
          }
        }
        joints = { ...joints, ...angles };
      }
      return { ...posture, limbs, joints };
    },
  };
  return base;
}

/** What the base of a coursed plan reads. */
export namespace courseArmGoalBase {
  /** What a course builds its base from. */
  export interface IScope {
    /** The course's props. */
    props: courseArmGoal.IProps;

    /** The law's plan. */
    plan: IAutoMovieMotionHumanActionPlan;

    /** The arms coursed together, the course's own first. */
    arms: readonly courseArmGoal.IArm[];

    /** Each arm's ending angles, once the course is laid. */
    kept: Map<courseArmGoal.Limb, IAutoMovieMotionHumanPosture["joints"]>;

    /** Each arm's return target, before the course is laid. */
    returned: Map<courseArmGoal.Limb, IAutoMovieMotionHumanPosture["joints"]>;

    /**
     * The plan's posture at a second, the last one read reused.
     *
     * @param seconds Seconds since the plan's start.
     * @param resolution The borrowed forward-kinematics reader, if any.
     * @param projection The borrowed range-of-motion projector, if any.
     * @param channels The channels demanded of the plan; every channel when
     *   absent.
     * @returns The plan's posture.
     */
    read: (
      seconds: number,
      resolution?: courseArmGoal.Resolution,
      projection?: courseArmGoal.Projection,
      channels?: readonly AutoMovieMotionHumanChannel[],
    ) => IAutoMovieMotionHumanPosture;

    /**
     * Whether the course is laid: the composition exists.
     *
     * @returns Whether it is laid.
     */
    laid: () => boolean;

    /**
     * The composition, read only once the course is laid.
     *
     * @returns The composed plan.
     */
    composed: () => IAutoMovieMotionHumanActionPlan;
  }
}
