import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPunch,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanBoneGroups } from "../posture/HumanBoneGroups";
import { poseBones } from "../posture/poseBones";
import { StrikingBody } from "./StrikingBody";
import { StrikingSkill } from "./StrikingSkill";
import { StrikingTwist } from "./StrikingTwist";
import { punchContact } from "./punchContact";
import { punchFootwork } from "./punchFootwork";
import type {
  IAutoMovieMotionHumanSkill,
  punchGeometry,
} from "./punchGeometry";

/**
 * Read what a punch fixes of its own entry alone: the trunk's turn, the
 * punching shoulder under that turn and the arms as the entry shows them.
 *
 * A punch's geometry is built again whenever the performance settles (another
 * action was placed, a stop was committed), three or four times a punch, and
 * each build read these again though no target, no partner and no committed
 * stop enters them. They are the plan's launch, made once; what follows the
 * target as shown (the line, the tracker, the room, the reach and its
 * corrections) and the stop is built on it at every settle.
 *
 * @param context The action's context.
 * @param timing The punch's timing.
 * @returns The launch.
 */
export function punchLaunch(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanPunch.IParams>,
  timing: punchGeometry.ITiming,
): punchLaunch.ILaunch {
  const { side, lead, which }: punchGeometry.ITiming = timing;
  const body: IAutoMovieMotionHumanBody = context.body;
  const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
  const turn: number = punchLaunch.turn(
    lead,
    context.params.technique,
    which,
    context.skill,
  );

  return {
    turn,

    // The shoulder at contact: the entry turned.
    shoulder: StrikingBody.trunk(
      body,
      {
        ...entry,
        yaw: entry.yaw + punchFootwork.PELVIS_SHARE * turn,
        joints: {
          ...entry.joints,
          ...StrikingTwist.trunk(
            entry.joints,
            punchFootwork.SPINE_SHARE * turn,
          ),
        },
      },
      undefined,
      new Set<AutoMovieHumanoidBone>([`${side}UpperArm`]),
    ).get(`${side}UpperArm` as AutoMovieHumanoidBone)!.worldPosition,

    // The arms at the launch, read from the displayed entry pose.
    bones: poseBones(body, context.entry.pose, undefined, HumanBoneGroups.ARMS),
  };
}

/** Companion type of {@link punchLaunch}. */
export namespace punchLaunch {
  /**
   * The punch's trunk turn at the launch: the technique's turn for the lead or
   * the rear hand (`punchContact.TURN`), scaled by the skill's amplitude, and
   * signed toward the lead side.
   *
   * @param lead The lead side.
   * @param technique The punch.
   * @param which The lead or the rear hand.
   * @param skill The puncher's skill.
   * @returns Degrees.
   */
  export function turn(
    lead: AutoMovieHumanSide,
    technique: IAutoMovieMotionHumanPunch.IParams["technique"],
    which: punchGeometry.ITiming["which"],
    skill: IAutoMovieMotionHumanSkill,
  ): number {
    return (
      (lead === "left" ? 1 : -1) *
      punchContact.TURN[technique][which] *
      StrikingSkill.amplitude(skill)
    );
  }

  /** What a punch reads of its own entry alone. */
  export interface ILaunch {
    /** The trunk turn at contact, degrees. */
    turn: number;

    /**
     * The punching shoulder under that turn, before a body shot lowers it,
     * world metres.
     */
    shoulder: IAutoMovieVector3;

    /**
     * The entry's six arm joints as displayed, world frame: the launch wrist
     * and elbow and both arm sweeps read them.
     */
    bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
  }
}
