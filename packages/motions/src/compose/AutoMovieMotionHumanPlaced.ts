import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { AutoMovieMotionHumanArm } from "./AutoMovieMotionHumanArm";
import type { AutoMovieMotionHumanBend } from "./AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanHand } from "./AutoMovieMotionHumanHand";
import { AutoMovieMotionHumanTarget } from "./AutoMovieMotionHumanTarget";
import type { IAutoMovieMotionHumanPrimitive } from "./IAutoMovieMotionHumanPrimitive";

/**
 * An arm carried to a place of the air: the hand surface laid on a point
 * with a facing, the arm carried in joint space from the angles it held to
 * the goal's solution by a weight (`AutoMovieMotionHumanArm.carried`) and
 * the fingers shaped by the same weight. The exercise, stretching, dance and
 * sport laws place their arms this way, at named grid places of the body
 * (`AutoMovieMotionHumanTarget.place`) moved by their own curves.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is moved, by what and who uses it.
 * @evidence contracts/development/design.md#principled-representation A place function of the posture and the second, a weight and a hand surface: the least an arm laid at a place of the air needs.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One record, one primitive pair and one grid lookup.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the arm carry, the hand form and the target resolver; places are named grid places, never metres.
 */
export namespace AutoMovieMotionHumanPlaced {
  /**
   * An arm laid at a place.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The window, the held angles, the weight, the place and the hand.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The members `arm` reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The place is a function, so a moving place needs no second form.
   */
  export interface IArm {
    /** The body. */
    body: IHumanBody;

    /** The arm. */
    side: HumanHand.Side;

    /** Seconds since the action's start the arm is written from. */
    from: number;

    /** Seconds since the action's start the arm is written until. */
    to: number;

    /** The arm's angles at weight 0. */
    rest: AutoMovieMotionHumanArm.IAngles;

    /**
     * How far the arm is from its rest to the place.
     *
     * @param seconds Seconds since the action's start.
     * @returns The weight in [0, 1]: 0 leaves the arm at `rest`, 1 lays the hand on the place.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the argument's origin, the range and what both ends of the range mean.
     * @evidence contracts/development/implementation.md#principled-implementation The caller states the approach and the release as one blend weight over time, the form its clock's envelope already has.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One number per second; `arm` blends the rest angles and the solved arm by it.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The range is stated, so a weight outside it is the caller's error and is not clamped silently here.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A declared member has no body, so it has no algorithm; the cost belongs to each implementation.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A declared member coordinates no work, so it shares none.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A declared member owns no state; what an implementation retains is stated by the function that builds it.
     */
    weight(seconds: number): number;

    /**
     * The place at a second.
     *
     * @param posture The posture written so far in this frame.
     * @param seconds Seconds since the action's start.
     * @returns The point in world metres, the unit direction the surface faces (its normal, pointing away from the surface) and, when the hand's fingers must point a given way, that unit direction.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States both arguments, the space and unit of the point, the sense of the normal and when the forward direction is given.
     * @evidence contracts/development/implementation.md#principled-implementation The place is read on the posture so far, so a place on the performer's own moving body or on a moving object is followed frame by frame.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One query returning the three quantities the arm goal needs.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The facing is required, so the hand's orientation is never guessed from the point alone.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A declared member has no body, so it has no algorithm; the cost belongs to each implementation.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A declared member coordinates no work, so it shares none.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A declared member owns no state; what an implementation retains is stated by the function that builds it.
     */
    place(
      posture: IHumanPosture,
      seconds: number,
    ): {
      point: IAutoMovieVector3;
      facing: IAutoMovieVector3;
      forward?: IAutoMovieVector3;
    };

    /** The hand surface; the palm when absent. */
    surface?: HumanHand.Surface;

    /** The hand's shape; flat when absent. */
    shape?: HumanHand.Shape;

    /** The elbow's preset; the solved least-strain place when absent. */
    bend?: AutoMovieMotionHumanBend.Arm;
  }

  /**
   * The arm and the fingers laid at a place.
   *
   * @param props The arm.
   * @returns The arm's and the hand's primitives.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is returned.
   * @evidence contracts/development/implementation.md#principled-implementation The surface laid against the place's reversed facing by `AutoMovieMotionHumanTarget.hand`, carried in joint space (Soechting and Lacquaniti 1981).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One carried arm and one hand shape.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The weight is clamped by the carry.
   * @evidence contracts/development/implementation.md#efficient-algorithms One posture solve per written second, plus the bend solve when no preset is given.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to the arm carry, the target's hand goal and the hand form.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitives close over their props.
   */
  export function arm(props: IArm): IAutoMovieMotionHumanPrimitive[] {
    const surface: HumanHand.Surface = props.surface ?? "palm";
    const shape: HumanHand.Shape = props.shape ?? "flat";
    return [
      AutoMovieMotionHumanArm.carried({
        body: props.body,
        side: props.side,
        from: props.from,
        to: props.to,
        rest: props.rest,
        weight: props.weight,
        goal: (
          posture: IHumanPosture,
          seconds: number,
        ): IHumanPosture.IGoal => {
          const at = props.place(posture, seconds);
          return AutoMovieMotionHumanArm.goal(
            props.body,
            props.side,
            AutoMovieMotionHumanTarget.hand(
              props.body,
              posture,
              props.side,
              { point: at.point, normal: Vector3.scale(at.facing, -1) },
              {
                surface,
                shape,
                ...(at.forward === undefined ? {} : { forward: at.forward }),
                ...(props.bend === undefined ? {} : { bend: props.bend }),
              },
            ),
          );
        },
      }),
      AutoMovieMotionHumanHand.shape({
        side: props.side,
        shape,
        from: props.from,
        to: props.to,
        weight: props.weight,
      }),
    ];
  }

  /**
   * A named grid place of the air around a posture, world metres: the
   * heights are the standing body's above the floor, and the distance and
   * the lateral are read from the floor point the pelvis stands over.
   *
   * @param body The body.
   * @param posture The posture the place is read around, as written so far.
   * @param side The hand, which the lateral names mirror by.
   * @param grid The grid names.
   * @param nudge A nudge in arm lengths; none when absent.
   * @returns The point.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the result's frame and what each axis is read from.
   * @evidence contracts/development/implementation.md#principled-implementation A posture's root is the origin its pitch and roll turn about, so a law that pitches the trunk over its hips moves the root far behind the feet; the pelvis is where the body stands, so the frame's origin is the floor point under the displayed hips less the standing hips' offset, which is the root itself for an upright posture.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One anchor and two calls.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A nudge past the target's bound throws there; the heights do not follow a crouch, and a law that means a place on the displayed trunk reads `joint`.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `AutoMovieMotionHumanTarget.place` and `fallback`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function grid(
    body: IHumanBody,
    posture: Pick<IHumanPosture, "root" | "yaw" | "pitch" | "roll">,
    side: HumanHand.Side,
    grid: AutoMovieMotionHumanTarget.IGrid,
    nudge?: AutoMovieMotionHumanTarget.INudge,
  ): IAutoMovieVector3 {
    const rest: IAutoMovieVector3 = body.rest.get("hips")!;
    const hips: IAutoMovieVector3 = Vector3.add(
      posture.root,
      Quaternion.rotateVector(resolveHumanPosture.heading(posture), rest),
    );
    const standing: IAutoMovieVector3 = Quaternion.rotateVector(
      resolveHumanPosture.heading({ yaw: posture.yaw, pitch: 0, roll: 0 }),
      rest,
    );
    return AutoMovieMotionHumanTarget.fallback(
      body,
      { root: Vector3.subtract(hips, standing), yaw: posture.yaw },
      AutoMovieMotionHumanTarget.place(
        body,
        side,
        nudge === undefined ? grid : { at: grid, nudge },
      ),
    ).point;
  }

  /**
   * Where a joint of the trunk stands on a posture, world metres.
   *
   * @param body The body.
   * @param posture The posture, as written so far.
   * @param bone A bone of the trunk, the head or a shoulder girdle, or an upper arm, whose joint the girdle carries.
   * @returns The joint's point.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, which bones are valid and the result's frame.
   * @evidence contracts/development/implementation.md#principled-implementation A place on the performer's own trunk (ahead of the chest, under the shoulders, behind the head) moves with the trunk's pitch, roll and drop, so it is read from the trunk's forward kinematics on the posture written so far.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lookup of one resolve.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A limb bone below the shoulder joint is not placed by a posture and is not offered by the parameter's documentation.
   * @evidence contracts/development/implementation.md#efficient-algorithms One forward-kinematics pass per call.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `HumanTrunk.resolve`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function joint(
    body: IHumanBody,
    posture: IHumanPosture,
    bone: AutoMovieHumanoidBone,
  ): IAutoMovieVector3 {
    return HumanTrunk.resolve(body, posture).get(bone)!.worldPosition;
  }

  /**
   * A point carried with the chest from one posture to another: where a
   * point that stood at `point` beside the chest of `standing` lies once the
   * chest has moved to where `posture` holds it. Arms held overhead through
   * a side bend ride the chest this way.
   *
   * @param body The body.
   * @param standing The posture the point was stated on.
   * @param posture The posture, as written so far.
   * @param point The point on `standing`, world metres.
   * @returns The point on `posture`, world metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is carried, between which postures, and a use.
   * @evidence contracts/development/implementation.md#principled-implementation The arms hang from the chest, so a place of theirs keeps its coordinates in the chest's frame while the spine bends; the point is taken into the standing chest's frame and out of the bent one.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two resolves and one change of frame.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The chest's frame is read from the trunk's forward kinematics, so every joint below it counts, not one stated angle.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two forward-kinematics passes per call.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `HumanTrunk.resolve`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function carried(
    body: IHumanBody,
    standing: IHumanPosture,
    posture: IHumanPosture,
    point: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    const from = HumanTrunk.resolve(body, standing).get("chest")!;
    const to = HumanTrunk.resolve(body, posture).get("chest")!;
    return Vector3.add(
      to.worldPosition,
      Quaternion.rotateVector(
        Quaternion.multiply(
          to.worldRotation,
          Quaternion.inverse(from.worldRotation),
        ),
        Vector3.subtract(point, from.worldPosition),
      ),
    );
  }

  /**
   * The midpoint of the two shoulder joints on a posture, world metres.
   *
   * @param body The body.
   * @param posture The posture, as written so far.
   * @returns The point.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the result.
   * @evidence contracts/development/implementation.md#principled-implementation Both arms hang from and reach from their shoulder joints, so a place for two hands together (a club's grip, a ball held up, the floor under a support) is read from their midpoint.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One resolve and one mean.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Read on the displayed trunk, never rebuilt from the measure's heights.
   * @evidence contracts/development/implementation.md#efficient-algorithms One forward-kinematics pass per call.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `HumanTrunk.resolve`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function shoulders(
    body: IHumanBody,
    posture: IHumanPosture,
  ): IAutoMovieVector3 {
    const bones = HumanTrunk.resolve(body, posture);
    return Vector3.lerp(
      bones.get("leftUpperArm")!.worldPosition,
      bones.get("rightUpperArm")!.worldPosition,
      0.5,
    );
  }

  /**
   * Where the wrist stands when a hand surface lies on a place.
   *
   * @param body The body.
   * @param side The hand.
   * @param place The point, the direction the surface faces and where the fingers point.
   * @param surface The hand surface; the palm when absent.
   * @param shape The hand's shape; flat when absent.
   * @returns The wrist's point, world metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the defaults and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The arm reaches to the wrist, not to the surface, so a law that derives a trunk height or a pitch from a hand on the floor measures the reach to the wrist the laid hand needs.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The wrist is the hand owner's, never half a hand's length typed in a law.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `HumanHand.reach`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function wrist(
    body: IHumanBody,
    side: HumanHand.Side,
    place: {
      point: IAutoMovieVector3;
      facing: IAutoMovieVector3;
      forward: IAutoMovieVector3;
    },
    surface: HumanHand.Surface = "palm",
    shape: HumanHand.Shape = "flat",
  ): IAutoMovieVector3 {
    return HumanHand.reach(
      body,
      side,
      surface,
      {
        point: place.point,
        normal: place.facing,
        forward: place.forward,
      },
      shape,
    ).point;
  }

  /**
   * The root that puts a point of the resting body at a world point under a
   * posture's turn.
   *
   * @param posture The heading, the pitch and the roll.
   * @param rest The point in the resting body's frame, as `IHumanBody.rest` gives a joint.
   * @param point Where it must stand, world metres.
   * @returns The root.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, their frames and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The root's turn carries every resting point rigidly, so the root that holds one of them still is the world point less the turned resting point: a trunk that pitches about its hips, or swings about its shoulders over planted hands, is written by its pivot.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One rotation and one difference.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The turn is the posture owner's composition of the three angles.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `resolveHumanPosture.heading`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function root(
    posture: Pick<IHumanPosture, "yaw" | "pitch" | "roll">,
    rest: IAutoMovieVector3,
    point: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    return Vector3.subtract(
      point,
      Quaternion.rotateVector(resolveHumanPosture.heading(posture), rest),
    );
  }

  /**
   * The resting midpoint of the two shoulder joints, in the resting body's frame.
   *
   * @param body The body.
   * @returns The point `root` takes as a pivot.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result and its consumer.
   * @evidence contracts/development/implementation.md#principled-implementation The mean of the two resting joints, the point both arms reach from.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One mean.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Read from the body's rest, never from the measure's heights.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse or cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function girdle(body: Pick<IHumanBody, "rest">): IAutoMovieVector3 {
    return Vector3.lerp(
      body.rest.get("leftUpperArm")!,
      body.rest.get("rightUpperArm")!,
      0.5,
    );
  }

  /**
   * The trunk's forward pitch at which the shoulders stand a given height
   * above the hips.
   *
   * @param body The body.
   * @param rise The shoulders' height above the hips, metres; negative when the hips stand higher.
   * @returns Degrees: 0 near the standing trunk, 90 near the level one, more with the hips above the shoulders. A rise past the trunk's length gives the pitch of the nearest end.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the sign, the unit and the result past the trunk's length.
   * @evidence contracts/development/implementation.md#principled-implementation The resting vector from the hips to the shoulders' midpoint keeps its length under the root's pitch, so its height is that length times the cosine of the pitch plus the vector's own resting lean, solved for the pitch.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One length, one resting lean and one arccosine.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The cosine is bounded to [-1, 1] because a trunk cannot stand its shoulders further from its hips than its own length; the caller's reach verdict reports what that leaves.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `girdle`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function pitch(body: Pick<IHumanBody, "rest">, rise: number): number {
    const d: IAutoMovieVector3 = Vector3.subtract(
      girdle(body),
      body.rest.get("hips")!,
    );
    const length: number = Math.hypot(d.y, d.z);
    return (
      ((Math.acos(Math.min(1, Math.max(-1, rise / length))) -
        Math.atan2(d.z, d.y)) *
        180) /
      Math.PI
    );
  }
}
