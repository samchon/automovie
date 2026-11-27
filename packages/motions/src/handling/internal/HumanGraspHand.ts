import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHand,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanHand } from "../../posture/internal/HumanHand";
import type { HumanGrasp } from "./HumanGrasp";
import { HumanGraspReach } from "./HumanGraspReach";

/** The record of `ITurnsPrevious`'s site. */
type ITurnsPrevious = {
  turn: number;
  alignment: IAutoMovieQuaternion;
  tilt: ReturnType<typeof Quaternion.prepareAxisAngle>;
  point: IAutoMovieVector3;
};

/**
 * The wrist goal that lays a hand's grip socket on a grasp target: the grip
 * frame aligned with the target's approach and wrapped axis, tilted about the
 * approach, and the palm laid half the grasped width back from the grip point,
 * so a thick part is not entered.
 */
export namespace HumanGraspHand {
  /**
   * Prepare a body's hand geometry for wrist goals on changing targets.
   *
   * @param body The body.
   * @param side The hand.
   * @returns The wrist goal, world metres and rest-relative rotation, for a
   *   target and a tilt in degrees (0 when absent).
   */
  export function prepare(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
  ): (
    target: HumanGrasp.IFrame,
    tilt?: number,
  ) => IAutoMovieMotionHumanHand.IWrist {
    const fixed: IHand = geometry(body, side);
    return (
      target: HumanGrasp.IFrame,
      tilt: number = 0,
    ): IAutoMovieMotionHumanHand.IWrist => {
      const turn: IAutoMovieQuaternion = fixed.align({
        normal: target.approach,
        forward: target.axis,
      });
      const rotation: IAutoMovieQuaternion = tilted(
        Quaternion.fromAxisAngle(target.approach, tilt),
        turn,
      );
      return placed(fixed.palm, near(target), rotation);
    };
  }

  /**
   * Prepare a body's hand and one authored target for wrist goals at turns
   * about the target's wrapped axis and tilts about its approach.
   *
   * @param body The body.
   * @param side The hand.
   * @param authored The authored target, fixed through the search.
   * @returns The wrist goal for a turn and a tilt, degrees; the same as
   *   `prepare` on the target turned by `HumanGraspReach.around`.
   */
  export function turns(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    authored: HumanGrasp.IFrame,
  ): (turn: number, tilt: number) => IAutoMovieMotionHumanHand.IWrist {
    const fixed: IHand = geometry(body, side);
    let previous: ITurnsPrevious | undefined;
    return (turn: number, tilt: number): IAutoMovieMotionHumanHand.IWrist => {
      if (previous === undefined || !Object.is(previous.turn, turn)) {
        const target: HumanGrasp.IFrame = HumanGraspReach.around(
          authored,
          turn,
        );
        const alignment: IAutoMovieQuaternion = fixed.align({
          normal: target.approach,
          forward: target.axis,
        });
        previous = {
          turn,
          alignment,
          tilt: Quaternion.prepareAxisAngle(target.approach),
          point: near(target),
        };
      }
      return placed(
        fixed.palm,
        previous.point,
        tilted(previous.tilt(tilt), previous.alignment),
      );
    };
  }
}

/** A hand's body-local grasp geometry. */
interface IHand {
  /** The flat palm's wrist-local point, metres. */
  palm: IAutoMovieVector3;

  /** The grip frame's alignment onto world directions. */
  align: ReturnType<typeof HumanHand.prepareAlignment>;
}

/** Read a hand's flat grip frame and palm point. */
function geometry(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
): IHand {
  const grip: IAutoMovieMotionHumanHand.IFrame = HumanHand.offset(
    body,
    side,
    "grip",
    "flat",
  );
  const palm: IAutoMovieVector3 = HumanHand.offset(
    body,
    side,
    "palm",
    "flat",
  ).point;
  return { palm, align: HumanHand.prepareAlignment(grip) };
}

/**
 * The grasped part's near surface: half the width back from the grip point
 * along the approach.
 */
function near(target: HumanGrasp.IFrame): IAutoMovieVector3 {
  return Vector3.subtract(
    target.point,
    Vector3.scale(target.approach, target.width / 2),
  );
}

/** The alignment turned by the tilt about the approach, normalized. */
function tilted(
  around: IAutoMovieQuaternion,
  turn: IAutoMovieQuaternion,
): IAutoMovieQuaternion {
  return Quaternion.normalize(Quaternion.multiply(around, turn));
}

/** The wrist that puts the palm's point on the near surface at a rotation. */
function placed(
  palm: IAutoMovieVector3,
  point: IAutoMovieVector3,
  rotation: IAutoMovieQuaternion,
): IAutoMovieMotionHumanHand.IWrist {
  return {
    point: Vector3.subtract(point, Quaternion.rotateVector(rotation, palm)),
    rotation,
  };
}
