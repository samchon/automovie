import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanBody } from "./IAutoMovieMotionHumanBody";

/**
 * A hand brought to a target: which wrist point and hand rotation put a chosen
 * hand surface (the palm, the grip centre, the fist, the back of the hand, a
 * digit's tip or pad, or the wrist itself) on a world frame, under a stated
 * hand shape, and where that surface is on a displayed pose.
 *
 * This is how procedural animation authors a hand contact: the effector is a
 * socket on the hand, the goal is a point and an orientation in the world, and
 * inverse kinematics solves the arm (Rosen, GDC 2014, "Animation Bootcamp: An
 * Indie Approach to Procedural Animation"). The arm solver places
 * the wrist joint, so the wrist goal is the target point less the surface's
 * offset from the wrist turned by the hand's rotation, the same rigid relation
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
 * `IAutoMovieHumanLimbGoal.rotation` and `fitChainToTarget`'s
 * `effectorRotation` take. It is built by aligning two directions:
 * {@link HumanHand.align} turns a surface's rest normal onto a world normal
 * exactly and its rest forward onto a world forward as closely as a direction
 * across the normal allows; {@link HumanHand.rotation} does the same for the
 * anatomical pair of where the fingers point and where the palm faces (rest:
 * left fingers +X, right fingers -X, both palms -Y, `AutoMovieEngineHumanoidRestFrame`).
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
 *   `AutoMovieEngineDefaultHumanoidRom`), and the thumb's proximal 40 and distal 50 degrees
 *   across the curled fingers.
 *
 * The arm solver (`fitChainToTarget`) gives the forearm the share of an asked
 * hand rotation that turns about the forearm's length, within its range of
 * pronation and supination, and the wrist the rest by flexion and deviation. A
 * rotation beyond either range is clamped and its surface lands off the point
 * by the clamped share; {@link HumanHand.frame} reads where the surface actually
 * lands, so audits report that residual. Asked about 140 degrees or more of
 * forearm turn away from the hand's own rotation at its place, the nearer limit
 * changes sides and the hand with it, so a law keeps an asked rotation on one
 * side of that across its instants (`test_human_motion_core_hand_rotation`).
 */
export namespace IAutoMovieMotionHumanHand {
  /** A surface of the hand brought to a target. */
  export type Surface = (readonly [
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
  ])[number];

  /**
   * The finger joints of a hand on its way to a shape. A hand shape: `relaxed`,
   * `flat`, `point`, `fist`, or `bridge`, a sprinter's set hand on its
   * fingertips with the thumb at its neutral beside the forefinger.
   */
  export type Shape = (readonly [
    "relaxed",
    "flat",
    "point",
    "fist",
    "bridge",
  ])[number];

  /** A wrist goal: the point and the rotation the arm solver takes. */
  export interface IWrist {
    /** The wrist joint, world metres. */
    point: IAutoMovieVector3;

    /** The hand's world rotation from its rest. */
    rotation: IAutoMovieQuaternion;
  }

  /** One hand's shaping over a window. */
  export interface IShape {
    /** The hand. */
    side: AutoMovieHumanSide;

    /** The shape at weight 1. */
    shape: IAutoMovieMotionHumanHand.Shape;

    /**
     * Extra flexion of every finger joint over the shape, degrees; 0 when
     * absent.
     */
    curl?: number;

    /** Seconds since the action's start from which the hand is written. */
    from: number;

    /** Seconds since the action's start until which the hand is written. */
    to: number;

    /**
     * How far the hand is from the relaxed cascade to the shape.
     *
     * @param seconds Seconds since the action's start.
     * @returns A value in [0, 1].
     */
    weight(seconds: number): number;
  }

  /** A surface on a digit's distal phalanx: its tip or its pad. */
  export type DigitSurface = (readonly [
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
  ])[number];

  /** A frame: a point with an outward unit normal and a unit forward across it. */
  export interface IFrame {
    /** Point, metres. */
    point: IAutoMovieVector3;

    /** Outward unit normal. */
    normal: IAutoMovieVector3;

    /**
     * Unit forward, perpendicular or not to the normal; only its component
     * across the normal is used.
     */
    forward: IAutoMovieVector3;
  }

  /** How a hand is turned, in world directions. */
  export interface IOrientation {
    /**
     * Where the fingers point, from the wrist toward the middle knuckle; any
     * non-zero vector.
     */
    fingers: IAutoMovieVector3;

    /** Where the palm faces; any vector not parallel to `fingers`. */
    palm: IAutoMovieVector3;
  }

  /**
   * A direction of the performer's floor frame: `out` is away from the midline
   * on the acting hand's side and `in` toward it, so one name serves both
   * hands.
   */
  export type Axis = (readonly [
    "out",
    "in",
    "up",
    "down",
    "forward",
    "back",
  ])[number];

  /**
   * A direction on one of three rungs: an axis, a share of the way between two
   * axes, or explicit components (out, up and forward of the acting side; any
   * non-zero length) with where they come from.
   */
  export type Direction =
    | IAutoMovieMotionHumanHand.Axis
    | {
        /** The two axes; they must not be opposite. */
        between: readonly [
          IAutoMovieMotionHumanHand.Axis,
          IAutoMovieMotionHumanHand.Axis,
        ];

        /** How far from the first to the second, in [0, 1]. */
        share: number;
      }
    | {
        /** The components. */
        explicit: {
          /**
           * Unitless component away from the performer's midline on the acting
           * side.
           */
          out: number;
          /** Unitless upward component in the performer's facing frame. */
          up: number;
          /** Unitless forward component in the performer's facing frame. */
          forward: number;
        };

        /** A citation, or `provisional: <capture case name>`. */
        source: string;
      };

  /** How a hand is turned, by named directions. */
  export interface IFacing {
    /** Where the fingers point. */
    fingers: IAutoMovieMotionHumanHand.Direction;

    /** Where the palm faces; not parallel to `fingers`. */
    palm: IAutoMovieMotionHumanHand.Direction;
  }

  /**
   * The strain `solve` ranks elbow places by, for a limb fit that takes its
   * elbow's hint from its own swivel sweep (`fitChainToTarget`'s `strain`): the
   * fit's legal candidate of least strain is the place `solve` would take, read
   * on the fit's own chain. Input props of AutoMovieMotionHumanBend.strainOf.
   * The body, the arm and the hand's world rotation, when its turn counts as
   * strain.
   */
  export type IStrainOfProps = {
    /**
     * Borrowed body whose shoulder, elbow and wrist geometry define the arm-fit
     * strain.
     */
    body: IAutoMovieMotionHumanBody;
    /** Arm side whose elbow placement is ranked by strain. */
    side: AutoMovieHumanSide;
    /**
     * Optional desired hand world rotation whose turn contributes to strain;
     * omitted excludes that requested hand-turn contribution.
     */
    rotation?: IAutoMovieQuaternion | undefined;
  };
}
