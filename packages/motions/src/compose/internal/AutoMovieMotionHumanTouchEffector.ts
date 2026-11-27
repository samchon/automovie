import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanTouchEffector,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanColliders } from "../../posture/internal/HumanColliders";
import { HumanHand } from "../../posture/internal/HumanHand";

/** The alternatives of `PointBonesEntry`'s site. */
type PointBonesEntry = "worldPosition" | "worldRotation";

/** The alternatives of `LocalItem`'s site. */
type LocalItem = "fingers" | "palm" | "thumb";

/**
 * What touches in a touch: a hand surface, or the tip of a tool the hand holds,
 * stated in the hand's anatomical axes (where the fingers point, where the palm
 * faces and where the thumb points at rest) as shares of the hand's length, so
 * a held cup's rim or a spoon's bowl is placed on the mouth without a prop.
 * Also the effector's displayed point the verdicts read, the skin's stand-off
 * from the hand's own colliders and the arm goal that lays the effector on a
 * contact point.
 */
export namespace AutoMovieMotionHumanTouchEffector {
  /** The axes of {@link IAutoMovieMotionHumanTouchEffector.Axis}, as data. */
  export const AXES = [
    "fingers",
    "palm",
    "thumb",
    "grasp",
    "-fingers",
    "-palm",
    "-thumb",
    "-grasp",
  ] as const satisfies readonly NonNullable<IAutoMovieMotionHumanTouchEffector.Axis>[];

  /**
   * A hand axis at rest, in the hand's rest frame: the rig rests in a T pose
   * with the palms down, so the fingers point out to the hand's side, the palm
   * faces down and the thumb points forward. The grasp axis is the thumb's
   * leaned `GRASP` degrees toward the fingers.
   *
   * @param side The hand.
   * @param axis The axis.
   * @returns The unit vector.
   */
  export function axis(
    side: AutoMovieHumanSide,
    axis: IAutoMovieMotionHumanTouchEffector.Axis,
  ): IAutoMovieVector3 {
    const sign: number = axis.startsWith("-") ? -1 : 1;
    const name: string = axis.replace("-", "");
    const fingers: number = side === "left" ? 1 : -1;
    const lean: number = (GRASP * Math.PI) / 180;
    const v: IAutoMovieVector3 =
      name === "fingers"
        ? { x: fingers, y: 0, z: 0 }
        : name === "palm"
          ? { x: 0, y: -1, z: 0 }
          : name === "thumb"
            ? { x: 0, y: 0, z: 1 }
            : { x: fingers * Math.sin(lean), y: 0, z: Math.cos(lean) };
    return Vector3.scale(v, sign);
  }

  /**
   * A direction of the hand in its rest frame.
   *
   * @param side The hand.
   * @param direction An axis, or weights on the three anatomical axes.
   * @returns The unit vector.
   * @throws {HumanRefusal} A `parameter` refusal on `direction` that lists the
   *   hand's axes, when every weight is zero.
   */
  export function direction(
    side: AutoMovieHumanSide,
    direction: IAutoMovieMotionHumanTouchEffector.Direction,
  ): IAutoMovieVector3 {
    if (typeof direction === "string") return axis(side, direction);
    let sum: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    for (const name of ["fingers", "palm", "thumb"] as const)
      sum = Vector3.add(
        sum,
        Vector3.scale(axis(side, name), direction[name] ?? 0),
      );
    if (!(Vector3.length(sum) > 1e-9))
      throw new HumanRefusal({
        kind: "parameter",
        axis: "direction",
        value: direction,
        feasible: {
          kind: "alternatives",
          values: AXES,
        },
        reason:
          "a direction of the hand weighs its three axes, and every weight given is 0, so it points nowhere",
        fix: "name one of the hand's axes, or give at least one axis a weight that is not 0",
      });
    return Vector3.normalize(sum);
  }

  /**
   * The effector's point relative to the wrist joint and its facing and along
   * directions, all in the hand's rest frame.
   *
   * @param body The body.
   * @param side The hand.
   * @param effector The effector.
   * @returns The point, metres, and two unit directions.
   */
  export function local(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    effector: IAutoMovieMotionHumanTouchEffector.IEffector,
  ): IAutoMovieMotionHumanTouchEffector.ILocalResult {
    const surface: IAutoMovieMotionHumanHand.IFrame = HumanHand.offset(
      body,
      side,
      effector.surface,
      effector.shape,
      effector.curl ?? 0,
    );
    const hand: number = body.measure.hand;
    let point: IAutoMovieVector3 = surface.point;
    for (const [name, share] of Object.entries(effector.tool ?? {}) as [
      LocalItem,
      number,
    ][])
      point = Vector3.add(point, Vector3.scale(axis(side, name), share * hand));
    return {
      point,
      normal:
        effector.facing === undefined
          ? surface.normal
          : direction(side, effector.facing),
      forward:
        effector.along === undefined
          ? surface.forward
          : direction(side, effector.along),
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
   */
  export function point(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<
      AutoMovieHumanoidBone,
      Pick<IAutoMovieResolvedBone, PointBonesEntry>
    >,
    side: AutoMovieHumanSide,
    effector: IAutoMovieMotionHumanTouchEffector.IEffector,
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
   * How far a skin surface stands inside its own hand's colliders, metres: the
   * stand-off that lays the skin, not the bone axis, on a region. A tool's tip
   * stands outside the hand and takes none.
   *
   * @param body The body.
   * @param side The hand.
   * @param effector The effector.
   * @returns Metres, not negative.
   * @throws {HumanRefusal} When the effector's shape does not admit its contact
   *   (`admit`).
   */
  export function pad(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    effector: IAutoMovieMotionHumanTouchEffector.IEffector,
  ): number {
    admit(effector);
    if (effector.tool !== undefined) return 0;
    const own: AutoMovieHumanoidBone = HumanHand.bone(side, effector.surface);
    const rest: IAutoMovieVector3 | undefined = body.rest.get(own);

    // A rig without the bone, or a profile with no collider on it, has no
    // skin there to stand off.
    if (
      rest === undefined ||
      !body.profile.segments.some(
        (
          segment: IAutoMovieMotionHumanBody["profile"]["segments"][number],
        ): boolean =>
          segment.bone === own && (segment.shapes?.length ?? 0) !== 0,
      )
    )
      return 0;
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map([
      [
        own,
        {
          bone: own,
          worldPosition: rest,
          worldRotation: Quaternion.identity(),
        } as IAutoMovieResolvedBone,
      ],
    ]);
    const at: IAutoMovieVector3 = Vector3.add(
      body.rest.get(`${side}Hand`)!,
      local(body, side, effector).point,
    );
    return Math.max(0, -HumanColliders.distance(body, bones, at).distance);
  }

  /**
   * The hand shapes whose posed hand an effector's contact lies on, by hand
   * surface: a palm contact is the palm laid flat, a fist's is the fist, the
   * index fingertip's and pad's are the finger held out flat or pointing, every
   * other digit's tip and pad are the digit held out straight in a flat hand
   * (the point curls them into the fist), and the back of the hand and the
   * wrist are outermost in every shape. A grip without a tool is the fist round
   * a handle, its contact the fist's own surface along its facing. A held
   * tool's tip lies beyond the hand in any shape that holds it.
   */
  export const ADMITS: Readonly<
    Record<
      IAutoMovieMotionHumanHand.Surface,
      readonly IAutoMovieMotionHumanHand.Shape[]
    >
  > = {
    palm: ["flat"],
    grip: ["fist"],
    fist: ["fist"],
    indexTip: ["flat", "point"],
    indexPad: ["flat", "point"],
    handBack: HumanHand.SHAPES,
    wrist: HumanHand.SHAPES,
    thumbTip: ["flat"],
    thumbPad: ["flat"],
    middleTip: ["flat"],
    middlePad: ["flat"],
    ringTip: ["flat"],
    ringPad: ["flat"],
    littleTip: ["flat"],
    littlePad: ["flat"],
  };

  /**
   * Refuse an effector whose hand shape does not admit its contact (`ADMITS`):
   * a palm curled relaxed has its fingertips past the palm, so the palm cannot
   * lie on the region: a relaxed palm wiping the mouth has its fingertips 52 mm
   * past the palm along its facing. An effector with a tool is admitted in any
   * shape.
   *
   * @param effector The effector.
   * @throws {HumanRefusal} When the shape is not one its surface admits.
   */
  export function admit(
    effector: IAutoMovieMotionHumanTouchEffector.IEffector,
  ): void {
    if (effector.tool !== undefined) return;
    const admitted: readonly IAutoMovieMotionHumanHand.Shape[] =
      ADMITS[effector.surface];
    if (admitted.includes(effector.shape)) return;
    throw new HumanRefusal({
      kind: "parameter",
      axis: "shape",
      value: effector.shape,
      feasible: { kind: "alternatives", values: admitted },
      reason: `a ${effector.surface} contact lies on the hand only in the ${admitted.join(" or ")} shape; ${effector.shape} puts other parts of the hand past it`,
      fix: `lay the ${effector.surface} with the hand ${admitted.join(" or ")}`,
    });
  }
  /**
   * The arm goal that lays an effector on a contact point against a normal, its
   * along axis on a tangent.
   *
   * @param body The body.
   * @param side The hand.
   * @param effector The effector.
   * @param at The contact point, world.
   * @param normal The region's outward normal, world.
   * @param tangent The tangent the effector's along axis follows, world.
   * @param bend The elbow hint, world.
   * @param endOn Align the ray from the wrist to the actual contact point with
   *   the approach. A contact at the wrist keeps its surface normal.
   * @returns The arm's goal, with the effector as the contact the resolver
   *   keeps.
   */
  export function goal(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    effector: IAutoMovieMotionHumanTouchEffector.IEffector,
    at: IAutoMovieVector3,
    normal: IAutoMovieVector3,
    tangent: IAutoMovieVector3,
    bend: IAutoMovieVector3,
    endOn: boolean = false,
  ): IAutoMovieHumanLimbGoal {
    const rest = local(body, side, effector);
    const rotation: IAutoMovieQuaternion = HumanHand.align(
      {
        normal:
          endOn && Vector3.length(rest.point) > 0
            ? Vector3.normalize(rest.point)
            : rest.normal,
        forward: rest.forward,
      },
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

/**
 * How far a held cylinder's axis leans from the thumb's toward the fingers,
 * degrees (provisional).
 */
const GRASP: number = 20;
