import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPunch,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { poseBones } from "../posture/poseBones";
import { StrikingBody } from "./StrikingBody";
import { StrikingSkill } from "./StrikingSkill";
import { StrikingTwist } from "./StrikingTwist";
import { punchContact } from "./punchContact";
import type { punchGeometry } from "./punchGeometry";

/**
 * Read what a punch fixes of its own entry alone: the trunk's turn, the
 * punching shoulder under that turn and the arms as the entry shows them.
 *
 * A punch's geometry is built again whenever the performance settles
 * (another action was placed, a stop was committed), three or four times a
 * punch, and each build read these again though no target, no partner and
 * no committed stop enters them. They are the plan's launch, made once; what
 * follows the target as shown (the line, the tracker, the room, the reach
 * and its corrections) and the stop is built on it at every settle.
 *
 * @param context The action's context.
 * @param timing The punch's timing.
 * @returns The launch.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a launch holds, what it does not depend on, how often it was and is made, and each input.
 * @evidence contracts/development/implementation.md#principled-implementation The technique's coached turn scaled by the skill's range share, the shoulder read on the entry's trunk turned by the yaw's and the spine's shares of it, and the entry's own six arm joints.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The turn, one trunk read, one entry read.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The shares of the turn the yaw and the spine take are the contact's own, unchanged.
 * @evidence contracts/development/implementation.md#efficient-algorithms One trunk resolve and one entry FK a plan, where each geometry build made both.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Both depend on the entry, the hand and the skill alone, which are the plan's own, so one reading serves every build.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan holds the shoulder and the six posed arm joints until it is released.
 */
export function punchLaunch(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanPunch.IParams>,
  timing: punchGeometry.ITiming,
): punchLaunch.ILaunch {
  const { side, lead, which }: punchGeometry.ITiming = timing;
  const body: IAutoMovieMotionHumanBody = context.body;
  const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
  const turn: number =
    (lead === "left" ? 1 : -1) *
    punchContact.TURN[context.params.technique][which] *
    StrikingSkill.amplitude(context.skill);
  return {
    turn,

    // The shoulder at contact: the entry turned.
    shoulder: StrikingBody.trunk(
      body,
      {
        ...entry,
        yaw: entry.yaw + 0.4 * turn,
        joints: {
          ...entry.joints,
          ...StrikingTwist.trunk(entry.joints, 0.3 * turn),
        },
      },
      undefined,
      new Set<AutoMovieHumanoidBone>([`${side}UpperArm`]),
    ).get(`${side}UpperArm` as AutoMovieHumanoidBone)!.worldPosition,

    // The arms at the launch, read from the displayed entry pose.
    bones: poseBones(body, context.entry.pose, undefined, ARM_BONES),
  };
}

/**
 * Companion type of {@link punchLaunch}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, frame and unit.
 * @evidence contracts/development/design.md#principled-representation The plan's own constants of the contact, in world metres and degrees.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Three members, all read by the contact's solve.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the resolved bone type; nothing of the target is kept here.
 */
export namespace punchLaunch {
  /** What a punch reads of its own entry alone. */
  export interface ILaunch {
    /** The trunk turn at contact, degrees. */
    turn: number;

    /** The punching shoulder under that turn, before a body shot lowers it, world metres. */
    shoulder: IAutoMovieVector3;

    /** The entry's six arm joints as displayed, world frame: the launch wrist and elbow and both arm sweeps read them. */
    bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
  }
}

/** The six arm joints the punch's stroke and both arm sweeps read. */
const ARM_BONES: ReadonlySet<AutoMovieHumanoidBone> =
  new Set<AutoMovieHumanoidBone>([
    "leftUpperArm",
    "leftLowerArm",
    "leftHand",
    "rightUpperArm",
    "rightLowerArm",
    "rightHand",
  ]);
