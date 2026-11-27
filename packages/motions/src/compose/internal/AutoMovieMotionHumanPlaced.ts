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

import { HumanTrunk } from "../../everyday/internal/HumanTrunk";
import { HumanBoneGroups } from "../../posture/internal/HumanBoneGroups";
import { HumanHand } from "../../posture/internal/HumanHand";
import { HumanHandTarget } from "../../posture/internal/HumanHandTarget";
import { humanPostureHeading } from "../../posture/internal/humanPostureHeading";
import { AutoMovieMotionHumanArm } from "./AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanHand } from "./AutoMovieMotionHumanHand";
import { AutoMovieMotionHumanTarget } from "./AutoMovieMotionHumanTarget";
import { AutoMovieMotionHumanTargetGrid } from "./AutoMovieMotionHumanTargetGrid";

/**
 * An arm carried to a place of the air: the hand surface laid on a point with a
 * facing, the arm's reach, hold and return planned as one trajectory over the
 * span the law states (`AutoMovieMotionHumanArm.carried`) and the fingers
 * shaped by the weight; without a span, the deprecated joint-space carry by the
 * weight. The exercise, stretching, dance and sport laws place their arms this
 * way, at named grid places of the body
 * (`AutoMovieMotionHumanTargetGrid.place`) moved by their own curves.
 */
export namespace AutoMovieMotionHumanPlaced {
  /**
   * The arm and the fingers laid at a place. The canonical body and configured
   * surface/shape/bend remain unchanged for the primitive's lifetime; the
   * actual place, facing, forward and current posture are read independently at
   * every requested second.
   *
   * @param props The arm.
   * @returns The arm's and the hand's primitives.
   */
  export function arm(
    props: IAutoMovieMotionHumanPlaced.IArm,
  ): IAutoMovieMotionHumanPrimitive[] {
    const surface: IAutoMovieMotionHumanHand.Surface = props.surface ?? "palm";
    const shape: IAutoMovieMotionHumanHand.Shape = props.shape ?? "flat";
    const target: ReturnType<typeof HumanHandTarget.prepareGoal> =
      HumanHandTarget.prepareGoal(props.body, props.side, {
        surface,
        shape,
        ...(props.bend === undefined ? {} : { bend: props.bend }),
      });
    return [
      AutoMovieMotionHumanArm.carried({
        body: props.body,
        side: props.side,
        from: props.from,
        to: props.to,
        rest: props.rest,
        weight: props.weight,
        ...(props.span === undefined ? {} : { span: props.span }),
        ...(props.together === undefined ? {} : { together: props.together }),
        goal: (
          posture: IAutoMovieMotionHumanPosture,
          seconds: number,
          resolution?: IFK,
          projection?: IROM,
        ): IAutoMovieHumanLimbGoal => {
          const at: ReturnType<IAutoMovieMotionHumanPlaced.IArm["place"]> =
            props.place(posture, seconds, resolution, projection);
          return target(
            posture,
            { point: at.point, normal: Vector3.scale(at.facing, -1) },
            at.forward,
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
   * A named grid place of the air around a posture, world metres: the heights
   * are the standing body's above the floor, and the distance and the lateral
   * are read from the floor point the pelvis stands over.
   *
   * @param body The body.
   * @param posture The posture the place is read around, as written so far.
   * @param side The hand, which the lateral names mirror by.
   * @param grid The grid names.
   * @param nudge A nudge in arm lengths; none when absent.
   * @returns The point.
   */
  export function grid(
    body: IAutoMovieMotionHumanBody,
    posture: Pick<IAutoMovieMotionHumanPosture, GridPosture>,
    side: AutoMovieHumanSide,
    grid: IAutoMovieMotionHumanTargetGrid.IGrid,
    nudge?: IAutoMovieMotionHumanTargetGrid.INudge,
  ): IAutoMovieVector3 {
    const rest: IAutoMovieVector3 = body.rest.get("hips")!;
    const hips: IAutoMovieVector3 = Vector3.add(
      posture.root,
      Quaternion.rotateVector(humanPostureHeading(posture), rest),
    );
    const standing: IAutoMovieVector3 = Quaternion.rotateVector(
      humanPostureHeading({ yaw: posture.yaw, pitch: 0, roll: 0 }),
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
   * @param bone A bone of the trunk, the head or a shoulder girdle, or an upper
   *   arm, whose joint the girdle carries.
   * @param resolution Optional same-person FK source borrowed for this raw
   *   observation only.
   * @returns The joint's point.
   */
  export function joint(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    bone: AutoMovieHumanoidBone,
    resolution?: IFK,
  ): IAutoMovieVector3 {
    return HumanTrunk.resolve(
      body,
      posture,
      undefined,
      resolution,
      new Set<AutoMovieHumanoidBone>([bone]),
    ).get(bone)!.worldPosition;
  }

  /**
   * A point carried with the chest from one posture to another: where a point
   * that stood at `point` beside the chest of `standing` lies once the chest
   * has moved to where `posture` holds it. Arms held overhead through a side
   * bend ride the chest this way.
   *
   * @param body The body.
   * @param standing The posture the point was stated on.
   * @param posture The posture, as written so far.
   * @param point The point on `standing`, world metres.
   * @param resolution Optional same-person FK loan borrowed only by the current
   *   chest observation; the source standing read remains cold.
   * @returns The point on `posture`, world metres.
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
   * @returns A current-posture reader; each call reads its chest once and
   *   returns a point transform from the original world frame to the current
   *   world frame.
   */
  export function carryFrom(
    body: IAutoMovieMotionHumanBody,
    standing: IAutoMovieMotionHumanPosture,
  ): (
    posture: IAutoMovieMotionHumanPosture,
    resolution?: IFK,
  ) => (point: IAutoMovieVector3) => IAutoMovieVector3 {
    const from: IAutoMovieResolvedBone = HumanTrunk.resolve(
      body,
      standing,
      undefined,
      undefined,
      HumanBoneGroups.CHEST,
    ).get("chest")!;
    const inverse: ReturnType<typeof Quaternion.inverse> = Quaternion.inverse(
      from.worldRotation,
    );
    return (
      posture: IAutoMovieMotionHumanPosture,
      resolution?: IFK,
    ): ((point: IAutoMovieVector3) => IAutoMovieVector3) => {
      const to: IAutoMovieResolvedBone = HumanTrunk.resolve(
        body,
        posture,
        undefined,
        resolution,
        HumanBoneGroups.CHEST,
      ).get("chest")!;
      const rotation: ReturnType<typeof Quaternion.multiply> =
        Quaternion.multiply(to.worldRotation, inverse);
      return (point: IAutoMovieVector3): IAutoMovieVector3 =>
        Vector3.add(
          to.worldPosition,
          Quaternion.rotateVector(
            rotation,
            Vector3.subtract(point, from.worldPosition),
          ),
        );
    };
  }

  /**
   * The midpoint of the two shoulder joints on a posture, world metres.
   *
   * @param body The body.
   * @param posture The posture, as written so far.
   * @param resolution Optional current-person FK source borrowed for this raw
   *   authored-trunk observation.
   * @returns The point.
   */
  export function shoulders(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    resolution?: IFK,
  ): IAutoMovieVector3 {
    const bones: ReturnType<typeof HumanTrunk.resolve> = HumanTrunk.resolve(
      body,
      posture,
      undefined,
      resolution,
      HumanBoneGroups.SHOULDERS,
    );
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
   * @param place The point, the direction the surface faces and where the
   *   fingers point.
   * @param surface The hand surface; the palm when absent.
   * @param shape The hand's shape; flat when absent.
   * @returns The wrist's point, world metres.
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
   * @param rest The point in the resting body's frame, as `IHumanBody.rest`
   *   gives a joint.
   * @param point Where it must stand, world metres.
   * @returns The root.
   */
  export function root(
    posture: Pick<IAutoMovieMotionHumanPosture, RootPosture>,
    rest: IAutoMovieVector3,
    point: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    return Vector3.subtract(
      point,
      Quaternion.rotateVector(humanPostureHeading(posture), rest),
    );
  }

  /**
   * The resting midpoint of the two shoulder joints, in the resting body's
   * frame.
   *
   * @param body The body.
   * @returns The point `root` takes as a pivot.
   */
  export function girdle(
    body: Pick<IAutoMovieMotionHumanBody, "rest">,
  ): IAutoMovieVector3 {
    return Vector3.lerp(
      body.rest.get("leftUpperArm")!,
      body.rest.get("rightUpperArm")!,
      0.5,
    );
  }

  /**
   * The trunk's forward pitch at which the shoulders stand a given height above
   * the hips.
   *
   * @param body The body.
   * @param rise The shoulders' height above the hips, metres; negative when the
   *   hips stand higher.
   * @returns Degrees: 0 near the standing trunk, 90 near the level one, more
   *   with the hips above the shoulders. A rise past the trunk's length gives
   *   the pitch of the nearest end.
   */
  export function pitch(
    body: Pick<IAutoMovieMotionHumanBody, "rest">,
    rise: number,
  ): number {
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

/** The alternatives of `RootPosture`'s site. */
type RootPosture = "yaw" | "pitch" | "roll";

/** The alternatives of `GridPosture`'s site. */
type GridPosture = "root" | "yaw" | "pitch" | "roll";

/** Genuine current-person exact FK source borrowed only by actual observations. */
type IFK = Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2];

/**
 * Genuine current-person ROM metadata forwarded without changing raw
 * authored-trunk policy.
 */
type IROM = Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3];
