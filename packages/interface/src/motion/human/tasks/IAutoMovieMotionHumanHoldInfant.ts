import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * Holding an infant taken up before (`pickUp` at its `seat`), standing or
 * seated as the body entered: in the cradle hold, against the shoulder with
 * the other hand patting its back, or feeding it from a bottle in the other
 * hand, optionally rocking it. Laying it down is `putDown` onto a cot's or a
 * pram's surface.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the holds, where the infant comes from and where it goes.
 * @evidence contracts/development/design.md#principled-representation A closed union of holds over one held infant.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The infant-hold law reads these inputs.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No infant size or hand place is typed; the infant's sites are its own.
 */
export namespace IAutoMovieMotionHumanHoldInfant {
  /**
   * The hold: `cradle` lays the infant across the front with its head in the
   * holding arm's crook and the other hand under its back; `shoulder` holds
   * it upright against the chest, its head by the holding side's shoulder,
   * the other hand patting its back; `feed` is the cradle with a bottle's
   * teat at its mouth from the other hand.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names each hold's arrangement.
   * @evidence contracts/development/design.md#principled-representation Closed choices, one per hold.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The infant-hold law dispatches on it.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Names the hold, not its geometry.
   */
  export type Hold = "cradle" | "shoulder" | "feed";

  /**
   * A gentle rocking of the held infant.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's unit.
   * @evidence contracts/development/design.md#principled-representation An amplitude and a frequency.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the infant-hold law.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Metres and hertz.
   */
  export interface IRock {
    /** How far the infant sways either way, metres. */
    amplitude: number;

    /** Sways per second, hertz. */
    frequency: number;
  }

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit and default.
   * @evidence contracts/development/design.md#principled-representation The hold, the held infant and the hold's own options.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the infant-hold law.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Seconds, hertz and prop subjects.
   */
  export interface IParams {
    /** The hold. */
    kind: Hold;

    /** The held infant's prop subject, taken up at its `seat` by `hand`. */
    prop: string;

    /** The holding hand; the hand that holds `prop` when absent. */
    hand?: AutoMovieHumanSide;

    /** Seconds the hold lasts once taken; 4 when absent. */
    hold?: number;

    /** A rocking of the held infant; none when absent. */
    rock?: IRock;

    /** Back pats a second in the shoulder hold; 1.5 when absent. */
    pats?: number;

    /** The bottle's prop subject, held in the other hand, for `feed`. */
    bottle?: string;
  }
}
