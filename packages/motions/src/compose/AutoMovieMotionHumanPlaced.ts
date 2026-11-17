import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPlaced,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanTargetGrid,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanHand } from "../posture/HumanHand";
import { HumanHandTarget } from "../posture/HumanHandTarget";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { AutoMovieMotionHumanArm } from "./AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanHand } from "./AutoMovieMotionHumanHand";
import { AutoMovieMotionHumanTarget } from "./AutoMovieMotionHumanTarget";
import { AutoMovieMotionHumanTargetGrid } from "./AutoMovieMotionHumanTargetGrid";

/**
 * An arm carried to a place of the air: the hand surface laid on a point
 * with a facing, the arm's reach, hold and return planned as one
 * trajectory over the span the law states (`AutoMovieMotionHumanArm.carried`)
 * and the fingers shaped by the weight; without a span, the deprecated
 * joint-space carry by the weight. The exercise, stretching, dance and
 * sport laws place their arms this way, at named grid places of the body
 * (`AutoMovieMotionHumanTargetGrid.place`) moved by their own curves.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is moved, by what and who uses it.
 * @evidence contracts/development/design.md#principled-representation A place function of the posture and the second, a weight and a hand surface: the least an arm laid at a place of the air needs.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One record, one primitive pair and one grid lookup.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the arm carry, the hand form and the target resolver; places are named grid places, never metres.
 */
export namespace AutoMovieMotionHumanPlaced {
  /**


  /**
   * The arm and the fingers laid at a place.
   * The canonical body and configured surface/shape/bend remain unchanged
   * for the primitive's lifetime; the actual place, facing, forward and
   * current posture are read independently at every requested second.
   *
   * @param props The arm.
   * @returns The arm's and the hand's primitives.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is returned.
   * @evidence contracts/development/implementation.md#principled-implementation The surface laid against the place's reversed facing by `AutoMovieMotionHumanTarget.hand`, carried in joint space (Soechting and Lacquaniti 1981).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One carried arm and one hand shape.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The weight is clamped by the carry.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed hand surface/options prepare once per arm; each actual goal shares one wrist placement with its default bend and final assembly, while every original bend/carry trajectory/full-posture solve remains. Runtime improvement is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work HumanHandTarget owns fixed geometry/dynamic orientation, ArmTarget owns contact assembly and original hand/carry primitives keep composition. Current-person FK/ROM inputs flow synchronously to each actual place callback rather than preparing independent observation contexts there.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Primitives keep props and constant surface/options until release. Optional current-call FK/ROM inputs and each lazy wrist remain synchronous, without retained loans, query pose/time history or solver readers in the plan.
   */
  export function arm(props: IAutoMovieMotionHumanPlaced.IArm): IAutoMovieMotionHumanPrimitive[] {
    const surface: IAutoMovieMotionHumanHand.Surface = props.surface ?? "palm";
    const shape: IAutoMovieMotionHumanHand.Shape = props.shape ?? "flat";
    const target: ReturnType<typeof HumanHandTarget.prepareGoal> = HumanHandTarget.prepareGoal(
      props.body, props.side, { surface, shape, ...(props.bend === undefined ? {} : { bend: props.bend }) },
    );
    return [
      AutoMovieMotionHumanArm.carried({
        body: props.body,
        side: props.side,
        from: props.from,
        to: props.to,
        rest: props.rest,
        weight: props.weight,
        ...(props.span === undefined ? {} : { span: props.span }),
        goal: (
          posture: IAutoMovieMotionHumanPosture,
          seconds: number,
          resolution?: IFK,
          projection?: IROM,
        ): IAutoMovieHumanLimbGoal => {
          const at: ReturnType<IAutoMovieMotionHumanPlaced.IArm["place"]> = props.place(posture, seconds, resolution, projection);
          return target(posture, { point: at.point, normal: Vector3.scale(at.facing, -1) }, at.forward);
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
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `AutoMovieMotionHumanTargetGrid.place` and `fallback`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function grid(
    body: IAutoMovieMotionHumanBody,
    posture: Pick<IAutoMovieMotionHumanPosture, "root" | "yaw" | "pitch" | "roll">,
    side: AutoMovieHumanSide,
    grid: IAutoMovieMotionHumanTargetGrid.IGrid,
    nudge?: IAutoMovieMotionHumanTargetGrid.INudge,
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
      AutoMovieMotionHumanTargetGrid.place(
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
   * @param resolution Optional same-person FK source borrowed for this raw observation only.
   * @returns The joint's point.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States valid current trunk/girdle joint inputs and world-metre output; optional same-person FK is borrowed only for the existing raw authored-joint observation.
   * @evidence contracts/development/implementation.md#principled-implementation A place on the performer's own trunk (ahead of the chest, under the shoulders, behind the head) moves with the trunk's pitch, roll and drop, so it is read from the trunk's forward kinematics on the posture written so far.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lookup of one resolve.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A limb bone below the shoulder joint is not placed by a posture and is not offered by the parameter's documentation.
   * @evidence contracts/development/implementation.md#efficient-algorithms One forward-kinematics pass per call.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates actual requested output to HumanTrunk.resolve, optionally borrowing this same-person FK source without changing raw admission or adding ROM projection.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function joint(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    bone: AutoMovieHumanoidBone,
    resolution?: IFK,
  ): IAutoMovieVector3 {
    return HumanTrunk.resolve(body, posture, undefined, resolution,
      new Set<AutoMovieHumanoidBone>([bone])).get(bone)!.worldPosition;
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
   * @param resolution Optional same-person FK loan borrowed only by the current chest observation; the source standing read remains cold.
   * @returns The point on `posture`, world metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is carried, between which postures, and a use.
   * @evidence contracts/development/implementation.md#principled-implementation The arms hang from the chest, so a place of theirs keeps its coordinates in the chest's frame while the spine bends; the point is taken into the standing chest's frame and out of the bent one.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two resolves and one change of frame.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The chest's frame is read from the trunk's forward kinematics, so every joint below it counts, not one stated angle.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two forward-kinematics passes per call.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Every call retains its original source and current raw trunk reads; an optional current-person loan shares only current exact FK metadata and never prepares the borrowed standing graph across calls.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Source/current point-transform scratch and the optional FK loan end with this synchronous call. Only the fresh world point escapes, without a retained posture, reader, query history or handle.
   */
  export function carried(
    body: IAutoMovieMotionHumanBody,
    standing: IAutoMovieMotionHumanPosture,
    posture: IAutoMovieMotionHumanPosture,
    point: IAutoMovieVector3,
    resolution?: IFK,
  ): IAutoMovieVector3 {
    return carryFrom(body, standing)(posture, resolution)(point);
  }

  /**
   * Prepare a fixed chest frame for several points carried with a movement.
   *
   * @param body The unchanged body whose trunk carries the points.
   * @param standing The unchanged posture where each source point was authored.
   * @returns A current-posture reader; each call reads its chest once and returns a point transform from the original world frame to the current world frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States immutable source frame, varying current posture, world-metre points and reader lifetime; optional same-person FK is borrowed only at the current chest read and raw authored-trunk policy remains unchanged.
   * @evidence contracts/development/implementation.md#principled-implementation Uses the original current-chest times inverse-source-chest rigid transform; the source inverse and each current relative rotation are independent of the points they carry.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Source preparation, one current chest read and a pure point transform expose the two distinct invariant scopes.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every current posture still performs canonical authored-joint FK with its actual root; no time samples, body size assumptions or fitted motion results are reused.
   * @evidence contracts/development/implementation.md#efficient-algorithms One demanded source chest FK per plan and one demanded current chest FK per place evaluation replace two FK calls per carried point; P points then use O(P) rigid transforms.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Same unchanged body/source posture share only the source chest; one current call shares its actual chest among its points. An optional same-person FK loan shares original raw chest dependencies while changed current posture still receives its actual read.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan owns one source chest frame and inverse; each evaluation owns one current point-transform closure until its points are placed, with no FK reader or current-time history stored in the plan.
   */
  export function carryFrom(
    body: IAutoMovieMotionHumanBody,
    standing: IAutoMovieMotionHumanPosture,
  ): (posture: IAutoMovieMotionHumanPosture, resolution?: IFK) => (point: IAutoMovieVector3) => IAutoMovieVector3 {
    const from: IAutoMovieResolvedBone =
      HumanTrunk.resolve(body, standing, undefined, undefined, CHEST).get("chest")!;
    const inverse: ReturnType<typeof Quaternion.inverse> = Quaternion.inverse(from.worldRotation);
    return (posture: IAutoMovieMotionHumanPosture, resolution?: IFK): (point: IAutoMovieVector3) => IAutoMovieVector3 => {
      const to: IAutoMovieResolvedBone =
        HumanTrunk.resolve(body, posture, undefined, resolution, CHEST).get("chest")!;
      const rotation: ReturnType<typeof Quaternion.multiply> = Quaternion.multiply(to.worldRotation, inverse);
      return (point: IAutoMovieVector3): IAutoMovieVector3 => Vector3.add(
        to.worldPosition,
        Quaternion.rotateVector(rotation, Vector3.subtract(point, from.worldPosition)),
      );
    };
  }

  /**
   * The midpoint of the two shoulder joints on a posture, world metres.
   *
   * @param body The body.
   * @param posture The posture, as written so far.
   * @param resolution Optional current-person FK source borrowed for this raw authored-trunk observation.
   * @returns The point.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the result.
   * @evidence contracts/development/implementation.md#principled-implementation Both arms hang from and reach from their shoulder joints, so a place for two hands together (a club's grip, a ball held up, the floor under a support) is read from their midpoint.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One resolve and one mean.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Read on the displayed trunk, never rebuilt from the measure's heights.
   * @evidence contracts/development/implementation.md#efficient-algorithms One forward-kinematics pass per call.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates both actual shoulder outputs to HumanTrunk.resolve, borrowing optional same-person FK without changing authored-joint admission or adding ROM projection.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function shoulders(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    resolution?: IFK,
  ): IAutoMovieVector3 {
    const bones: ReturnType<typeof HumanTrunk.resolve> =
      HumanTrunk.resolve(body, posture, undefined, resolution, SHOULDERS);
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
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    place: IAutoMovieMotionHumanPlaced.IWristPlace,
    surface: IAutoMovieMotionHumanHand.Surface = "palm",
    shape: IAutoMovieMotionHumanHand.Shape = "flat",
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
    posture: Pick<IAutoMovieMotionHumanPosture, "yaw" | "pitch" | "roll">,
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
  export function girdle(body: Pick<IAutoMovieMotionHumanBody, "rest">): IAutoMovieVector3 {
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
  export function pitch(body: Pick<IAutoMovieMotionHumanBody, "rest">, rise: number): number {
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

/** Frame demanded by a point carried with the chest. */
const CHEST: ReadonlySet<AutoMovieHumanoidBone> = new Set(["chest"]);

/** Joints whose midpoint places a two-hand target. */
const SHOULDERS: ReadonlySet<AutoMovieHumanoidBone> = new Set(["leftUpperArm", "rightUpperArm"]);

/** Genuine current-person exact FK source borrowed only by actual observations. */
type IFK = Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2];

/** Genuine current-person ROM metadata forwarded without changing raw authored-trunk policy. */
type IROM = Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3];
