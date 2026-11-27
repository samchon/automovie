import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanEntryState,
} from "@automovie/interface";

import { jumpJoints } from "./jumpJoints";
import type { jumpPush } from "./jumpPush";
import { stand } from "./stand";

/*
 * A jump push's arm tracks (`jumpPush`): each upper arm from its entered
 * flexion and rate to the take-off swing, and each elbow's gap from the jump's
 * elbow rule faded with its rate to none at the take-off, read from the push's
 * entry.
 * Parameter scope: What the push builds its arm tracks from.
 * Returns: The arm readers.
 */
export function jumpPushArms(scope: jumpPushArms.IScope): jumpPushArms.IArms {
  const { entry }: jumpPushArms.IScope = scope;
  const prepareArm: (side: AutoMovieHumanSide) => IArmTrack = (
    side: AutoMovieHumanSide,
  ): IArmTrack => {
    const from: number = entry.posture.joints[`${side}UpperArm`]?.[0] ?? 0;
    const rate: number = entry.velocity.joints.get(`${side}UpperArm`)?.[0] ?? 0;
    // The jump's elbow rule is the relaxed elbow plus a third of the
    // shoulder's flexion (`jumpJoints.SHOULDER_PER_ELBOW`); the entered
    // elbow's gap from it, and that gap's rate, are what the push fades.
    const ruled: number = stand.ELBOW + from / jumpJoints.SHOULDER_PER_ELBOW;
    const elbow: number | undefined =
      entry.posture.joints[`${side}LowerArm`]?.[0];
    return {
      from,
      delta: jumpJoints.TAKEOFF - from,
      rate,
      bend: elbow === undefined ? 0 : elbow - ruled,
      bending:
        elbow === undefined
          ? 0
          : (entry.velocity.joints.get(`${side}LowerArm`)?.[0] ?? 0) -
            rate / jumpJoints.SHOULDER_PER_ELBOW,
    };
  };
  const arms: Record<AutoMovieHumanSide, IArmTrack> = {
    left: prepareArm("left"),
    right: prepareArm("right"),
  };
  const swinging: (side: AutoMovieHumanSide) => number = (
    side: AutoMovieHumanSide,
  ): number => arms[side].rate;
  const armAt: jumpPush.IPush["arm"] = (
    phase: jumpPush.IPhase,
    side: AutoMovieHumanSide,
  ): number => {
    const track: IArmTrack = arms[side];
    return track.from + track.delta * phase.progress + track.rate * phase.carry;
  };
  const elbowAt: jumpPush.IPush["elbow"] = (
    phase: jumpPush.IPhase,
    side: AutoMovieHumanSide,
  ): number => {
    const track: IArmTrack = arms[side];
    return track.bend * (1 - phase.progress) + track.bending * phase.carry;
  };

  return { swinging, armAt, elbowAt };
}

/*
 * What a jump push's arm tracks read and what they are.
 */
export namespace jumpPushArms {
  /*
   * What a jump push builds its arm tracks from.
   */
  export interface IScope {
    /*
     * The fixed entry snapshot supplying the push's initial values and rates.
     */
    entry: IAutoMovieMotionHumanEntryState;
  }

  /*
   * The arm readers.
   */
  export interface IArms {
    /*
     * An upper arm's entry flexion rate (`jumpPush.IPush.swinging`).
     */
    swinging: jumpPush.IPush["swinging"];

    /*
     * The upper-arm flexion at a push sample (`jumpPush.IPush.arm`).
     */
    armAt: jumpPush.IPush["arm"];

    /*
     * An elbow's gap from the elbow rule (`jumpPush.IPush.elbow`).
     */
    elbowAt: jumpPush.IPush["elbow"];
  }
}
/*
 * The original entered shoulder angle, its authored target difference and
 * carried flexion rate, with the entered elbow's gap from the jump's elbow
 * rule.
 */
interface IArmTrack {
  /*
   * Entered shoulder flexion, clinical degrees.
   */
  from: number;

  /*
   * Sixty degrees minus the entered flexion, preserving the original
   * subtraction.
   */
  delta: number;

  /*
   * Entered flexion rate, degrees per second; zero when absent.
   */
  rate: number;

  /*
   * The entered elbow flexion less the jump's elbow rule at the entered
   * shoulder, clinical degrees; zero when the entry has no elbow.
   */
  bend: number;

  /*
   * That gap's entered rate, degrees per second: the elbow's rate less the
   * rule's share of the shoulder's; zero when the entry has no elbow.
   */
  bending: number;
}
