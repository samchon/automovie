import type { IAutoMovieMotionHumanBody } from "../body/IAutoMovieMotionHumanBody";
import type { IAutoMovieQuaternion } from "../../../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * A hand brought to a target: which wrist point and hand rotation put a
 * chosen hand surface (the palm, the grip centre, the fist, the back of the
 * hand, a digit's tip or pad, or the wrist itself) on a world frame, under a
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
 * the fingers; a digit's tip and pad take the palm normal as their forward.
 * The palm, grip, fist and back of the hand ride the hand bone and do not
 * depend on the fingers; a digit's tip and pad ride its distal phalanx, so
 * their frames are read by forward kinematics of the hand under the
 * requested shape and kept per body, surface and shape.
 *
 * A rotation is the hand's world rotation from its rest, the form
 * `IAutoMovieMotionHumanPosture.IGoal.rotation` and `fitChainToTarget`'s `effectorRotation`
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
 * - `relaxed`: the hand's position of rest, the fingers partly flexed at
 *   every joint (knuckles 35, middle joints 30, end joints 20 degrees) and
 *   the thumb's two hinges 25 each, measured from the straight finger of the
 *   canonical body; the stand law hangs the same hand;
 * - `flat`: every finger straight, an open palm (offer, stop, wave, a palm
 *   on a surface);
 * - `point`: the index straight, the other fingers curled as the fist and the
 *   thumb folded over them;
 * - `fist`: proximal phalanges 85, the middle 95 and the distal 90 degrees,
 *   the distal at the end of its range (80 to 90 in every located norm,
 *   `DEFAULT_HUMANOID_ROM`), and the thumb's proximal 40 and distal 50
 *   degrees across the curled fingers.
 *
 * The arm solver (`fitChainToTarget`) gives the forearm the share of an
 * asked hand rotation that turns about the forearm's length, within its
 * range of pronation and supination, and the wrist the rest by flexion and
 * deviation. A rotation beyond either range is clamped and its surface
 * lands off the point by the clamped share; {@link HumanHand.frame} reads
 * where the surface really is, so audits report that residual. Asked about
 * 140 degrees or more of forearm turn away from the hand's own rotation at
 * its place, the nearer limit changes sides and the hand with it, so a law
 * keeps an asked rotation on one side of that across its instants
 * (`test_human_motion_core_hand_rotation`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation point: The wrist joint, world metres. curl: Extra flexion of every finger joint over the shape, degrees; 0 when absent. from: Seconds since the action's start from which the hand is written.
 * @evidence contracts/development/design.md#principled-representation point: The wrist joint, world metres. curl: Extra flexion of every finger joint over the shape, degrees; 0 when absent. from: Seconds since the action's start from which the hand is written.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: actions/stand.ts (stand.plan, side); affordance/operateInsert.ts (operateInsert.tool, side); carrying/carry.ts (carry.place, side); carrying/carry.ts (carry.place, loaded); carrying/carry.ts (carry.plan, side); compose/AutoMovieMotionHumanArmAngles.ts (AutoMovieMotionHumanArmAngles.angles, side).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3, IAutoMovieQuaternion, IAutoMovieMotionHumanBody identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanHand {
  /**
   * A hand, or the side of any paired part.
   *
   * @evidence contracts/development/common.md#meaningful-documentation A hand, or the side of any paired part.
   * @evidence contracts/development/design.md#principled-representation Closed choices "left", "right" distinguish the admitted cases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: actions/stand.ts (stand.plan, side); affordance/operateInsert.ts (operateInsert.tool, side); carrying/carry.ts (carry.place, side); carrying/carry.ts (carry.place, loaded); carrying/carry.ts (carry.plan, side); compose/AutoMovieMotionHumanArmAngles.ts (AutoMovieMotionHumanArmAngles.angles, side).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in stand.plan.
   */
  export type Side = (readonly ["left", "right"])[number];

  /**
   * A surface of the hand brought to a target.
   *
   * @evidence contracts/development/common.md#meaningful-documentation A surface of the hand brought to a target.
   * @evidence contracts/development/design.md#principled-representation Closed choices "palm", "grip", "fist", "handBack", "indexTip", "wrist", "thumbTip", "thumbPad", "indexPad", "middleTip", "middlePad", "ringTip", "ringPad", "littleTip", "littlePad" distinguish the admitted cases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: compose/AutoMovieMotionHumanArmTarget.ts (AutoMovieMotionHumanArmTarget.origin, surface); compose/AutoMovieMotionHumanPlaced.ts (AutoMovieMotionHumanPlaced.wrist, surface); everyday/restClasped.ts (laid, surface); everyday/restClasped.ts (stacked, on); everyday/restClasped.ts (stacked, surface); everyday/restGoals.ts (restGoals.lay, surface).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The literal vocabulary is declared independently of runtime values; implementations are checked against this exact set.
   */
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
   * The finger joints of a hand on its way to a shape. A hand shape.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The finger joints of a hand on its way to a shape. A hand shape.
   * @evidence contracts/development/design.md#principled-representation Closed choices "relaxed", "flat", "point", "fist" distinguish the admitted cases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: compose/AutoMovieMotionHumanHand.ts (AutoMovieMotionHumanHand.fingers, shape); compose/AutoMovieMotionHumanHand.ts (AutoMovieMotionHumanHand.form, asked); compose/AutoMovieMotionHumanPlaced.ts (AutoMovieMotionHumanPlaced.wrist, shape); everyday/restClasped.ts (laid, shape); everyday/restGoals.ts (restGoals.lay, shape); posture/HumanHand.ts (HumanHand.shape, form).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The literal vocabulary is declared independently of runtime values; implementations are checked against this exact set.
   */
  export type Shape = (readonly ["relaxed", "flat", "point", "fist"])[number];

  /**
   * A wrist goal: the point and the rotation the arm solver takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation point: The wrist joint, world metres.
   * @evidence contracts/development/design.md#principled-representation point: The wrist joint, world metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: handling/HumanClasp.ts (HumanClasp.choose.fits, return); handling/HumanClasp.ts (HumanClasp.choose.fits, wrist); handling/HumanGrasp.ts (HumanGrasp.hand, return); handling/HumanGrasp.ts (HumanGrasp.reachable, goal); handling/HumanGrasp.ts (HumanGrasp.reachable, stroke); handling/HumanGrasp.ts (HumanGrasp.reachable, admits).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3, IAutoMovieQuaternion identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IWrist {
    /** The wrist joint, world metres. */
    point: IAutoMovieVector3;

    /** The hand's world rotation from its rest. */
    rotation: IAutoMovieQuaternion;
  }

  /**
   * One hand's shaping over a window.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, its unit and its value when absent.
   * @evidence contracts/development/design.md#principled-representation The span the hand is written over, the shape it goes to and how far it has gone.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Six members, all read by `shape`; `form` fills them from a clock.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The weight is a function of seconds and not a named easing.
   */
  export interface IShape {
    /** The hand. */
    side: IAutoMovieMotionHumanHand.Side;

    /** The shape at weight 1. */
    shape: IAutoMovieMotionHumanHand.Shape;

    /** Extra flexion of every finger joint over the shape, degrees; 0 when absent. */
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
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the argument and its origin, and that the result is a share in [0, 1].
     * @evidence contracts/development/implementation.md#principled-implementation The share is a pure function of the seconds, so any time course fits one member and the reader evaluates it at each second it needs.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One member read once per evaluated second by the function that writes the part; the builders from a clock fill it.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The reader clamps the result to [0, 1] instead of trusting the member, so an implementation that overshoots cannot push the part past its ends.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A declared member has no body, so it has no algorithm; the cost belongs to each implementation.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A declared member coordinates no work, so it shares none.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A declared member owns no state; what an implementation retains is stated by the function that builds it.
     */
    weight(seconds: number): number;
  }

  /**
   * A surface on a digit's distal phalanx: its tip or its pad.
   *
   * @evidence contracts/development/common.md#meaningful-documentation A surface on a digit's distal phalanx: its tip or its pad.
   * @evidence contracts/development/design.md#principled-representation Closed choices "thumbTip", "thumbPad", "indexTip", "indexPad", "middleTip", "middlePad", "ringTip", "ringPad", "littleTip", "littlePad" distinguish the admitted cases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: posture/HumanHand.ts (HumanHand.digital, return); posture/HumanHandShape.ts (HumanHandShape.tip, surface); posture/HumanHand.ts (HumanHand.DIGIT_SURFACES).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in HumanHand.digital.
   */
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

  /**
   * A frame: a point with an outward unit normal and a unit forward across it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation point: Point, metres.
   * @evidence contracts/development/design.md#principled-representation point: Point, metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: handling/pushSledStance.ts (pushSledStance.solved, handles); posture/HumanHand.ts (HumanHand.offset, return); posture/HumanHand.ts (HumanHand.align, rest); posture/HumanHand.ts (HumanHand.align, world); posture/HumanHand.ts (HumanHand.align.basis, frame); posture/HumanHand.ts (HumanHand.reach, target).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IFrame {
    /** Point, metres. */
    point: IAutoMovieVector3;

    /** Outward unit normal. */
    normal: IAutoMovieVector3;

    /** Unit forward, perpendicular or not to the normal; only its component across the normal is used. */
    forward: IAutoMovieVector3;
  }

  /**
   * How a hand is turned, in world directions.
   *
   * @evidence contracts/development/common.md#meaningful-documentation fingers: Where the fingers point, from the wrist toward the middle knuckle; any non-zero vector.
   * @evidence contracts/development/design.md#principled-representation fingers: Where the fingers point, from the wrist toward the middle knuckle; any non-zero vector.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: posture/HumanHand.ts (HumanHand.rotation, orientation).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IOrientation {
    /** Where the fingers point, from the wrist toward the middle knuckle; any non-zero vector. */
    fingers: IAutoMovieVector3;

    /** Where the palm faces; any vector not parallel to `fingers`. */
    palm: IAutoMovieVector3;
  }

  /**
   * A direction of the performer's floor frame: `out` is away from the
   * midline on the acting hand's side and `in` toward it, so one name serves
   * both hands.
   *
   * @evidence contracts/development/common.md#meaningful-documentation A direction of the performer's floor frame: `out` is away from the midline on the acting hand's side and `in` toward it, so one name serves both hands.
   * @evidence contracts/development/design.md#principled-representation Closed choices "out", "in", "up", "down", "forward", "back" distinguish the admitted cases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: posture/HumanHandDirection.ts (HumanHandDirection.of.axis, name); posture/HumanHand.ts (HumanHand.AXES).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in HumanHandDirection.of.axis.
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
   * A direction on one of three rungs: an axis, a share of the way between
   * two axes, or explicit components (out, up and forward of the acting
   * side; any non-zero length) with where they come from.
   *
   * @evidence contracts/development/common.md#meaningful-documentation between: The two axes; they must not be opposite. share: How far from the first to the second, in [0, 1]. explicit: The components.
   * @evidence contracts/development/design.md#principled-representation between: The two axes; they must not be opposite. share: How far from the first to the second, in [0, 1]. explicit: The components.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: everyday/gestureStroke.ts (gestureStroke.hand.facing, fingers); everyday/gestureStroke.ts (gestureStroke.hand.facing, palm); posture/HumanHand.ts (HumanHand.direction, direction); posture/HumanHandDirection.ts (HumanHandDirection.of, direction).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanHand.Axis identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
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
          /** Unitless component away from the performer's midline on the acting side. */
          out: number;
          /** Unitless upward component in the performer's facing frame. */
          up: number;
          /** Unitless forward component in the performer's facing frame. */
          forward: number;
        };

        /** A citation, or `provisional: <capture case name>`. */
        source: string;
      };

  /**
   * How a hand is turned, by named directions.
   *
   * @evidence contracts/development/common.md#meaningful-documentation fingers: Where the fingers point. palm: Where the palm faces; not parallel to `fingers`.
   * @evidence contracts/development/design.md#principled-representation fingers: Where the fingers point. palm: Where the palm faces; not parallel to `fingers`.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: posture/HumanHand.ts (HumanHand.facing, facing).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanHand.Direction identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IFacing {
    /** Where the fingers point. */
    fingers: IAutoMovieMotionHumanHand.Direction;

    /** Where the palm faces; not parallel to `fingers`. */
    palm: IAutoMovieMotionHumanHand.Direction;
  }

  /**
   * The strain `solve` ranks elbow places by, for a limb fit that takes its elbow's hint from its own swivel sweep (`fitChainToTarget`'s `strain`): the fit's legal candidate of least strain is the place `solve` would take, read on the fit's own chain. Input props of AutoMovieMotionHumanBend.strainOf. The body, the arm and the hand's world rotation, when its turn counts as strain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation body: Borrowed body whose shoulder, elbow and wrist geometry define the arm-fit strain.
   * @evidence contracts/development/design.md#principled-representation body: Borrowed body whose shoulder, elbow and wrist geometry define the arm-fit strain.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: compose/AutoMovieMotionHumanBend.ts (AutoMovieMotionHumanBend.strainOf, props).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanBody, IAutoMovieMotionHumanHand.Side, IAutoMovieQuaternion identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export type IStrainOfProps = {
    /** Borrowed body whose shoulder, elbow and wrist geometry define the arm-fit strain. */
    body: IAutoMovieMotionHumanBody;
    /** Arm side whose elbow placement is ranked by strain. */
    side: IAutoMovieMotionHumanHand.Side;
    /** Optional desired hand world rotation whose turn contributes to strain; omitted excludes that requested hand-turn contribution. */
    rotation?: IAutoMovieQuaternion | undefined;
  };
}
