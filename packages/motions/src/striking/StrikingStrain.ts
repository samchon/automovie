import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanHand } from "../posture/HumanHand";

/**
 * Rank actual hand frames by the straight-wrist arm's length residual. The
 * canonical grip offset, forearm line and measured segment lengths are read
 * once for the returned closure, while each candidate frame and shoulder is
 * read anew. This is a coarse rank; StrikingRoll still fits the preferred
 * frames.
 *
 * @param body The unchanged canonical body.
 * @param side The holding side.
 * @returns A synchronous candidate rank in metres for a world frame and
 *   shoulder.
 */
export function StrikingStrain(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
): (
  frame: IAutoMovieMotionHumanStrikingHeld.IHandFrame,
  shoulder: IAutoMovieVector3,
) => number {
  const grip: IAutoMovieVector3 = HumanHand.offset(body, side, "grip").point;

  // The forearm's line in the hand's rest frame: the fingers point away
  // from the body's midline along the hand bone's x axis.
  const fingers: IAutoMovieVector3 = {
    x: side === "left" ? 1 : -1,
    y: 0,
    z: 0,
  };
  const forearm: number = body.measure.forearm;
  const upperArm: number = body.measure.upperArm;
  return (
    frame: IAutoMovieMotionHumanStrikingHeld.IHandFrame,
    shoulder: IAutoMovieVector3,
  ): number =>
    StrikingStrain.of(frame, shoulder, { grip, fingers, forearm, upperArm });
}

/** How far a hand frame strains the arm. */
export namespace StrikingStrain {
  /** The arm a hand frame is read against. */
  export interface IArm {
    /** The grip's offset in the hand's frame, metres. */
    grip: IAutoMovieVector3;

    /** The fingers' direction in the hand's frame. */
    fingers: IAutoMovieVector3;

    /** The forearm, metres. */
    forearm: number;

    /** The upper arm, metres. */
    upperArm: number;
  }

  /**
   * The strain of a hand frame: the elbow lies a forearm back along the fingers
   * from the wrist, the wrist the grip's offset back from the held point, and
   * the strain is how far that elbow misses the shoulder by an upper arm.
   *
   * @param frame The held point and the hand's attitude.
   * @param shoulder The shoulder, world metres.
   * @param arm The grip, the fingers and the arm's lengths.
   * @returns The strain, metres, 0 for a reachable frame.
   */
  export function of(
    frame: IAutoMovieMotionHumanStrikingHeld.IHandFrame,
    shoulder: IAutoMovieVector3,
    arm: IArm,
  ): number {
    const elbow: IAutoMovieVector3 = Vector3.subtract(
      Vector3.subtract(
        frame.point,
        Quaternion.rotateVector(frame.rotation, arm.grip),
      ),
      Vector3.scale(
        Quaternion.rotateVector(frame.rotation, arm.fingers),
        arm.forearm,
      ),
    );
    return Math.abs(Vector3.distance(elbow, shoulder) - arm.upperArm);
  }
}
