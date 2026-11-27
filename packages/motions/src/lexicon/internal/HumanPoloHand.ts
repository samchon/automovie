import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanHand } from "../../posture/internal/HumanHand";

/*
 * Read a held tool in the hand's rest frame.
 * Parameter body: The body.
 * Parameter side: The holding hand.
 * Parameter tool: The held tool.
 * Returns: The hand frame and the working point in it.
 */
export function HumanPoloHand(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
  tool: IAutoMovieMotionHumanStrikingHeld.ITool,
): HumanPoloHand.IHand {
  const asked: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };
  const fingers: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.inverse(
      HumanHand.rotation(side, {
        fingers: asked,
        palm: { x: 0, y: -1, z: 0 },
      }),
    ),
    asked,
  );
  const shaft: IAutoMovieVector3 = Vector3.normalize(
    Vector3.subtract(
      tool.axis,
      Vector3.scale(fingers, Vector3.dot(tool.axis, fingers)),
    ),
  );
  const point: IAutoMovieVector3 = Vector3.add(
    HumanHand.offset(body, side, "grip").point,
    tool.tip,
  );
  return {
    fingers,
    shaft,
    along: Vector3.dot(point, fingers),
    out: Vector3.dot(point, shaft),
    across: Vector3.dot(point, Vector3.cross(fingers, shaft)),
  };
}

/*
 * The held tool's geometry in the hand's own rest frame, and one instant of a
 * swing it places (`HumanPolo`).
 */
export namespace HumanPoloHand {
  /*
   * A held tool in the hand's rest frame.
   */
  export interface IHand {
    /*
     * Where the fingers point at rest, unit.
     */
    fingers: IAutoMovieVector3;

    /*
     * The tool's axis at rest, made square to the fingers, unit.
     */
    shaft: IAutoMovieVector3;

    /*
     * The working point from the wrist along the fingers, metres.
     */
    along: number;

    /*
     * The working point from the wrist along the tool's axis, metres.
     */
    out: number;

    /*
     * The working point from the wrist across both, along the fingers cross the
     * axis, metres.
     */
    across: number;
  }

  /*
   * One instant of a swing: where the wrist is, how the hand is turned and
   * where the tool's working point is.
   */
  export interface IStation {
    /*
     * The wrist joint, metres.
     */
    wrist: IAutoMovieVector3;

    /*
     * The hand's rotation from its rest.
     */
    rotation: IAutoMovieQuaternion;

    /*
     * The working point, metres.
     */
    head: IAutoMovieVector3;
  }

  /*
   * A swing's plane: the angle 0 direction, the direction of travel at 0, and
   * their cross.
   */
  export interface IPlane {
    /*
     * The direction at angle 0, unit.
     */
    u: IAutoMovieVector3;

    /*
     * The direction of travel at angle 0, unit, square to `u`.
     */
    w: IAutoMovieVector3;

    /*
     * `u` cross `w`.
     */
    normal: IAutoMovieVector3;
  }

  /*
   * Place the arm and the held tool as one in a swing's plane: the wrist a
   * distance out from the shoulder along the arm's angle, the fingers turned
   * from the arm's line by the deviation and the tool behind them, the whole
   * set off the plane by the working point's own offset across the hand so the
   * working point turns in the plane through the shoulder.
   * Parameter hand: The held tool in the hand's frame.
   * Parameter plane: The swing's plane.
   * Parameter shoulder: The shoulder joint, metres.
   * Parameter wrist: The wrist's distance from the shoulder within the plane,
   * metres.
   * Parameter arm: The arm's angle in the plane from `u` toward `w`, radians.
   * Parameter deviation: The wrist's deviation, radians, positive ulnar.
   * Returns: The wrist, the hand's rotation and the working point.
   */
  export function place(
    hand: IHand,
    plane: IPlane,
    shoulder: IAutoMovieVector3,
    wrist: number,
    arm: number,
    deviation: number,
  ): IStation {
    const r: IAutoMovieVector3 = Vector3.add(
      Vector3.scale(plane.u, Math.cos(arm)),
      Vector3.scale(plane.w, Math.sin(arm)),
    );
    const a: IAutoMovieVector3 = Vector3.add(
      Vector3.scale(plane.u, -Math.sin(arm)),
      Vector3.scale(plane.w, Math.cos(arm)),
    );
    const toward: IAutoMovieVector3 = Vector3.subtract(
      Vector3.scale(r, Math.cos(deviation)),
      Vector3.scale(a, Math.sin(deviation)),
    );
    const shaft: IAutoMovieVector3 = Vector3.scale(
      Vector3.add(
        Vector3.scale(r, Math.sin(deviation)),
        Vector3.scale(a, Math.cos(deviation)),
      ),
      -1,
    );
    const joint: IAutoMovieVector3 = Vector3.add(
      Vector3.add(shoulder, Vector3.scale(plane.normal, hand.across)),
      Vector3.scale(r, wrist),
    );
    return {
      wrist: joint,
      rotation: HumanHand.align(
        { normal: hand.fingers, forward: hand.shaft },
        { normal: toward, forward: shaft },
      ),
      head: Vector3.add(
        joint,
        Vector3.add(
          Vector3.add(
            Vector3.scale(toward, hand.along),
            Vector3.scale(shaft, hand.out),
          ),
          Vector3.scale(plane.normal, -hand.across),
        ),
      ),
    };
  }

  /*
   * The working point in a swing's plane against the arm's line.
   */
  export interface IPlanar {
    /*
     * From the shoulder along the arm's line, metres.
     */
    outward: number;

    /*
     * Across the arm's line along its way round, metres; negative behind it.
     */
    sideways: number;
  }

  /*
   * Where the working point lies against the arm's line, the wrist a distance
   * from the shoulder on it, the hand's fingers in the plane turned from the
   * line by a deviation and the tool behind them.
   * Parameter hand: The held tool in the hand's frame.
   * Parameter wrist: The wrist's distance from the shoulder along the line, metres.
   * Parameter deviation: The wrist's deviation, radians, positive ulnar.
   * Returns: The working point's coordinates in the plane.
   */
  export function planar(
    hand: IHand,
    wrist: number,
    deviation: number,
  ): IPlanar {
    return {
      outward:
        wrist +
        hand.along * Math.cos(deviation) -
        hand.out * Math.sin(deviation),
      sideways:
        -hand.along * Math.sin(deviation) - hand.out * Math.cos(deviation),
    };
  }

  /*
   * The deviation that puts the working point a distance from the shoulder, the
   * wrist on the arm's line at its own distance (`planar`).
   * Parameter hand: The held tool in the hand's frame.
   * Parameter wrist: The wrist's distance from the shoulder, metres.
   * Parameter distance: The working point's distance asked, metres.
   * Returns: The deviation, radians, positive ulnar; NaN when no deviation
   * gives that distance.
   */
  export function deviation(
    hand: IHand,
    wrist: number,
    distance: number,
  ): number {
    const cosine: number =
      (distance * distance -
        wrist * wrist -
        hand.along * hand.along -
        hand.out * hand.out) /
      (2 * wrist * Math.hypot(hand.along, hand.out));
    return Math.abs(cosine) <= 1
      ? Math.acos(cosine) - Math.atan2(hand.out, hand.along)
      : NaN;
  }
}
