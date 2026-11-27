import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanArmTarget,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHeld,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanHand } from "../../posture/internal/HumanHand";

/**
 * The hand targets that carry a wearable along a planned path of its own frame:
 * the hand that holds it, placed so the held item lands on the frame, and a
 * second hand closed on one of the item's handles there.
 *
 * A held item is rigid in its hand's grip frame (`AutoMovieMotionHumanHeld`:
 * its origin from the grip socket in the hand bone's axes, its rotation from
 * the hand bone's), so the item's world frame fixes the hand's: the hand's
 * rotation is the item's times the inverse of the held rotation, and the grip
 * socket lies the held offset, so turned, short of the item's origin. A second
 * hand grasps a handle with its palm into the item against the handle's `+Y`
 * and its fingers' forward along the handle's `+X`, as `HumanHand.reach` lays a
 * grasp.
 */
export namespace HumanWornItem {
  /**
   * The world point of an item-local point on an item frame.
   *
   * @param frame The item's world frame.
   * @param local The point in the item's frame, metres.
   * @returns The world point, metres.
   */
  export function point(
    frame: IAutoMovieRigidTransform,
    local: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    return Vector3.add(
      frame.position,
      Quaternion.rotateVector(frame.rotation, local),
    );
  }

  /**
   * The target of the hand that holds the item, for the item on a frame.
   *
   * @param body The body.
   * @param side The holding hand.
   * @param held The item in that hand's grip frame.
   * @param frame The item's world frame asked.
   * @param bend The elbow's bend hint, world metres.
   * @returns The grip socket's target and the hand's rotation.
   */
  export function holding(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    held: IAutoMovieMotionHumanHeld.IHeld,
    frame: IAutoMovieRigidTransform,
    bend: IAutoMovieVector3,
  ): IAutoMovieMotionHumanArmTarget.ITarget {
    const rotation: IAutoMovieQuaternion = Quaternion.normalize(
      Quaternion.multiply(
        frame.rotation,
        Quaternion.inverse(held.frame.rotation),
      ),
    );
    return {
      surface: "grip",
      shape: "relaxed",
      point: Vector3.subtract(
        frame.position,
        Quaternion.rotateVector(rotation, held.frame.position),
      ),
      rotation,
      bend,
      offset: HumanHand.offset(body, side, "grip").point,
    };
  }

  /**
   * The target of a hand closed on one of the item's handles, for the item on a
   * frame.
   *
   * @param body The body.
   * @param side The grasping hand.
   * @param frame The item's world frame.
   * @param handle The handle, in the item's frame.
   * @param bend The elbow's bend hint, world metres.
   * @returns The grip socket on the handle, the palm into the item and the
   *   fingers along the handle.
   */
  export function grasping(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    frame: IAutoMovieRigidTransform,
    handle: IAutoMovieAffordance,
    bend: IAutoMovieVector3,
  ): IAutoMovieMotionHumanArmTarget.ITarget {
    const turn: IAutoMovieQuaternion = Quaternion.multiply(
      frame.rotation,
      handle.frame.rotation,
    );
    const rest: ReturnType<typeof HumanHand.offset> = HumanHand.offset(
      body,
      side,
      "grip",
    );
    return {
      surface: "grip",
      shape: "relaxed",
      point: point(frame, handle.frame.translation),
      rotation: HumanHand.align(rest, {
        normal: Vector3.scale(
          Quaternion.rotateVector(turn, { x: 0, y: 1, z: 0 }),
          -1,
        ),
        forward: Quaternion.rotateVector(turn, { x: 1, y: 0, z: 0 }),
      }),
      bend,
      offset: rest.point,
    };
  }
}
