import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanArmAngles,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanRide,
  IAutoMovieMotionPropHold,
  IAutoMovieResolvedBone,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../../compose/internal/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanHeld } from "../../compose/internal/AutoMovieMotionHumanHeld";
import { poseBones } from "../../posture/internal/poseBones";

/**
 * Keep each hand that holds a prop and takes none of the ride's grips.
 *
 * @param context The ride's context.
 * @returns The posture and the records that keep the props held.
 */
export function HeldRideArms(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanRide.IParams>,
): HeldRideArms.IKept {
  const posture: IAutoMovieMotionHumanPosture = context.entry.posture;
  const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
  let joints: IAutoMovieMotionHumanPosture["joints"] = posture.joints;
  const contacts: IAutoMovieMotionHumanContactWindow[] = [];
  const holds: IAutoMovieMotionPropHold[] = [];
  for (const side of [
    "left",
    "right",
  ] as const satisfies readonly AutoMovieHumanSide[]) {
    const prop: string | undefined = context.entry.holds[side];
    if (prop === undefined || context.params.hands?.[side] !== undefined)
      continue;
    const chain: ReadonlySet<AutoMovieHumanoidBone> =
      new Set<AutoMovieHumanoidBone>([`${side}LowerArm`, `${side}Hand`]);
    const shown: ReturnType<typeof poseBones> = poseBones(
      context.body,
      context.entry.pose,
      undefined,
      chain,
    );
    const wrist: IAutoMovieResolvedBone = shown.get(`${side}Hand`)!;
    limbs[`${side}Arm`] = {
      point: wrist.worldPosition,
      rotation: wrist.worldRotation,
      bend: shown.get(`${side}LowerArm`)!.worldPosition,
    };
    const angles: IAutoMovieMotionHumanArmAngles.IAngles =
      AutoMovieMotionHumanArm.angles(context.entry.pose, side);
    joints = { ...joints, ...angles.fingers };
    const held: IAutoMovieMotionHumanHeld.IHeld = AutoMovieMotionHumanHeld(
      context,
      side,
      prop,
    );
    contacts.push(AutoMovieMotionHumanHeld.grip(held));
    holds.push(AutoMovieMotionHumanHeld.hold(context, held));
  }
  return {
    posture: holds.length === 0 ? posture : { ...posture, limbs, joints },
    contacts,
    holds,
  };
}

/**
 * The hands a ride keeps holding what they brought into it (`HumanRide`).
 *
 * A hand that holds a prop and takes none of the ride's grips would otherwise
 * be carried by the performance's held carry, which rides the hand on the chest
 * (`HumanSegmentCarry`); the trunk leans toward the rein and answers the
 * horse's strides, and a closed hand round a lance's grip goes down with it
 * onto the thigh. The ride drives such a hand itself instead: it keeps the
 * wrist, the turn and the elbow the entry displays as a goal the support
 * carries, its fingers closed as they were, so the hand keeps the carriage it
 * brought in while the trunk moves under it; and since a held hand may be
 * driven only by an action that holds its prop, the ride grips the prop for its
 * length and leaves it held.
 */
export namespace HeldRideArms {
  /** The seated posture with each held hand kept, and what keeps its prop held. */
  export interface IKept {
    /**
     * The seated posture to carry, each held hand's arm a goal where the entry
     * displays it.
     */
    posture: IAutoMovieMotionHumanPosture;

    /** A grip window on each held prop through the ride. */
    contacts: IAutoMovieMotionHumanContactWindow[];

    /** The hold each held prop is left in. */
    holds: IAutoMovieMotionPropHold[];
  }
}
