import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanArmTarget,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";

/**
 * What an arm primitive is given: a hand surface's target, the origin the
 * hand leaves from and returns to, and the wrist goal the two make.
 *
 * The members are `AutoMovieMotionHumanArm`'s, which names them; they live
 * here so the carry, the move and the phrases read them without reading
 * each other.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the records are and why they have a file of their own.
 * @evidence contracts/development/design.md#principled-representation A target is a surface's place, facing and bend; an origin is a wrist's place and rotation; the goal is the posture's own goal type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The records and the three readers every arm primitive shares; `AutoMovieMotionHumanArm` re-exports each by name.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No primitive is defined here, so no file of the arm depends on another's phrases.
 */
export namespace AutoMovieMotionHumanArmTarget {
  /**
   * Where a hand surface is on a pose, as an origin in a floor frame.
   *
   * @param body The body.
   * @param bones The pose's resolved bones.
   * @param frame The performer's floor frame at that pose.
   * @param side The hand.
   * @param surface The surface.
   * @returns The origin.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input and that the result is in the given floor frame.
   * @evidence contracts/development/implementation.md#principled-implementation The surface's world point and the hand's world rotation, taken into the floor frame by its inverse: the hand's place relative to the body.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two inverse transforms.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reads the relaxed hand, the shape an arm has before a movement shapes it.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `HumanHand.frame`, `HumanFrame.local` and `HumanFrame.turn`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function origin(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<
      AutoMovieHumanoidBone,
      Pick<IAutoMovieResolvedBone, "worldPosition" | "worldRotation">
    >,
    frame: IAutoMovieMotionHumanFrame.IFrame,
    side: IAutoMovieMotionHumanHand.Side,
    surface: IAutoMovieMotionHumanHand.Surface,
  ): IAutoMovieMotionHumanArmTarget.IOrigin {
    return {
      point: HumanFrame.local(
        frame,
        HumanHand.frame(body, bones, side, surface, "relaxed").point,
      ),
      rotation: Quaternion.multiply(
        HumanFrame.turn(-frame.yaw),
        bones.get(`${side}Hand`)!.worldRotation,
      ),
    };
  }

  /**
   * An origin's surface point in the world on a posture.
   *
   * @param posture The posture whose root and heading carry the origin.
   * @param from The origin.
   * @returns The world point, metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what of the posture is read and the result's frame and unit.
   * @evidence contracts/development/implementation.md#principled-implementation The floor-frame transform of the origin's point by the posture's root and heading, the inverse of what `origin` stored.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One transform.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The root's own height is kept, as `origin` measured from it.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `HumanFrame.point`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function point(
    posture: Pick<IAutoMovieMotionHumanPosture, "root" | "yaw">,
    from: IAutoMovieMotionHumanArmTarget.IOrigin,
  ): IAutoMovieVector3 {
    return HumanFrame.point(
      { origin: posture.root, yaw: posture.yaw },
      from.point,
    );
  }

  /**
   * The limb goal that puts a hand surface on its target: the wrist placed
   * for the asked rotation, and the surface declared as the goal's contact so
   * the resolver keeps it on the point when the rotation is out of range.
   *
   * @param body The body.
   * @param side The arm.
   * @param target The target.
   * @returns The goal.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the goal places and why it carries the surface as its contact.
   * @evidence contracts/development/implementation.md#principled-implementation The wrist follows rigidly from the surface's point and the hand's rotation; the surface's offset from the wrist is the contact the resolver holds when the rotation is out of range.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One wrist placement and one offset lookup.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A surface at the wrist itself declares no contact, since a zero offset gives the resolver no lever to re-aim by.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `HumanHand.place` and `HumanHand.offset`, the owners of the hand's geometry.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function goal(
    body: IAutoMovieMotionHumanBody,
    side: IAutoMovieMotionHumanHand.Side,
    target: Omit<IAutoMovieMotionHumanArmTarget.ITarget, "curl">,
  ): IAutoMovieMotionHumanPosture.IGoal {
    const wrist: IAutoMovieMotionHumanHand.IWrist = HumanHand.place(
      body,
      side,
      target.surface,
      target.point,
      target.rotation,
      target.shape,
    );
    const contact: IAutoMovieVector3 = HumanHand.offset(
      body,
      side,
      target.surface,
      target.shape,
    ).point;
    return {
      point: wrist.point,
      rotation: wrist.rotation,
      bend: target.bend,
      ...(Vector3.length(contact) < 1e-9 ? {} : { contact }),
    };
  }
}
