import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * Authoring contracts for one staged liquid transfer between rigid props.
 * The pour law admits the geometry and the quantities before it plans the arm.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the scope and the owner of runtime admission.
 * @evidence contracts/development/design.md#principled-representation A pour combines rigid affordances, phase lengths in seconds, and conserved amounts in millilitres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Parameters are used by the registered action and by the action-local volume query.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses the canonical hand side and scene prop ids. No runtime geometry or model catalogue dependency enters the contract.
 */
export namespace IAutoMovieMotionHumanPour {
  /**
   * One pour staged with a stationary, upright recipient and a source held upright at entry.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Gives units, bounds, the supported prop features and the default hand.
   * @evidence contracts/development/design.md#principled-representation Prop ids reference authored affordances. The screenplay owns the amount released and the timing, and the recipient's capacity determines overflow.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One hand, two vessels, an angle and gap, the phase lengths and the volume inputs.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Amounts are explicitly authored because drinkware fill contributes to prop mass and supplies no mutable volume state.
   */
  export interface IParams {
    /** Held source subject with a rigid, upward-facing `lip` on a radial rim. */
    source: string;
    /** Fixed recipient subject with an upward `mouth` socket and a `lip` on its rim. */
    target: string;
    /** The hand already holding the source. Defaults to right. */
    hand?: AutoMovieHumanSide;
    /** Maximum tilt away from upright, degrees in [35, 90]. */
    tilt: number;
    /** Vertical gap from the recipient's mouth to the source's lip, metres in [0.04, 0.18]. */
    gap: number;
    /** Seconds per stage in [0.2, 3], up to 10 seconds in total. */
    timing: {
      /** Transport the source upright to the mouth. */
      approach: number;
      /** Rotate about the source's lip to the maximum tilt. */
      tip: number;
      /** Transfer liquid at the maximum tilt. */
      flow: number;
      /** Restore the source's upright attitude over the mouth. */
      right: number;
      /** Bring the upright source back to its entry pose. */
      retreat: number;
    };
    /** Finite nonnegative volume in the source at entry, millilitres. */
    sourceMl: number;
    /** Finite nonnegative volume in the recipient at entry, millilitres. */
    targetMl: number;
    /** Finite positive recipient capacity, millilitres. */
    capacityMl: number;
    /** Positive amount discharged, millilitres, at most the source's entry volume. */
    transferMl: number;
  }

  /**
   * Authored balance at a second of the pour, in millilitres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Identifies each quantity, its unit and its time.
   * @evidence contracts/development/design.md#principled-representation Three disjoint destinations account for the original volume.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Gives the two fills and accumulated overflow to callers sampling the liquid cue.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The balance is independent of frame rate, prop mass and playback history.
   */
  export interface ILiquid {
    /** Volume still in the source. */
    sourceMl: number;
    /** Volume in the recipient, at most its capacity. */
    targetMl: number;
    /** Cumulative volume spilled once the recipient filled. */
    spillMl: number;
  }
}
