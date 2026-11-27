import type {
  IAutoMovieMotionHumanLieDown,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import { HumanHand } from "../../posture/internal/HumanHand";

/**
 * The parachute jump's key poses, as whole-body tilt and joint angles in
 * degrees (`[flexion, abduction, twist]`), all provisional: the belly-to-earth
 * arch with the hips pressed forward, the limbs spread and bent and the head
 * up, as the USPA Skydiver's Information Manual teaches it; the upright hang
 * under the canopy with the hands up on the toggles; hands a riser's width
 * apart; the flare with both toggles pulled down and the feet and knees
 * together; and the parachute landing fall's keys from the feet to the side of
 * the back, as US Army FM 3-21.220 orders its five points of contact.
 */
export namespace skydivePoses {
  /** The belly-to-earth arch. */
  export const ARCH: IAutoMovieMotionHumanLieDown.IPose = pose(88, 0, {
    leg: [-15, 25, 0],
    knee: 45,
    arm: [30, 80, 0],
    elbow: 80,
    neck: -35,
  });

  /** The hang under the canopy, the hands up on the toggles. */
  export const HANG: IAutoMovieMotionHumanLieDown.IPose = pose(0, 0, {
    leg: [10, 5, 0],
    knee: 15,
    arm: [15, 150, 0],
    elbow: 20,
    neck: 0,
  });

  /**
   * The arms spread out level at the deployment's snatch, on their way from the
   * arch up to the risers: the hands pass wide of the head.
   */
  export const SPREAD: IAutoMovieMotionHumanLieDown.IPose = pose(45, 0, {
    leg: [0, 15, 0],
    knee: 30,
    arm: [20, 90, 0],
    elbow: 10,
    neck: -15,
  });

  /** The flare: both toggles down, feet and knees together, knees bent. */
  export const FLARE: IAutoMovieMotionHumanLieDown.IPose = pose(0, 0, {
    leg: [20, 0, 0],
    knee: 25,
    arm: [30, 30, 0],
    elbow: 20,
    neck: 0,
  });

  /** One key of the parachute landing fall. */
  export interface IKey {
    /** Share of the landing fall. */
    at: number;

    /** The pose, its roll toward the left side; the right side mirrors it. */
    pose: IAutoMovieMotionHumanLieDown.IPose;
  }

  /**
   * The landing fall's keys after the flare: the calf, the thigh, the buttock
   * and the push-up muscle; the lying side ends it.
   */
  export const PLF: readonly IKey[] = [
    {
      at: 0.2,
      pose: pose(10, -20, {
        leg: [50, 0, 0],
        knee: 70,
        arm: [20, 15, 0],
        elbow: 60,
        neck: 20,
      }),
    },
    {
      at: 0.4,
      pose: pose(5, -50, {
        leg: [70, 0, 0],
        knee: 90,
        arm: [20, 15, 0],
        elbow: 80,
        neck: 30,
      }),
    },
    {
      at: 0.6,
      pose: pose(-20, -70, {
        leg: [70, 0, 0],
        knee: 90,
        arm: [30, 10, 0],
        elbow: 90,
        neck: 30,
      }),
    },
    {
      at: 0.8,
      pose: pose(-40, -88, {
        leg: [50, 0, 0],
        knee: 70,
        arm: [40, 10, 0],
        elbow: 90,
        neck: 20,
      }),
    },
  ];

  /**
   * A pose as a posture at the origin with a heading.
   *
   * @param position The pose.
   * @param yaw The heading, degrees.
   * @param mirror Whether to roll to the right instead of the left.
   * @returns The posture, its root at the origin.
   */
  export function at(
    position: IAutoMovieMotionHumanLieDown.IPose,
    yaw: number,
    mirror: boolean,
  ): IAutoMovieMotionHumanPosture {
    return {
      root: { x: 0, y: 0, z: 0 },
      yaw,
      pitch: position.pitch,
      roll: mirror ? -position.roll : position.roll,
      joints: position.joints,
      limbs: {},
    };
  }

  /** The angles a pose is made from. */
  interface IShape {
    /** Each thigh's flexion, abduction and twist. */
    leg: readonly [number, number, number];

    /** Each knee's flexion. */
    knee: number;

    /** Each upper arm's flexion, abduction and twist. */
    arm: readonly [number, number, number];

    /** Each elbow's flexion. */
    elbow: number;

    /** The neck's flexion; negative raises the head. */
    neck: number;
  }

  /** A symmetric pose with gripping hands. */
  function pose(
    pitch: number,
    roll: number,
    a: IShape,
  ): IAutoMovieMotionHumanLieDown.IPose {
    const joints: IAutoMovieMotionHumanLieDown.IPose["joints"] = {
      ...HumanHand.shape("left", "fist"),
      ...HumanHand.shape("right", "fist"),
    };
    for (const side of ["left", "right"] as const) {
      joints[`${side}UpperLeg`] = [...a.leg];
      joints[`${side}LowerLeg`] = [a.knee, 0, 0];
      joints[`${side}UpperArm`] = [...a.arm];
      joints[`${side}LowerArm`] = [a.elbow, 0, 0];
    }
    joints.neck = [a.neck, 0, 0];
    return { pitch, roll, joints };
  }
}
