import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMoviePose } from "../../../pose/IAutoMoviePose";
import type { IAutoMoviePoseResolution } from "../../../pose/IAutoMoviePoseResolution";
import type { IAutoMovieMotionHumanBody } from "../body/IAutoMovieMotionHumanBody";
import type { IAutoMovieMotionHumanBend } from "../everyday/IAutoMovieMotionHumanBend";
import type { IAutoMovieMotionHumanHand } from "../posture/IAutoMovieMotionHumanHand";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";
import type { IAutoMovieMotionHumanArmAngles } from "./IAutoMovieMotionHumanArmAngles";
import type { IAutoMovieMotionHumanArmPlanned } from "./IAutoMovieMotionHumanArmPlanned";

/**
 * An arm carried to a place of the air: the hand surface laid on a point
 * with a facing, the arm's reach, hold and return planned as one
 * trajectory over the span the law states (`AutoMovieMotionHumanArm.carried`)
 * and the fingers shaped by the weight; without a span, the deprecated
 * joint-space carry by the weight. The exercise, stretching, dance and
 * sport laws place their arms this way, at named grid places of the body
 * (`AutoMovieMotionHumanTargetGrid.place`) moved by their own curves.
 *
 * @evidence contracts/development/common.md#meaningful-documentation from: Seconds since the action's start the arm is written from. to: Seconds since the action's start the arm is written until. span: The action's instants the arm's whole action is planned over, the reach to the place, the hold on it and the return (`AutoMovieMotionHumanArm.carried`'s `span`), in the law's clock instants or as the weight states them (`AutoMovieMotionHumanArm.stated`); the deprecated joint-space carry when absent.
 * @evidence contracts/development/design.md#principled-representation from: Seconds since the action's start the arm is written from. to: Seconds since the action's start the arm is written until. span: The action's instants the arm's whole action is planned over, the reach to the place, the hold on it and the return (`AutoMovieMotionHumanArm.carried`'s `span`), in the law's clock instants or as the weight states them (`AutoMovieMotionHumanArm.stated`); the deprecated joint-space carry when absent.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: compose/AutoMovieMotionHumanPlaced.ts (AutoMovieMotionHumanPlaced.arm, props); exercise/workout.ts (workout.plan, return); compose/AutoMovieMotionHumanPlaced.ts (AutoMovieMotionHumanPlaced.wrist, place).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanBody, AutoMovieHumanSide, IAutoMovieMotionHumanArmAngles.IAngles, IAutoMovieMotionHumanArmPlanned.ISpan, IAutoMovieMotionHumanPosture, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanPlaced {
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
    body: IAutoMovieMotionHumanBody;

    /** The arm. */
    side: AutoMovieHumanSide;

    /** Seconds since the action's start the arm is written from. */
    from: number;

    /** Seconds since the action's start the arm is written until. */
    to: number;

    /** The arm's angles at weight 0. */
    rest: IAutoMovieMotionHumanArmAngles.IAngles;

    /**
     * How far the arm is from its rest to the place.
     *
     * @param seconds Seconds since the action's start.
     * @returns The weight in [0, 1]: 0 leaves the arm at `rest`, 1 lays the hand on the place.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the argument's origin, the range and what both ends of the range mean.
     */
    weight(seconds: number): number;

    /** The action's instants the arm's whole action is planned over, the reach to the place, the hold on it and the return (`AutoMovieMotionHumanArm.carried`'s `span`), in the law's clock instants or as the weight states them (`AutoMovieMotionHumanArm.stated`); the deprecated joint-space carry when absent. */
    span?: IAutoMovieMotionHumanArmPlanned.ISpan;

    /** A planned arm group when both hands reach the same site together. */
    together?: IAutoMovieMotionHumanArmPlanned.ITogether;

    /**
     * The place at a second.
     *
     * @param posture The posture written so far in this frame.
     * @param seconds Seconds since the action's start.
     * @returns The point in world metres, the unit direction the surface faces (its normal, pointing away from the surface) and, when the hand's fingers must point a given way, that unit direction.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States current posture/relative seconds, world-metre point, outward unit facing and optional forward; optional FK/ROM loans belong only to this same-person invocation and must not be stored.
     */
    place(
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
      resolution?: IAutoMoviePoseResolution.ISource,
      projection?: (pose: IAutoMoviePose) => IAutoMoviePose,
    ): IPlace;

    /** The hand surface; the palm when absent. */
    surface?: IAutoMovieMotionHumanHand.Surface;

    /** The hand's shape; flat when absent. */
    shape?: IAutoMovieMotionHumanHand.Shape;

    /** The elbow's preset; the solved least-strain place when absent. */
    bend?: IAutoMovieMotionHumanBend.Arm;
  }

  /**
   * A hand-surface target placed in world coordinates.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The point uses world metres. Facing and optional finger direction orient the hand.
   * @evidence contracts/development/design.md#principled-representation World position is independent of orientation. The caller supplies usable directions.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The hand placer needs the point and facing. Forward constrains finger direction when supplied.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts All three quantities reuse the shared vector type without imposing a preset hand pose.
   */
  export interface IPlace {
    /** Desired hand-surface point in world metres. */
    point: IAutoMovieVector3;
    /** Desired hand-surface normal in world coordinates. */
    facing: IAutoMovieVector3;
    /** Preferred fingers direction; absent uses the default facing construction. */
    forward?: IAutoMovieVector3;
  }

  /**
   * Where the wrist stands when a hand surface lies on a place. Input place of AutoMovieMotionHumanPlaced.wrist. The point, the direction the surface faces and where the fingers point.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Forward supplies the preferred world-space direction of the fingers as a required part of the wrist construction.
   * @evidence contracts/development/design.md#principled-representation The target point and surface normal come from IPlace. The additional required direction completes the wrist's orientation frame.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: compose/AutoMovieMotionHumanPlaced.ts (AutoMovieMotionHumanPlaced.wrist, place).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IWristPlace extends IPlace {
    /** Preferred fingers direction in world coordinates. */
    forward: IAutoMovieVector3;
  }
}
