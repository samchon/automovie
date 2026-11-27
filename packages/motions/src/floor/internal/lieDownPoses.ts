import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanJoints,
  IAutoMovieMotionHumanLieDown,
} from "@automovie/interface";

import { HumanHand } from "../../posture/internal/HumanHand";

/** The standing-to-floor law's authored posture keys, in clinical degrees. */
export namespace lieDownPoses {
  /** Relative hip adduction of parallel legs in side lying, degrees. */
  export const STACKED: number = 0;

  /** The floor postures (provisional angles). */
  export const POSES: Readonly<
    Record<Key, IAutoMovieMotionHumanLieDown.IPose>
  > = {
    sit: pose(-30, 0, { hip: 110, knee: 100, shoulder: -40, elbow: 5 }),
    kneel: pose(0, 0, {
      hip: 0,
      knee: 110,
      shoulder: 0,
      elbow: 12,
      ankle: -30,
    }),
    quadruped: pose(85, 0, {
      hip: 85,
      knee: 95,
      shoulder: 85,
      elbow: 0,
      neck: -40,
      ankle: -40,
    }),
    supine: pose(-90, 0, {
      hip: 5,
      knee: 5,
      shoulder: 0,
      elbow: 10,
      ankle: -20,
    }),
    prone: pose(88, 0, {
      hip: 0,
      knee: 10,
      shoulder: 0,
      elbow: 10,
      ankle: -45,
      neck: -10,
    }),
    lateralLeft: pose(
      0,
      -88,
      { hip: 40, knee: 60, shoulder: 70, elbow: 60, ankle: -15 },
      "left",
    ),
    lateralRight: pose(
      0,
      88,
      { hip: 40, knee: 60, shoulder: 70, elbow: 60, ankle: -15 },
      "right",
    ),

    // Seated on the floor with the legs ahead (provisional angles).
    sitLong: pose(-8, 0, { hip: 82, knee: 5, shoulder: -25, elbow: 15 }),

    // Seated cross-legged, and with the legs folded to the right and the trunk leant to the left hand (provisional angles). The legs here are only what the pelvis is rested on the floor with: a thigh both flexed level and spread is not a set of these angles, so `floorSeat` folds the legs by goals on the floor.
    sitCrossed: pose(0, 0, { hip: 90, knee: 5, shoulder: 10, elbow: 40 }),
    sitSide: bent(
      pose(0, 0, { hip: 90, knee: 5, shoulder: 0, elbow: 20 }),
      [-25, -15],
    ),
  };

  /**
   * A floor posture with its trunk bent to the side at the spine and the chest,
   * degrees of abduction: about the forward axis, so a negative bend tips the
   * trunk to the body's left (`HUMANOID_JOINT_AXES`' default basis). The pelvis
   * stays down while the shoulder comes over the hand leant on.
   */
  function bent(
    posture: IAutoMovieMotionHumanLieDown.IPose,
    side: readonly [number, number],
  ): IAutoMovieMotionHumanLieDown.IPose {
    const spine: readonly [number, number, number] = posture.joints.spine ?? [
      0, 0, 0,
    ];
    const chest: readonly [number, number, number] = posture.joints.chest ?? [
      0, 0, 0,
    ];
    return {
      ...posture,
      joints: {
        ...posture.joints,
        spine: [spine[0], spine[1] + side[0], spine[2]],
        chest: [chest[0], chest[1] + side[1], chest[2]],
      },
    };
  }

  /**
   * A floor posture from its whole-body tilt and symmetric limb angles. Lying
   * on a side, no limb spreads away from the trunk into the floor: the arms and
   * both flexed legs remain parallel at the separation of the hips.
   */
  function pose(
    pitch: number,
    roll: number,
    a: IShape,
    down?: AutoMovieHumanSide,
  ): IAutoMovieMotionHumanLieDown.IPose {
    // The hands at rest; every arm angle is the posture's own below.
    const joints: IAutoMovieMotionHumanJoints.Angles = {
      ...HumanHand.shape("left", "relaxed"),
      ...HumanHand.shape("right", "relaxed"),
    };
    for (const side of ["left", "right"] as const) {
      joints[`${side}UpperLeg`] = [
        a.hip,
        down === undefined ? 5 : side === down ? 0 : -STACKED,
        0,
      ];
      joints[`${side}LowerLeg`] = [a.knee, 0, 0];
      joints[`${side}Foot`] = [a.ankle ?? 0, 0, 0];
      joints[`${side}UpperArm`] = [a.shoulder, down === undefined ? 10 : 0, 0];
      joints[`${side}LowerArm`] = [a.elbow, 0, 0];
    }
    joints.neck = [a.neck ?? 0, 0, 0];
    return { pitch, roll, joints };
  }
}

/** Joint angles of one symmetric floor posture, in clinical degrees. */
interface IShape {
  /** Hip flexion. */
  hip: number;
  /** Knee flexion. */
  knee: number;
  /** Shoulder flexion. */
  shoulder: number;
  /** Elbow flexion. */
  elbow: number;
  /** Neck flexion, defaulting to clinical zero. */
  neck?: number;
  /** Ankle flexion, defaulting to clinical zero. */
  ankle?: number;
}

/** The intermediate and terminal keys in a floor route. */
type Key =
  | "sit"
  | "kneel"
  | "quadruped"
  | IAutoMovieMotionHumanLieDown.Position;
