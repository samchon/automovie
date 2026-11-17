import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionHumanHand } from "../posture/IAutoMovieMotionHumanHand";

/**
 * What touches in a touch: a hand surface, or the tip of a tool the hand
 * holds, stated in the hand's anatomical axes (where the fingers point, where
 * the palm faces and where the thumb points at rest) as shares of the hand's
 * length, so a held cup's rim or a spoon's bowl is placed on the mouth
 * without a prop. Also the effector's displayed point the verdicts read, the
 * skin's stand-off from the hand's own colliders and the arm goal that lays
 * the effector on a contact point.
 *
 * @evidence contracts/development/common.md#meaningful-documentation tool: A held tool's tip from the surface, shares of the hand's length along each axis; none when absent. facing: The direction of the hand turned into the region; the surface's own normal when absent. along: The direction of the hand laid along the region's tangent; the surface's own forward when absent.
 * @evidence contracts/development/design.md#principled-representation tool: A held tool's tip from the surface, shares of the hand's length along each axis; none when absent. facing: The direction of the hand turned into the region; the surface's own normal when absent. along: The direction of the hand laid along the region's tangent; the surface's own forward when absent.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: compose/AutoMovieMotionHumanTouchDrink.ts (AutoMovieMotionHumanTouchDrink.drinking, effector); compose/AutoMovieMotionHumanTouchDrink.ts (AutoMovieMotionHumanTouchDrink.admitted, effector); compose/AutoMovieMotionHumanTouchDrink.ts (AutoMovieMotionHumanTouchDrink.held, effector); compose/AutoMovieMotionHumanTouchDrink.ts (AutoMovieMotionHumanTouchDrink.trial, effector); compose/AutoMovieMotionHumanTouchEffector.ts (AutoMovieMotionHumanTouchEffector.local, effector); compose/AutoMovieMotionHumanTouchEffector.ts (AutoMovieMotionHumanTouchEffector.point, effector).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanHand.Surface, IAutoMovieMotionHumanHand.Shape, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanTouchEffector {
  /**
   * An effector.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, unit and default.
   * @evidence contracts/development/design.md#principled-representation A surface, a shape, an optional tool offset and the two directions laid against the region.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Five members read by `local`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Without the axes a surface uses its own normal and forward, so a bare skin row states nothing extra.
   */
  export interface IEffector {
    /** The hand surface. */
    surface: IAutoMovieMotionHumanHand.Surface;

    /** The hand's shape. */
    shape: IAutoMovieMotionHumanHand.Shape;

    /** A held tool's tip from the surface, shares of the hand's length along each axis; none when absent. */
    tool?: Partial<Record<"fingers" | "palm" | "thumb", number>>;

    /** The direction of the hand turned into the region; the surface's own normal when absent. */
    facing?: IAutoMovieMotionHumanTouchEffector.Direction;

    /** The direction of the hand laid along the region's tangent; the surface's own forward when absent. */
    along?: IAutoMovieMotionHumanTouchEffector.Direction;

    /** Extra flexion of the fingers over the shape, degrees, as the touch's kind curls them (`AutoMovieMotionHumanTouchForm.curled`); none when absent. */
    curl?: number;
  }

  /**
   * A direction of the hand: one of its axes, or a blend of the three
   * anatomical ones by weight, normalised, for a direction between them:
   * fingertips brought to the lips point half toward the face and half up
   * it (`{ fingers: 1, palm: 1 }` turned into the region), and a held prop's
   * own axis lies wherever the grip put it. Weights name anatomical axes, so
   * a left and a right hand state the same direction.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two forms, what a blend is for and why it is side-free.
   * @evidence contracts/development/design.md#principled-representation Any direction in the hand's frame is a combination of its three orthogonal axes; the record states the combination and `direction` normalises it.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One alias, read by the effector's two laid directions.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No raw bone-space vector, which would mean opposite things on the two hands; all weights zero is refused by `direction`.
   */
  export type Direction =
    | IAutoMovieMotionHumanTouchEffector.Axis
    | Partial<Record<"fingers" | "palm" | "thumb", number>>;

  /**
   * A hand axis at rest: the fingers' direction, the palm's facing, the
   * thumb's, or the axis of a cylinder the fist holds (`grasp`), or their
   * opposites. A held cylinder lies obliquely across the palm, from the heel
   * on the little finger's side to the index finger's knuckle (Napier 1956),
   * so its axis is the thumb's leaned toward the fingers.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the anatomical directions, what the grasp axis is and that a leading minus is the opposite.
   * @evidence contracts/development/design.md#principled-representation The hand's three anatomical axes, the power grip's oblique axis and their negatives, the directions a held tool or a surface can point in the hand's rest frame.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Eight literals, the entries of `AXES`, read by `axis` and, through `Direction`, by the effector's two laid directions; the tool offset weights the three anatomical axes directly.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Anatomical names, not bone-space x, y and z, so a left and a right hand state the same effector.
   */
  export type Axis = (readonly [
    "fingers",
    "palm",
    "thumb",
    "grasp",
    "-fingers",
    "-palm",
    "-thumb",
    "-grasp",
  ])[number];

  /**
   * The effector's point relative to the wrist joint and its facing and along directions, all in the hand's rest frame. Result returned by AutoMovieMotionHumanTouchEffector.local. The point, metres, and two unit directions.
   *
   * @evidence contracts/development/common.md#meaningful-documentation point: Effector point in its bone-local frame, metres.
   * @evidence contracts/development/design.md#principled-representation point: Effector point in its bone-local frame, metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: compose/AutoMovieMotionHumanTouchEffector.ts (AutoMovieMotionHumanTouchEffector.local, return).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export type ILocalResult = {
    /** Effector point in its bone-local frame, metres. */
    point: IAutoMovieVector3;
    /** Effector surface normal in its bone-local frame. */
    normal: IAutoMovieVector3;
    /** Effector forward tangent in its bone-local frame. */
    forward: IAutoMovieVector3;
  };
}
