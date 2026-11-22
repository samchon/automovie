import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanHand } from "../posture/HumanHand";

/**
 * The held tool's geometry in the hand's own rest frame, and one instant of a swing it places (`HumanPolo`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the frame and each reading.
 * @evidence contracts/development/design.md#principled-representation The fingers, the tool's axis square to them as the grip holds it, and the working point from the wrist in that frame.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One reader and two records the polo law reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The tool is the held prop's own reading (`StrikingHeld`); the rest frame is the hand's own (`HumanHand.rotation`).
 */
export namespace HumanPoloHand {
  /**
   * A held tool in the hand's rest frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member, its frame and unit.
   * @evidence contracts/development/design.md#principled-representation An orthonormal hand frame and the working point's coordinates in it.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Built by `of`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IHand {
    /** Where the fingers point at rest, unit. */
    fingers: IAutoMovieVector3;

    /** The tool's axis at rest, made square to the fingers, unit. */
    shaft: IAutoMovieVector3;

    /** The working point from the wrist along the fingers, metres. */
    along: number;

    /** The working point from the wrist along the tool's axis, metres. */
    out: number;

    /** The working point from the wrist across both, along the fingers cross the axis, metres. */
    across: number;
  }

  /**
   * One instant of a swing: where the wrist is, how the hand is turned and where the tool's working point is.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member and its unit.
   * @evidence contracts/development/design.md#principled-representation The arm's goal and the working point it places.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Written and read by the polo law.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IStation {
    /** The wrist joint, metres. */
    wrist: IAutoMovieVector3;

    /** The hand's rotation from its rest. */
    rotation: IAutoMovieQuaternion;

    /** The working point, metres. */
    head: IAutoMovieVector3;
  }

  /**
   * Read a held tool in the hand's rest frame.
   *
   * @param body The body.
   * @param side The holding hand.
   * @param tool The held tool.
   * @returns The hand frame and the working point in it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The rest fingers are the direction the hand's rest rotation turns onto a requested one; the axis loses its part along them; the working point is the grip socket from the wrist plus the tool's tip from the grip, projected on the three axes.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One frame, three projections.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function of(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    tool: IAutoMovieMotionHumanStrikingHeld.ITool,
  ): IHand {
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
}
