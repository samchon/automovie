import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanColliders } from "../posture/HumanColliders";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";

/**
 * What touches in a touch: a hand surface, or the tip of a tool the hand
 * holds, stated in the hand's anatomical axes (where the fingers point, where
 * the palm faces and where the thumb points at rest) as shares of the hand's
 * length, so a held cup's rim or a spoon's bowl is placed on the mouth
 * without a prop. Also the effector's displayed point the verdicts read, the
 * skin's stand-off from the hand's own colliders and the arm goal that lays
 * the effector on a contact point.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what an effector is, the axes a tool is stated in and what the namespace computes.
 * @evidence contracts/development/design.md#principled-representation An effector is a point and two directions in the hand's rest frame; a tool is that point moved along the hand's axes.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The effector record, its axes, its frame, its displayed point, its pad and its goal; the touch stroke and its verdicts read these.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the hand's surfaces, shapes and alignment; the pad is a collider query, not a shape's radius.
 */
export namespace AutoMovieMotionHumanTouchEffector {
  /** A hand axis at rest: the fingers' direction, the palm's facing or the thumb's, or their opposites. */
  export type Axis =
    | "fingers"
    | "palm"
    | "thumb"
    | "-fingers"
    | "-palm"
    | "-thumb";

  /**
   * An effector.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, unit and default.
   * @evidence contracts/development/design.md#principled-representation A surface, a shape, an optional tool offset and the two axes laid against the region.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Five members read by `local`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Without the axes a surface uses its own normal and forward, so a bare skin row states nothing extra.
   */
  export interface IEffector {
    /** The hand surface. */
    surface: HumanHand.Surface;

    /** The hand's shape. */
    shape: HumanHand.Shape;

    /** A held tool's tip from the surface, shares of the hand's length along each axis; none when absent. */
    tool?: Partial<Record<"fingers" | "palm" | "thumb", number>>;

    /** The hand axis turned into the region; the surface's own normal when absent. */
    facing?: Axis;

    /** The hand axis laid along the region's tangent; the surface's own forward when absent. */
    along?: Axis;
  }

  /**
   * A hand axis at rest, in the hand's rest frame: the rig rests in a T pose
   * with the palms down, so the fingers point out to the hand's side, the
   * palm faces down and the thumb points forward.
   *
   * @param side The hand.
   * @param axis The axis.
   * @returns The unit vector.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the rest pose the axes are read in and each axis's direction.
   * @evidence contracts/development/implementation.md#principled-implementation The rig's rest pose fixes the three anatomical axes, mirrored by side for the fingers.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One sign and one choice.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The same axes `HumanHand.rotation` aligns from.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse or cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function axis(side: HumanHand.Side, axis: Axis): IAutoMovieVector3 {
    const sign: number = axis.startsWith("-") ? -1 : 1;
    const name: string = axis.replace("-", "");
    const v: IAutoMovieVector3 =
      name === "fingers"
        ? { x: side === "left" ? 1 : -1, y: 0, z: 0 }
        : name === "palm"
          ? { x: 0, y: -1, z: 0 }
          : { x: 0, y: 0, z: 1 };
    return Vector3.scale(v, sign);
  }

  /**
   * The effector's point relative to the wrist joint and its facing and
   * along directions, all in the hand's rest frame.
   *
   * @param body The body.
   * @param side The hand.
   * @param effector The effector.
   * @returns The point, metres, and two unit directions.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frame and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The surface's offset plus the tool's shares of the hand's length along the axes.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One offset and one loop over the tool's axes.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The tool is in hand lengths, never metres.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `HumanHand.offset`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function local(
    body: IHumanBody,
    side: HumanHand.Side,
    effector: IEffector,
  ): {
    point: IAutoMovieVector3;
    normal: IAutoMovieVector3;
    forward: IAutoMovieVector3;
  } {
    const surface: HumanHand.IFrame = HumanHand.offset(
      body,
      side,
      effector.surface,
      effector.shape,
    );
    const hand: number = body.measure.hand;
    let point: IAutoMovieVector3 = surface.point;
    for (const [name, share] of Object.entries(effector.tool ?? {}) as [
      "fingers" | "palm" | "thumb",
      number,
    ][])
      point = Vector3.add(point, Vector3.scale(axis(side, name), share * hand));
    return {
      point,
      normal:
        effector.facing === undefined
          ? surface.normal
          : axis(side, effector.facing),
      forward:
        effector.along === undefined
          ? surface.forward
          : axis(side, effector.along),
    };
  }

  /**
   * Where an effector is on a displayed pose, world metres.
   *
   * @param body The body.
   * @param bones The pose's resolved bones.
   * @param side The hand.
   * @param effector The effector.
   * @returns The point.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input pose and the result's frame.
   * @evidence contracts/development/implementation.md#principled-implementation The hand bone's world transform applied to the effector's rest-frame point.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One rotation and one sum.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reads the displayed hand, never a goal.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `local`, so the law and its verdicts read one effector.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function point(
    body: IHumanBody,
    bones: ReadonlyMap<
      AutoMovieHumanoidBone,
      Pick<IAutoMovieResolvedBone, "worldPosition" | "worldRotation">
    >,
    side: HumanHand.Side,
    effector: IEffector,
  ): IAutoMovieVector3 {
    const hand = bones.get(`${side}Hand`)!;
    return Vector3.add(
      hand.worldPosition,
      Quaternion.rotateVector(
        hand.worldRotation,
        local(body, side, effector).point,
      ),
    );
  }

  /**
   * How far a skin surface stands inside its own hand's colliders, metres:
   * the stand-off that lays the skin, not the bone axis, on a region. A
   * tool's tip stands outside the hand and takes none.
   *
   * @param body The body.
   * @param side The hand.
   * @param effector The effector.
   * @returns Metres, not negative.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is measured, the unit and the tool case.
   * @evidence contracts/development/implementation.md#principled-implementation The signed distance of the surface's point to the hand's (or the fingertip's) own colliders at rest, negated.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One bones map of the hand alone and one distance query.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A collider query, never a shape's radius, so any collider kind serves; a body without a hand collider reads 0.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `HumanColliders.distance`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One query over one segment.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function pad(
    body: IHumanBody,
    side: HumanHand.Side,
    effector: IEffector,
  ): number {
    if (effector.tool !== undefined) return 0;
    const bones = new Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>();
    const own: AutoMovieHumanoidBone =
      effector.surface === "indexTip" ? `${side}IndexDistal` : `${side}Hand`;
    const rest: IAutoMovieVector3 | undefined = body.rest.get(own);
    if (rest !== undefined)
      bones.set(own, {
        bone: own,
        worldPosition: rest,
        worldRotation: Quaternion.identity(),
      } as IAutoMovieResolvedBone);
    const at: IAutoMovieVector3 = Vector3.add(
      body.rest.get(`${side}Hand`)!,
      local(body, side, effector).point,
    );
    try {
      return Math.max(0, -HumanColliders.distance(body, bones, at).distance);
    } catch {
      return 0;
    }
  }

  /**
   * The arm goal that lays an effector on a contact point against a normal,
   * its along axis on a tangent.
   *
   * @param body The body.
   * @param side The hand.
   * @param effector The effector.
   * @param at The contact point, world.
   * @param normal The region's outward normal, world.
   * @param tangent The tangent the effector's along axis follows, world.
   * @param bend The elbow hint, world.
   * @returns The arm's goal, with the effector as the contact the resolver keeps.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs' frames and what the goal carries.
   * @evidence contracts/development/implementation.md#principled-implementation The rotation aligns the effector's facing against the normal and its along axis with the tangent; the wrist follows rigidly.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One alignment and one rigid offset.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An effector at the wrist declares no contact.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `HumanHand.align` and `local`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function goal(
    body: IHumanBody,
    side: HumanHand.Side,
    effector: IEffector,
    at: IAutoMovieVector3,
    normal: IAutoMovieVector3,
    tangent: IAutoMovieVector3,
    bend: IAutoMovieVector3,
  ): IHumanPosture.IGoal {
    const rest = local(body, side, effector);
    const rotation: IAutoMovieQuaternion = HumanHand.align(
      { normal: rest.normal, forward: rest.forward },
      { normal: Vector3.scale(normal, -1), forward: tangent },
    );
    return {
      point: Vector3.subtract(
        at,
        Quaternion.rotateVector(rotation, rest.point),
      ),
      rotation,
      bend,
      ...(Vector3.length(rest.point) < 1e-9 ? {} : { contact: rest.point }),
    };
  }
}
