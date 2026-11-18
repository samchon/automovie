import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHand,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanHand } from "../posture/HumanHand";
import type { HumanGrasp } from "./HumanGrasp";
import { HumanGraspReach } from "./HumanGraspReach";

/**
 * The wrist goal that lays a hand's grip socket on a grasp target: the grip
 * frame aligned with the target's approach and wrapped axis, tilted about
 * the approach, and the palm laid half the grasped width back from the grip
 * point, so a thick part is not entered.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the alignment, the tilt and the palm placement, and the two scopes the geometry is prepared for.
 * @evidence contracts/development/design.md#principled-representation World-metre grasp frames, degree angles and the canonical wrist type; prepared data is the hand's rigid geometry only.
 * @evidence contracts/development/design.md#minimal-and-owned-surface prepare serves `HumanGrasp.hand` and the second hand of `HumanHeldUse`; turns serves the handover's grid of turns about one offered handle.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No prop, body size, solved pose or contact verdict is embedded.
 */
export namespace HumanGraspHand {
  /**
   * Prepare a body's hand geometry for wrist goals on changing targets.
   *
   * @param body The body.
   * @param side The hand.
   * @returns The wrist goal, world metres and rest-relative rotation, for a target and a tilt in degrees (0 when absent).
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the fixed body and hand, the target and degree tilt, and the world wrist returned.
   * @evidence contracts/development/implementation.md#principled-implementation The hand's grip normal and forward are aligned with the approach and the wrapped axis, the result turned about the approach by the tilt, and the wrist placed so the flat palm's point lies half the width back from the grip point (the Final IK InteractionObject and Unreal hand-socket practice of an effector frame on an authored grip).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One geometry read, one alignment, one tilt, one placement.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The width is the target's own; nothing is clamped.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two hand-offset reads per preparation; constant rigid work per goal, no IK.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The grip frame and palm offset depend only on the body and side; each target computes its own wrist.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The reader holds the hand's constant-size geometry until released; outputs are fresh.
   */
  export function prepare(body: IAutoMovieMotionHumanBody, side: AutoMovieHumanSide): (target: HumanGrasp.IFrame, tilt?: number) => IAutoMovieMotionHumanHand.IWrist {
    const fixed: IHand = geometry(body, side);
    return (target: HumanGrasp.IFrame, tilt: number = 0): IAutoMovieMotionHumanHand.IWrist => {
      const turn: IAutoMovieQuaternion = fixed.align({ normal: target.approach, forward: target.axis });
      const rotation: IAutoMovieQuaternion = tilted(Quaternion.fromAxisAngle(target.approach, tilt), turn);
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
   * @returns The wrist goal for a turn and a tilt, degrees; the same as `prepare` on the target turned by `HumanGraspReach.around`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the fixed body, hand and target, the degree inputs and the equivalence with `prepare`.
   * @evidence contracts/development/implementation.md#principled-implementation The turned approach, its alignment and the palm's near point depend on the turn alone, so the last turn's are kept while its tilts vary.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The same geometry, tilt and placement helpers as `prepare`, fed by one last-turn record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every turn and tilt computes its own wrist; `Object.is` tells signed-zero turns apart.
   * @evidence contracts/development/implementation.md#efficient-algorithms For T turns of L tilts each, T alignments and near points instead of T*L.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The kept record depends only on the turn and the fixed target, and is replaced when the turn changes.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One hand geometry and one last-turn record until the reader is released.
   */
  export function turns(body: IAutoMovieMotionHumanBody, side: AutoMovieHumanSide, authored: HumanGrasp.IFrame): (turn: number, tilt: number) => IAutoMovieMotionHumanHand.IWrist {
    const fixed: IHand = geometry(body, side);
    let previous: { turn: number; alignment: IAutoMovieQuaternion; tilt: ReturnType<typeof Quaternion.prepareAxisAngle>; point: IAutoMovieVector3 } | undefined;
    return (turn: number, tilt: number): IAutoMovieMotionHumanHand.IWrist => {
      if (previous === undefined || !Object.is(previous.turn, turn)) {
        const target: HumanGrasp.IFrame = HumanGraspReach.around(authored, turn);
        const alignment: IAutoMovieQuaternion = fixed.align({ normal: target.approach, forward: target.axis });
        previous = { turn, alignment, tilt: Quaternion.prepareAxisAngle(target.approach), point: near(target) };
      }
      return placed(fixed.palm, previous.point, tilted(previous.tilt(tilt), previous.alignment));
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
function geometry(body: IAutoMovieMotionHumanBody, side: AutoMovieHumanSide): IHand {
  const grip: IAutoMovieMotionHumanHand.IFrame = HumanHand.offset(body, side, "grip", "flat");
  const palm: IAutoMovieVector3 = HumanHand.offset(body, side, "palm", "flat").point;
  return { palm, align: HumanHand.prepareAlignment(grip) };
}

/** The grasped part's near surface: half the width back from the grip point along the approach. */
function near(target: HumanGrasp.IFrame): IAutoMovieVector3 {
  return Vector3.subtract(target.point, Vector3.scale(target.approach, target.width / 2));
}

/** The alignment turned by the tilt about the approach, normalized. */
function tilted(around: IAutoMovieQuaternion, turn: IAutoMovieQuaternion): IAutoMovieQuaternion {
  return Quaternion.normalize(Quaternion.multiply(around, turn));
}

/** The wrist that puts the palm's point on the near surface at a rotation. */
function placed(palm: IAutoMovieVector3, point: IAutoMovieVector3, rotation: IAutoMovieQuaternion): IAutoMovieMotionHumanHand.IWrist {
  return { point: Vector3.subtract(point, Quaternion.rotateVector(rotation, palm)), rotation };
}
