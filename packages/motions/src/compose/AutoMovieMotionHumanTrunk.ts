import type { IHumanBody } from "../body/IHumanBody";
import { HumanBalance } from "../everyday/HumanBalance";
import type { IHumanPosture } from "../posture/IHumanPosture";
import type { AutoMovieMotionClock } from "./AutoMovieMotionClock";
import { AutoMovieMotionHumanJoints } from "./AutoMovieMotionHumanJoints";
import { AutoMovieMotionHumanLean } from "./AutoMovieMotionHumanLean";
import { AutoMovieMotionHumanRoot } from "./AutoMovieMotionHumanRoot";
import type { IAutoMovieMotionHumanPrimitive } from "./IAutoMovieMotionHumanPrimitive";

/**
 * Trunk phrases: the trunk turned on the pelvis, the body sunk into its
 * knees, and the hips moved back under a limb held out.
 *
 * The hip shifts are solved by {@link HumanBalance.shift} on the body at the
 * phrase's fullest pose and scaled between by the clock's envelope, so no
 * shift is stated as a constant.
 */
export namespace AutoMovieMotionHumanTrunk {
  /** The chest's share of a trunk turn; the lumbar spine takes the rest. */
  export const CHEST: number = 0.6;

  /**
   * A turn: the trunk twists on the pelvis and comes back (the wind-up and
   * the rotation of a throw or a punch, a turn toward a neighbour).
   *
   * @param clock The action's clock.
   * @param rise The instants the turn starts growing and is full at.
   * @param fall The instants the turn starts shrinking and is gone at.
   * @param degrees The twist at its fullest, degrees; positive toward the performer's left.
   * @returns The primitive, on the trunk.
   */
  export function turn(
    clock: AutoMovieMotionClock.IClock,
    rise: readonly [string, string],
    fall: readonly [string, string],
    degrees: number,
  ): IAutoMovieMotionHumanPrimitive {
    return AutoMovieMotionHumanJoints.pulse(clock, rise, fall, {
      chest: [0, 0, CHEST * degrees],
      spine: [0, 0, (1 - CHEST) * degrees],
    });
  }

  /** A crouch over two windows. */
  export interface ICrouch {
    /** The body. */
    body: IHumanBody;

    /** A standing posture of the action, the one the balance is solved on. */
    standing: IHumanPosture;

    /** The action's clock. */
    clock: AutoMovieMotionClock.IClock;

    /** The instants the body starts sinking and is lowest at. */
    rise: readonly [string, string];

    /** The instants the body starts rising and stands again at. */
    fall: readonly [string, string];

    /** How far the hips sink at the lowest, metres; not negative. */
    depth: number;

    /** The trunk's forward pitch at the lowest, degrees; not negative. */
    pitch: number;
  }

  /**
   * A crouch: the hips sink and the trunk pitches forward over them, the
   * hips moved back so the centre of mass stays over the feet, and the body
   * stands again (a duck, the dip before a jump, a load taken into the legs).
   * The planted legs keep their goals, so the knees bend.
   *
   * @param props The body, the standing posture, the windows, the depth and the pitch.
   * @returns The primitive, on the root and the trunk.
   * @throws {Error} When the depth or the pitch is negative.
   */
  export function crouch(props: ICrouch): IAutoMovieMotionHumanPrimitive {
    if (!(props.depth >= 0) || !(props.pitch >= 0))
      throw new Error("A crouch's depth and pitch are not negative");
    const low = (
      posture: IHumanPosture,
      share: number,
      back: number,
    ): IHumanPosture =>
      AutoMovieMotionHumanLean.tip(
        props.body,
        {
          ...posture,
          root: { ...posture.root, y: posture.root.y - props.depth * share },
        },
        props.pitch * share,
        back,
      );
    const back: number = HumanBalance.shift(
      props.body,
      (b: number): IHumanPosture => low(props.standing, 1, b),
    );
    return {
      channels: ["root", "trunk"],
      from: props.clock.at(props.rise[0]),
      to: props.clock.at(props.fall[1]),
      write: (posture: IHumanPosture, seconds: number): IHumanPosture => {
        const share: number = props.clock.envelope(
          props.rise,
          props.fall,
          seconds,
        );
        return low(posture, share, back * share);
      },
    };
  }

  /**
   * A counterbalance: the hips move back along the heading under a limb held
   * out ahead and come forward again as it returns (a kick's leg, a load at
   * arm's length), by the shift that puts the centre of mass of the extended
   * pose back over the feet.
   *
   * @param body The body.
   * @param clock The action's clock.
   * @param rise The instants the limb starts extending and is fullest at.
   * @param fall The instants the limb starts returning and is back at.
   * @param extended The action's posture at the limb's fullest extension.
   * @returns The primitive, on the root.
   */
  export function counterbalance(
    body: IHumanBody,
    clock: AutoMovieMotionClock.IClock,
    rise: readonly [string, string],
    fall: readonly [string, string],
    extended: IHumanPosture,
  ): IAutoMovieMotionHumanPrimitive {
    const back: number = HumanBalance.shift(
      body,
      (b: number): IHumanPosture =>
        AutoMovieMotionHumanRoot.place(extended, {
          point: { x: 0, y: 0, z: -b },
          yaw: 0,
        }),
    );
    return AutoMovieMotionHumanRoot.excursion(clock, rise, fall, {
      point: { x: 0, y: 0, z: -back },
      yaw: 0,
    });
  }
}
