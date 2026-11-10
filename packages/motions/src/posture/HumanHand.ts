import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  quaternionFromAutoMovieBasis,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  AutoMovieHumanoidSocket,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanPosture } from "./IHumanPosture";
import { poseBones } from "./poseBones";
import { resolveHumanPosture } from "./resolveHumanPosture";

/**
 * A hand brought to a target: which wrist point and hand rotation put a
 * chosen hand surface (the palm, the grip centre, the fist, the back of the
 * hand, the index fingertip or the wrist itself) on a world frame, under a
 * stated hand shape, and where that surface is on a displayed pose.
 *
 * This is how procedural animation authors a hand contact: the effector is a
 * socket on the hand, the goal is a point and an orientation in the world,
 * and inverse kinematics solves the arm (Unreal's hand sockets with Control
 * Rig and Full Body IK; Final IK's effector offsets; Rosen, GDC 2014,
 * "Animation Bootcamp: An Indie Approach to Procedural Animation"). The arm
 * solver places the wrist joint, so the wrist goal is the target point less
 * the surface's offset from the wrist turned by the hand's rotation, the same
 * rigid relation `HumanFoot.pivot` uses for the sole.
 *
 * Every surface is a frame of the body's own resolved surfaces, so the same
 * request fits any hand size: a point, an outward `normal` and a `forward`.
 * The palm, grip and fist sockets carry their own forward (the palm's along
 * the fingers, the grip's toward the thumb side, +Z at rest, the fist's
 * down); the back of the hand and the wrist take the palm's forward, along
 * the fingers; the index fingertip, whose normal already runs along the
 * finger, takes the palm normal as its forward. The palm, grip, fist and back
 * of the hand ride the hand bone and do not depend on the fingers; the index
 * fingertip rides the distal phalanx, so its frame is read by forward
 * kinematics of the hand under the requested shape and kept per body and
 * shape.
 *
 * A rotation is the hand's world rotation from its rest, the form
 * `IHumanPosture.IGoal.rotation` and `fitChainToTarget`'s `effectorRotation`
 * take. It is built by aligning two directions: {@link HumanHand.align} turns
 * a surface's rest normal onto a world normal exactly and its rest forward
 * onto a world forward as closely as a direction across the normal allows;
 * {@link HumanHand.rotation} does the same for the anatomical pair of where
 * the fingers point and where the palm faces (rest: left fingers +X, right
 * fingers -X, both palms -Y, `HUMANOID_REST_FRAME`).
 *
 * Shapes are the only finger angles a law writes, since a hand's pre-shape is
 * a posture of the fingers themselves, not a goal any effector reaches
 * (Jeannerod 1984 describes prehension as transport plus a separate shaping):
 *
 * - `relaxed`: every finger joint flexed 15 degrees and the thumb 10, the
 *   resting cascade the stand law also uses;
 * - `flat`: every finger straight, an open palm (offer, stop, wave, a palm
 *   on a surface);
 * - `point`: the index straight, the other fingers curled as the fist and the
 *   thumb folded over them;
 * - `fist`: proximal phalanges 85, the middle and distal 95 degrees, and the
 *   thumb's proximal 40 and distal 50 degrees across the curled fingers,
 *   inside the finger range of `DEFAULT_HUMANOID_ROM` (-20 to 100).
 *
 * The arm solver (`fitChainToTarget`) turns the hand by wrist flexion and
 * deviation only and leaves the forearm untwisted, so a rotation that needs
 * pronation or supination is clamped and its surface lands off the point by
 * the clamped share; {@link HumanHand.frame} reads where the surface really
 * is, so audits report that residual. The forearm-twist split is requested
 * from the engine.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the frames, each surface's forward, the rotation convention, each shape's angles and the forearm limitation.
 * @evidence contracts/development/design.md#principled-representation Surfaces are the body's own resolved frames; a rotation is a world quaternion from rest aligned from two directions.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One owner for hand effector goals, shared by gestures, rest places and grasping.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the engine surfaces, FK and quaternion helpers.
 * @evidence contracts/development/implementation.md#principled-implementation Rigid offset of a socket from the wrist (an effector offset); alignment completes each direction pair to a frame and composes the engine's basis rotations.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Offsets, alignment, placement and read-back as separate small functions over one frame type.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A forward parallel to the normal throws instead of picking an arbitrary twist.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per call; the fingertip FK runs once per body, side and shape.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Fingertip frames are memoized per body object, side and shape, which fully determine them.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The memo is a WeakMap on the body, at most eight entries a body, released with the body.
 */
export namespace HumanHand {
  /** A hand. */
  export type Side = "left" | "right";

  /** A surface of the hand brought to a target. */
  export type Surface =
    | "palm"
    | "grip"
    | "fist"
    | "handBack"
    | "indexTip"
    | "wrist";

  /** A hand shape. */
  export type Shape = "relaxed" | "flat" | "point" | "fist";

  /** A frame: a point with an outward unit normal and a unit forward across it. */
  export interface IFrame {
    /** Point, metres. */
    point: IAutoMovieVector3;

    /** Outward unit normal. */
    normal: IAutoMovieVector3;

    /** Unit forward, perpendicular or not to the normal; only its component across the normal is used. */
    forward: IAutoMovieVector3;
  }

  /** How a hand is turned, in world directions. */
  export interface IOrientation {
    /** Where the fingers point, from the wrist toward the middle knuckle; any non-zero vector. */
    fingers: IAutoMovieVector3;

    /** Where the palm faces; any vector not parallel to `fingers`. */
    palm: IAutoMovieVector3;
  }

  /** A wrist goal: the point and the rotation the arm solver takes. */
  export interface IWrist {
    /** The wrist joint, world metres. */
    point: IAutoMovieVector3;

    /** The hand's world rotation from its rest. */
    rotation: IAutoMovieQuaternion;
  }

  /**
   * The finger joints of a hand shape, clinical degrees.
   *
   * @param side The hand.
   * @param form The shape.
   * @returns Angles for every finger and thumb segment of that hand.
   */
  export function shape(
    side: Side,
    form: Shape,
  ): Partial<Record<AutoMovieHumanoidBone, readonly [number, number, number]>> {
    const out: Partial<
      Record<AutoMovieHumanoidBone, readonly [number, number, number]>
    > = {};
    const set = (bone: string, flexion: number): void => {
      out[`${side}${bone}` as AutoMovieHumanoidBone] = [flexion, 0, 0];
    };
    for (const digit of ["Index", "Middle", "Ring", "Little"]) {
      const curled: boolean =
        form === "fist" || (form === "point" && digit !== "Index");
      for (const segment of ["Proximal", "Intermediate", "Distal"]) {
        if (curled) set(`${digit}${segment}`, segment === "Proximal" ? 85 : 95);
        else set(`${digit}${segment}`, form === "relaxed" ? 15 : 0);
      }
    }
    const folded: boolean = form === "fist" || form === "point";
    set("ThumbMetacarpal", 0);
    set("ThumbProximal", folded ? 40 : form === "relaxed" ? 10 : 0);
    set("ThumbDistal", folded ? 50 : form === "relaxed" ? 10 : 0);
    return out;
  }

  /**
   * A hand surface's frame relative to the wrist joint under a shape, in the
   * hand's rest frame.
   *
   * @param body The body.
   * @param side The hand.
   * @param surface The surface.
   * @param form The hand shape; it matters only for the index fingertip.
   * @returns The frame, its point measured from the wrist joint.
   */
  export function offset(
    body: IHumanBody,
    side: Side,
    surface: Surface,
    form: Shape = "relaxed",
  ): IFrame {
    const Side: "Left" | "Right" = side === "left" ? "Left" : "Right";
    const palm =
      body.surfaces.sockets[`palm${Side}` as AutoMovieHumanoidSocket];
    switch (surface) {
      case "wrist":
        return {
          point: { x: 0, y: 0, z: 0 },
          normal: palm.normal,
          forward: palm.forward!,
        };
      case "palm":
      case "grip":
      case "fist": {
        const frame =
          body.surfaces.sockets[`${surface}${Side}` as AutoMovieHumanoidSocket];
        return {
          point: frame.point,
          normal: frame.normal,
          forward: frame.forward!,
        };
      }
      case "handBack": {
        const frame =
          body.surfaces.regions[`handBack${Side}` as AutoMovieHumanoidRegion];
        return {
          point: frame.point,
          normal: frame.normal,
          forward: palm.forward!,
        };
      }
      case "indexTip":
        return fingertip(body, side, form);
    }
  }

  /**
   * The rotation that turns a rest frame's normal onto a world normal exactly
   * and its forward onto a world forward as closely as possible: each pair is
   * completed to a right-handed orthonormal frame (the normal, the forward's
   * component across it, and their cross product), and the rotation is the
   * world frame times the inverse of the rest frame, both read by the
   * engine's `quaternionFromAutoMovieBasis`.
   *
   * @param rest The surface's rest normal and forward.
   * @param world The requested world normal and forward.
   * @returns The rotation.
   * @throws {Error} When a forward is parallel to its normal.
   */
  export function align(
    rest: Pick<IFrame, "normal" | "forward">,
    world: Pick<IFrame, "normal" | "forward">,
  ): IAutoMovieQuaternion {
    const basis = (
      frame: Pick<IFrame, "normal" | "forward">,
    ): IAutoMovieQuaternion => {
      const n: IAutoMovieVector3 = Vector3.normalize(frame.normal);
      const across: IAutoMovieVector3 = Vector3.subtract(
        frame.forward,
        Vector3.scale(n, Vector3.dot(frame.forward, n)),
      );
      if (Vector3.length(across) < 1e-9)
        throw new Error(
          "A forward direction must not be parallel to its normal",
        );
      const f: IAutoMovieVector3 = Vector3.normalize(across);
      return quaternionFromAutoMovieBasis(n, f, Vector3.cross(n, f));
    };
    return Quaternion.normalize(
      Quaternion.multiply(basis(world), Quaternion.inverse(basis(rest))),
    );
  }

  /**
   * The hand's world rotation from its rest for an anatomical orientation:
   * the fingers met exactly, the palm as closely as a direction across the
   * fingers allows.
   *
   * @param side The hand.
   * @param orientation Where the fingers point and the palm faces.
   * @returns The rotation.
   */
  export function rotation(
    side: Side,
    orientation: IOrientation,
  ): IAutoMovieQuaternion {
    return align(
      {
        normal: { x: side === "left" ? 1 : -1, y: 0, z: 0 },
        forward: { x: 0, y: -1, z: 0 },
      },
      { normal: orientation.fingers, forward: orientation.palm },
    );
  }

  /**
   * The wrist goal that puts a hand surface on a world point with the hand
   * turned by a given rotation.
   *
   * @param body The body.
   * @param side The hand.
   * @param surface The surface brought to the point.
   * @param at The world point, metres.
   * @param turn The hand's world rotation from its rest.
   * @param form The hand shape.
   * @returns The wrist point and the rotation.
   */
  export function place(
    body: IHumanBody,
    side: Side,
    surface: Surface,
    at: IAutoMovieVector3,
    turn: IAutoMovieQuaternion,
    form: Shape = "relaxed",
  ): IWrist {
    const local: IFrame = offset(body, side, surface, form);
    return {
      point: Vector3.subtract(at, Quaternion.rotateVector(turn, local.point)),
      rotation: turn,
    };
  }

  /**
   * The wrist goal that lays a hand surface's frame on a world frame: its
   * point on the target point, its normal along the target normal and its
   * forward toward the target forward. A grasp passes the handle's frame
   * turned so the palm faces into the object and the forward runs along the
   * wrapped axis.
   *
   * @param body The body.
   * @param side The hand.
   * @param surface The surface.
   * @param target The world frame.
   * @param form The hand shape.
   * @returns The wrist point and the rotation.
   */
  export function reach(
    body: IHumanBody,
    side: Side,
    surface: Surface,
    target: IFrame,
    form: Shape = "relaxed",
  ): IWrist {
    const local: IFrame = offset(body, side, surface, form);
    return place(body, side, surface, target.point, align(local, target), form);
  }

  /**
   * Where a hand surface is on a displayed pose: its world frame from the
   * resolved bones, for audits that report a missed or range-limited contact
   * (the distance to the target and the angle between normals).
   *
   * @param body The body.
   * @param bones The pose's resolved bones.
   * @param side The hand.
   * @param surface The surface.
   * @param form The hand shape the pose holds; it matters only for the index fingertip.
   * @returns The world frame.
   */
  export function frame(
    body: IHumanBody,
    bones: ReadonlyMap<
      AutoMovieHumanoidBone,
      Pick<IAutoMovieResolvedBone, "worldPosition" | "worldRotation">
    >,
    side: Side,
    surface: Surface,
    form: Shape = "relaxed",
  ): IFrame {
    const hand = bones.get(`${side}Hand`)!;
    const local: IFrame = offset(body, side, surface, form);
    const turn = (v: IAutoMovieVector3): IAutoMovieVector3 =>
      Quaternion.rotateVector(hand.worldRotation, v);
    if (surface !== "indexTip")
      return {
        point: Vector3.add(hand.worldPosition, turn(local.point)),
        normal: turn(local.normal),
        forward: turn(local.forward),
      };

    // The fingertip rides the distal phalanx, so read it from that bone.
    const region =
      body.surfaces.regions[
        `indexTip${side === "left" ? "Left" : "Right"}` as AutoMovieHumanoidRegion
      ];
    const placed = resolveAutoMovieHumanoidSurfaces.place(
      region,
      bones.get(region.bone)!,
    );
    return {
      point: placed.point,
      normal: placed.normal,
      forward: turn(local.forward),
    };
  }

  /**
   * A natural elbow hint for an arm goal: a point beside, below and behind
   * the shoulder in the trunk's turned frame, so the elbow hangs down and out
   * as an unloaded arm does and never rises or folds across the body. A law
   * passes its own point instead where the movement needs another bend.
   *
   * @param body The body.
   * @param posture The root and heading the trunk is placed by.
   * @param side The arm.
   * @param out Extra outward share of the upper arm, for akimbo and wide gestures; 0 by default.
   * @returns The world point.
   */
  export function elbow(
    body: IHumanBody,
    posture: Pick<IHumanPosture, "root" | "yaw" | "pitch" | "roll">,
    side: Side,
    out: number = 0,
  ): IAutoMovieVector3 {
    const shoulder: IAutoMovieVector3 = body.rest.get(`${side}UpperArm`)!;
    const sign: number = side === "left" ? 1 : -1;
    const m = body.measure;
    const local: IAutoMovieVector3 = {
      x: shoulder.x + sign * (0.4 + out) * m.upperArm,
      y: shoulder.y - m.upperArm,
      z: shoulder.z - 0.5 * m.upperArm,
    };
    return Vector3.add(
      posture.root,
      Quaternion.rotateVector(resolveHumanPosture.heading(posture), local),
    );
  }
}

/** Index fingertip frames by body, keyed by side and shape. */
const TIPS: WeakMap<IHumanBody, Map<string, HumanHand.IFrame>> = new WeakMap();

/** The index fingertip's frame from the wrist under a hand shape, by forward kinematics of that hand alone. */
function fingertip(
  body: IHumanBody,
  side: HumanHand.Side,
  form: HumanHand.Shape,
): HumanHand.IFrame {
  const key: string = `${side}:${form}`;
  let memo: Map<string, HumanHand.IFrame> | undefined = TIPS.get(body);
  if (memo === undefined) {
    memo = new Map();
    TIPS.set(body, memo);
  }
  const known: HumanHand.IFrame | undefined = memo.get(key);
  if (known !== undefined) return known;
  const joints = Object.entries(HumanHand.shape(side, form)).map(
    ([bone, a]) => ({
      bone: bone as AutoMovieHumanoidBone,
      flexion: a![0],
      abduction: a![1],
      twist: a![2],
    }),
  );
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
    body,
    { skeleton: body.skeleton.id, root: null, joints },
  );
  const Side: "Left" | "Right" = side === "left" ? "Left" : "Right";
  const region =
    body.surfaces.regions[`indexTip${Side}` as AutoMovieHumanoidRegion];
  const tip = resolveAutoMovieHumanoidSurfaces.place(
    region,
    bones.get(region.bone)!,
  );
  const hand: IAutoMovieResolvedBone = bones.get(`${side}Hand`)!;
  const inverse: IAutoMovieQuaternion = Quaternion.inverse(hand.worldRotation);
  const out: HumanHand.IFrame = {
    point: Quaternion.rotateVector(
      inverse,
      Vector3.subtract(tip.point, hand.worldPosition),
    ),
    normal: Quaternion.rotateVector(inverse, tip.normal),
    forward:
      body.surfaces.sockets[`palm${Side}` as AutoMovieHumanoidSocket].normal,
  };
  memo.set(key, out);
  return out;
}
