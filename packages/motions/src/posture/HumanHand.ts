import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  AutoMovieHumanoidSocket,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHand,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanHandDirection } from "./HumanHandDirection";
import { HumanHandShape } from "./HumanHandShape";
import { alignHumanHandSurface } from "./alignHumanHandSurface";
import { placeHumanHandSurface } from "./placeHumanHandSurface";
import { readHumanHandFrame } from "./readHumanHandFrame";

/** The alternatives of `FrameBonesEntry`'s site. */
type FrameBonesEntry = "worldPosition" | "worldRotation";

/** The alternatives of `AlignWorld`'s site. */
type AlignWorld = "normal" | "forward";

/** The alternatives of `AlignRest`'s site. */
type AlignRest = "normal" | "forward";

/** The alternatives of `OffsetSide`'s site. */
type OffsetSide = "Left" | "Right";

/**
 * A hand brought to a target: which wrist point and hand rotation put a chosen
 * hand surface (the palm, the grip centre, the fist, the back of the hand, a
 * digit's tip or pad, or the wrist itself) on a world frame, under a stated
 * hand shape, and where that surface is on a displayed pose.
 *
 * This is how procedural animation authors a hand contact: the effector is a
 * socket on the hand, the goal is a point and an orientation in the world, and
 * inverse kinematics solves the arm (Rosen, GDC 2014, "Animation Bootcamp: An
 * Indie Approach to Procedural Animation"). The arm solver places the wrist
 * joint, so the wrist goal is the target point less the surface's offset from
 * the wrist turned by the hand's rotation, the same rigid relation
 * `HumanFoot.pivot` uses for the sole.
 *
 * Every surface is a frame of the body's own resolved surfaces, so the same
 * request fits any hand size: a point, an outward `normal` and a `forward`. The
 * palm, grip and fist sockets carry their own forward (the palm's along the
 * fingers, the grip's toward the thumb side, +Z at rest, the fist's down); the
 * back of the hand and the wrist take the palm's forward, along the fingers; a
 * digit's tip and pad take the palm normal as their forward. The palm, grip,
 * fist and back of the hand ride the hand bone and do not depend on the
 * fingers; a digit's tip and pad ride its distal phalanx, so their frames are
 * read by forward kinematics of the hand under the requested shape and kept per
 * body, surface and shape.
 *
 * A rotation is the hand's world rotation from its rest, the form
 * `HumanPosture.IGoal.rotation` and `fitChainToTarget`'s `effectorRotation`
 * take. It is built by aligning two directions: {@link HumanHand.align} turns a
 * surface's rest normal onto a world normal exactly and its rest forward onto a
 * world forward as closely as a direction across the normal allows;
 * {@link HumanHand.rotation} does the same for the anatomical pair of where the
 * fingers point and where the palm faces (rest: left fingers +X, right fingers
 * -X, both palms -Y, `HUMANOID_REST_FRAME`).
 *
 * Shapes are the only finger angles a law writes, since a hand's pre-shape is a
 * posture of the fingers themselves, not a goal any effector reaches (Jeannerod
 * 1984 describes prehension as transport plus a separate shaping):
 *
 * - `relaxed`: the hand's position of rest, the fingers partly flexed at every
 *   joint (knuckles 35, middle joints 30, end joints 20 degrees) and the
 *   thumb's two hinges 25 each, measured from the straight finger of the
 *   canonical body; the stand law hangs the same hand;
 * - `flat`: every finger straight, an open palm (offer, stop, wave, a palm on a
 *   surface);
 * - `point`: the index straight, the other fingers curled as the fist and the
 *   thumb folded over them;
 * - `fist`: proximal phalanges 85, the middle 95 and the distal 90 degrees, the
 *   distal at the end of its range (80 to 90 in every located norm,
 *   `DEFAULT_HUMANOID_ROM`), and the thumb's proximal 40 and distal 50 degrees
 *   across the curled fingers;
 * - `bridge`: a sprinter's set hand, every finger straight and the thumb at its
 *   neutral, standing palmar of the knuckles' plane and spread from the
 *   forefinger, so the hand stands on the forefinger's and the thumb's tips
 *   with the palm raised off the track (Davidson 2013, "Teaching athletes to
 *   use the sprinter's block", Coach and Athletic Director: "Pyramid the hands
 *   as to be on the fingertips with thumbs pointing in toward the body", "The
 *   forefinger and thumb are against the starting line"; Badon 2015,
 *   "Acceleration mechanics, drills, synthesis", Techniques (USTFCCCA): "The
 *   hands form a bridge"). A flat hand lays its thumb in the palm's plane,
 *   which a hand on its fingertips would lift off the line.
 *
 * The arm solver (`fitChainToTarget`) gives the forearm the share of an asked
 * hand rotation that turns about the forearm's length, within its range of
 * pronation and supination, and the wrist the rest by flexion and deviation. A
 * rotation beyond either range is clamped and its surface lands off the point
 * by the clamped share; {@link HumanHand.frame} reads where the surface really
 * is, so audits report that residual. Asked about 140 degrees or more of
 * forearm turn away from the hand's own rotation at its place, the nearer limit
 * changes sides and the hand with it, so a law keeps an asked rotation on one
 * side of that across its instants (`test_human_motion_core_hand_rotation`).
 */
export namespace HumanHand {
  /** The sides of {@link Side}, as data. */
  export const SIDES = [
    "left",
    "right",
  ] as const satisfies readonly NonNullable<AutoMovieHumanSide>[];

  /** The surfaces of {@link Surface}, as data. */
  export const SURFACES = [
    "palm",
    "grip",
    "fist",
    "handBack",
    "indexTip",
    "wrist",
    "thumbTip",
    "thumbPad",
    "indexPad",
    "middleTip",
    "middlePad",
    "ringTip",
    "ringPad",
    "littleTip",
    "littlePad",
  ] as const satisfies readonly NonNullable<IAutoMovieMotionHumanHand.Surface>[];

  /** The surfaces of {@link DigitSurface}, as data. */
  export const DIGIT_SURFACES = [
    "thumbTip",
    "thumbPad",
    "indexTip",
    "indexPad",
    "middleTip",
    "middlePad",
    "ringTip",
    "ringPad",
    "littleTip",
    "littlePad",
  ] as const satisfies readonly NonNullable<IAutoMovieMotionHumanHand.DigitSurface>[];

  /**
   * Whether a surface lies on a digit's distal phalanx, so it moves with the
   * fingers rather than with the hand bone.
   *
   * @param surface The surface.
   * @returns Whether it is a digit's tip or pad.
   */
  export function digital(
    surface: IAutoMovieMotionHumanHand.Surface,
  ): surface is IAutoMovieMotionHumanHand.DigitSurface {
    return (DIGIT_SURFACES as readonly string[]).includes(surface);
  }

  /**
   * The bone a surface rides: a digit's tip and pad ride its distal phalanx,
   * every other surface the hand.
   *
   * @param side The hand.
   * @param surface The surface.
   * @returns The bone.
   */
  export function bone(
    side: AutoMovieHumanSide,
    surface: IAutoMovieMotionHumanHand.Surface,
  ): AutoMovieHumanoidBone {
    if (!digital(surface)) return `${side}Hand`;
    const digit: string = surface.replace(/(Tip|Pad)$/, "");
    return `${side}${digit[0]!.toUpperCase()}${digit.slice(1)}Distal` as AutoMovieHumanoidBone;
  }

  /** The hand shapes of {@link Shape}, as data. */
  export const SHAPES = [
    "relaxed",
    "flat",
    "point",
    "fist",
    "bridge",
  ] as const satisfies readonly NonNullable<IAutoMovieMotionHumanHand.Shape>[];

  /**
   * The finger joints of a hand shape, clinical degrees.
   *
   * @param side The hand.
   * @param form The shape.
   * @returns Angles for every finger and thumb segment of that hand.
   */
  export function shape(
    side: AutoMovieHumanSide,
    form: IAutoMovieMotionHumanHand.Shape,
  ): Partial<Record<AutoMovieHumanoidBone, readonly [number, number, number]>> {
    return HumanHandShape.of(side, form);
  }

  /**
   * A hand surface's frame relative to the wrist joint under a shape, in the
   * hand's rest frame.
   *
   * @param body The body.
   * @param side The hand.
   * @param surface The surface.
   * @param form The hand shape; it matters only for a digit's tip or pad.
   * @param curl Extra flexion of the fingers over the shape, degrees, as a kind
   *   of touch curls them; it matters only for a digit's tip or pad.
   * @returns The frame, its point measured from the wrist joint.
   */
  export function offset(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    surface: IAutoMovieMotionHumanHand.Surface,
    form: IAutoMovieMotionHumanHand.Shape = "relaxed",
    curl: number = 0,
  ): IAutoMovieMotionHumanHand.IFrame {
    const Side: OffsetSide = side === "left" ? "Left" : "Right";
    const palm: IAutoMovieHumanoidSurfaces.IFrame =
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
        const frame: IAutoMovieHumanoidSurfaces.IFrame =
          body.surfaces.sockets[`${surface}${Side}` as AutoMovieHumanoidSocket];
        return {
          point: frame.point,
          normal: frame.normal,
          forward: frame.forward!,
        };
      }
      case "handBack": {
        const frame: IAutoMovieHumanoidSurfaces.IFrame =
          body.surfaces.regions[`handBack${Side}` as AutoMovieHumanoidRegion];
        return {
          point: frame.point,
          normal: frame.normal,
          forward: palm.forward!,
        };
      }
      case "thumbTip":
      case "thumbPad":
      case "indexTip":
      case "indexPad":
      case "middleTip":
      case "middlePad":
      case "ringTip":
      case "ringPad":
      case "littleTip":
      case "littlePad":
        return HumanHandShape.tip(body, side, form, curl, surface);
    }
  }

  /**
   * The rotation that turns a rest frame's normal onto a world normal exactly
   * and its forward onto a world forward as closely as possible: each pair is
   * completed to a right-handed orthonormal frame (the normal, the forward's
   * component across it, and their cross product), and the rotation is the
   * world frame times the inverse of the rest frame, both read by the engine's
   * `quaternionFromAutoMovieBasis`.
   *
   * @param rest The surface's rest normal and forward.
   * @param world The requested world normal and forward.
   * @returns The rotation.
   * @throws {Error} When a forward is parallel to its normal.
   */
  export function align(
    rest: Pick<IAutoMovieMotionHumanHand.IFrame, AlignRest>,
    world: Pick<IAutoMovieMotionHumanHand.IFrame, AlignWorld>,
  ): IAutoMovieQuaternion {
    return alignHumanHandSurface(rest, world);
  }

  /**
   * Fixed-rest alignment owned by alignHumanHandSurface.prepare, with
   * world-first admission on every actual read.
   */
  export const prepareAlignment: typeof alignHumanHandSurface.prepare =
    alignHumanHandSurface.prepare;

  /**
   * The hand's world rotation from its rest for an anatomical orientation: the
   * fingers met exactly, the palm as closely as a direction across the fingers
   * allows.
   *
   * @param side The hand.
   * @param orientation Where the fingers point and the palm faces.
   * @returns The rotation.
   */
  export function rotation(
    side: AutoMovieHumanSide,
    orientation: IAutoMovieMotionHumanHand.IOrientation,
  ): IAutoMovieQuaternion {
    return (side === "left" ? LEFT_ROTATION : RIGHT_ROTATION)({
      normal: orientation.fingers,
      forward: orientation.palm,
    });
  }

  /** The axes of {@link Axis}, as data. */
  export const AXES = [
    "out",
    "in",
    "up",
    "down",
    "forward",
    "back",
  ] as const satisfies readonly NonNullable<IAutoMovieMotionHumanHand.Axis>[];

  /**
   * The world unit vector of a named direction for a hand of a performer
   * heading `yaw`.
   *
   * @param side The acting hand, which `out` and `in` mirror by.
   * @param yaw The performer's heading, degrees about +Y.
   * @param direction The direction, on any rung.
   * @returns The unit vector, world frame.
   * @throws {Error} When a between joins opposite axes or its share lies
   *   outside [0, 1], when explicit components are all zero, or when an
   *   explicit source is empty.
   */
  export function direction(
    side: AutoMovieHumanSide,
    yaw: number,
    direction: IAutoMovieMotionHumanHand.Direction,
  ): IAutoMovieVector3 {
    return HumanHandDirection.of(side, yaw, direction);
  }

  /**
   * The hand's world rotation from its rest for a named orientation.
   *
   * @param side The hand.
   * @param yaw The performer's heading, degrees about +Y.
   * @param facing Where the fingers point and the palm faces, by name.
   * @returns The rotation.
   */
  export function facing(
    side: AutoMovieHumanSide,
    yaw: number,
    facing: IAutoMovieMotionHumanHand.IFacing,
  ): IAutoMovieQuaternion {
    return rotation(side, {
      fingers: direction(side, yaw, facing.fingers),
      palm: direction(side, yaw, facing.palm),
    });
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
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    surface: IAutoMovieMotionHumanHand.Surface,
    at: IAutoMovieVector3,
    turn: IAutoMovieQuaternion,
    form: IAutoMovieMotionHumanHand.Shape = "relaxed",
  ): IAutoMovieMotionHumanHand.IWrist {
    const local: IAutoMovieMotionHumanHand.IFrame = offset(
      body,
      side,
      surface,
      form,
    );
    return placeHumanHandSurface(local.point, at, turn);
  }

  /**
   * The wrist goal that lays a hand surface's frame on a world frame: its point
   * on the target point, its normal along the target normal and its forward
   * toward the target forward. A grasp passes the handle's frame turned so the
   * palm faces into the object and the forward runs along the wrapped axis.
   *
   * @param body The body.
   * @param side The hand.
   * @param surface The surface.
   * @param target The world frame.
   * @param form The hand shape.
   * @returns The wrist point and the rotation.
   */
  export function reach(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    surface: IAutoMovieMotionHumanHand.Surface,
    target: IAutoMovieMotionHumanHand.IFrame,
    form: IAutoMovieMotionHumanHand.Shape = "relaxed",
  ): IAutoMovieMotionHumanHand.IWrist {
    const local: IAutoMovieMotionHumanHand.IFrame = offset(
      body,
      side,
      surface,
      form,
    );
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
   * @param form The hand shape the pose holds; it matters only for a digit's
   *   tip or pad.
   * @returns The world frame.
   */
  export function frame(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<
      AutoMovieHumanoidBone,
      Pick<IAutoMovieResolvedBone, FrameBonesEntry>
    >,
    side: AutoMovieHumanSide,
    surface: IAutoMovieMotionHumanHand.Surface,
    form: IAutoMovieMotionHumanHand.Shape = "relaxed",
  ): IAutoMovieMotionHumanHand.IFrame {
    return readHumanHandFrame(
      body,
      bones,
      side,
      surface,
      (): IAutoMovieMotionHumanHand.IFrame => offset(body, side, surface, form),
      digital(surface),
    );
  }

  /**
   * Actual hand and body-declared digit-region bones consumed by frame,
   * including custom/fallback region metadata.
   */
  export function frameBones(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    surface: IAutoMovieMotionHumanHand.Surface,
  ): ReadonlySet<AutoMovieHumanoidBone> {
    return readHumanHandFrame.bones(body, side, surface, digital(surface));
  }

  /**
   * Prepare fixed body/side/surface/form point geometry; current bones return
   * fresh points, while digits keep complete original frame seating.
   */
  export function preparePoint(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    surface: IAutoMovieMotionHumanHand.Surface,
    form: IAutoMovieMotionHumanHand.Shape = "relaxed",
  ): ReturnType<typeof readHumanHandFrame.preparePoint> {
    return readHumanHandFrame.preparePoint(
      body,
      side,
      surface,
      (): IAutoMovieMotionHumanHand.IFrame => offset(body, side, surface, form),
      digital(surface),
    );
  }
}

/**
 * Canonical left rest directions; inverse admission remains lazy and
 * world-first.
 */
const LEFT_ROTATION: ReturnType<typeof alignHumanHandSurface.prepare> =
  alignHumanHandSurface.prepare({
    normal: { x: 1, y: 0, z: 0 },
    forward: { x: 0, y: -1, z: 0 },
  });

/** Canonical right rest directions; no world frame or result is retained. */
const RIGHT_ROTATION: ReturnType<typeof alignHumanHandSurface.prepare> =
  alignHumanHandSurface.prepare({
    normal: { x: -1, y: 0, z: 0 },
    forward: { x: 0, y: -1, z: 0 },
  });
