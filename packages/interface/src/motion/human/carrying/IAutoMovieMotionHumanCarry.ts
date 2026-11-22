import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";
import type { IAutoMovieMotionHumanGait } from "../next/IAutoMovieMotionHumanGait";

/**
 * Walking to a floor point while carrying a load or pushing a wheeled one:
 * a bag in one hand, a box in both hands before the body, a child on the
 * hip, or a cart or stroller pushed by its handle.
 *
 * The walk is the walk law's own (`walk.plan`), the base every unclaimed
 * channel keeps, so footfalls, pelvis and the free arm's swing are the
 * walk's; the load claims the arms that hold it, which stop swinging (arm
 * swing is suppressed on the loaded side), and leans the trunk by its mass,
 * a share of the body's mass in [0, 0.25] (the issue's band):
 *
 * - `oneHand`: the loaded arm hangs straight beside the body with the hand
 *   closed on the handle, and the trunk leans laterally away from the load
 *   (Zhang, Ye and Wang 2010, Comput Methods Biomech Biomed Engin 13:339).
 * - `twoHands`: both palms press the sides of a box as wide as 0.8 of the
 *   shoulders, held at waist height a third of the arm before the root, and
 *   the trunk leans back over it (Chaffin et al. 2006's front load).
 * - `hip`: the hand of the hip side lies palm up under the child's seat
 *   before that hip, and the trunk leans away to the other side.
 * - `push`: both hands grip a handle at the elbow's height 0.6 of the arm
 *   before the root, a shoulder width apart, and the trunk leans forward
 *   (Hoozemans et al. 1998 on handle height in pushing).
 *
 * Each lean is `LEAN` degrees per unit of the load's mass share
 * (provisional: no located study gives the slope), shared between the chest
 * and the spine, and grows in over the first `RAMP` seconds. The load
 * itself is not a prop yet, so no grip window is declared. Events: the
 * walk's. An overlay may take the head and, under a one-hand or hip load,
 * the free arm and hand (the plan's `yields`), so a wave or a phone rides a
 * carry as it rides a walk.
 *
 * Not yet: shoulder straps, backpacks, overhead and head loads, a level
 * tray, the child in the arms, on the shoulders or in a carrier, pulling a
 * trolley or a suitcase, the cart as a moving support (A2), changing hands
 * (`shiftLoad`) and the frozen hand offset of a held prop.
 *
 * @evidence contracts/development/common.md#meaningful-documentation to: The floor point walked to, world metres. hand: The loaded side for `oneHand` and `hip`; `right` when absent. load: The load's mass as a share of the body's, in [0, 0.25]; 0.1 when absent. Inclusive minimum: 0. Inclusive maximum: 0.25. Unit: dimensionless.
 * @evidence contracts/development/design.md#principled-representation to: The floor point walked to, world metres. hand: The loaded side for `oneHand` and `hip`; `right` when absent. load: The load's mass as a share of the body's, in [0, 0.25]; 0.1 when absent. Inclusive minimum: 0. Inclusive maximum: 0.25. Unit: dimensionless.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: carrying/carry.ts (carry.place, how); carrying/carry.ts (carry.place, return); carrying/carry.ts (carry.plan, context); chain/HumanChainTravel.ts (HumanChainTravel.carry, params); carrying/carry.ts (carry.tilt); carrying/carry.ts (carry.plan).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3, AutoMovieHumanSide, IAutoMovieMotionHumanGait.WalkPace and IAutoMovieMotionManner identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanCarry {
  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit and default.
   * @evidence contracts/development/design.md#principled-representation The walk's destination, pace and manner, the way of carrying, the side and the load's mass share.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Six members read by `plan`; the manner's type is the walk's.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No hand place is typed.
   */
  export interface IParams {
    /** The floor point walked to, world metres. */
    to: IAutoMovieVector3;

    /** How the load is held. */
    kind: IAutoMovieMotionHumanCarry.How;

    /** The loaded side for `oneHand` and `hip`; `right` when absent. */
    hand?: AutoMovieHumanSide;

    /** The load's mass as a share of the body's, in [0, 0.25]; 0.1 when absent. */
    load?: number;

    /** The walk's pace (`IAutoMovieMotionHumanWalkParams.pace` gives the speeds); `normal` when absent. The load leans the trunk and does not change the speed. */
    pace?: IAutoMovieMotionHumanGait.WalkPace;

    /** How the walk is performed, read as the walk reads it (`IAutoMovieMotionHumanWalkParams.manner`); neutral when absent. */
    manner?: IAutoMovieMotionManner;
  }

  /**
   * How the load is held: in one hand, in both hands, on the hip, or pushed on wheels.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the four ways a load is held.
   * @evidence contracts/development/design.md#principled-representation Closed choices "oneHand", "twoHands", "hip", "push" distinguish the admitted cases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: carrying/carry.ts (carry.place, how); carrying/carry.ts (carry.tilt); carrying/carry.ts (carry.plan).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in carry.place.
   */
  export type How = "oneHand" | "twoHands" | "hip" | "push";

  /**
   * A hand's hold place in the performer's moving floor frame. Result returned by carry.place. The point and the outward normal of the place, world, or undefined for a free hand.
   *
   * @evidence contracts/development/common.md#meaningful-documentation point: Carrying contact point in world metres. normal: Outward normal of the contacted surface in world coordinates.
   * @evidence contracts/development/design.md#principled-representation point: Carrying contact point in world metres. normal: Outward normal of the contacted surface in world coordinates.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: carrying/carry.ts (carry.place, return).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export type IPlaceResult =
    | {
        /** Carrying contact point in world metres. */
        point: IAutoMovieVector3;
        /** Outward normal of the contacted surface in world coordinates. */
        normal: IAutoMovieVector3;
      }
    | undefined;
}
