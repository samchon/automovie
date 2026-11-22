import type { AutoMovieArchetypeEquineStanceCue } from "./AutoMovieArchetypeEquineStanceCue";

/**
 * The stance row of a hobbled equid: with its forelegs strapped together it moves by short hops, both fores lifted and set down ahead together, the hinds stepping up after them.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the movement a fore hobble leaves.
 * @evidence contracts/development/design.md#principled-representation One stance row joining the stance's cue union through `EquineStanceExtras`.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here and read by `EquineHobbleRows`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
 */
export namespace EquineHobbleCue {
  /**
   * Hops forward in a fore hobble.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The count, each hop's length and the strap's length, metres; the hops run through the entry and the exit settles where the last one landed.
   * @evidence contracts/development/design.md#principled-representation Phases, a whole count and two positive lengths.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The hop row; it ends standing where it hopped.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IHops extends AutoMovieArchetypeEquineStanceCue.IPhases {
    /** Discriminator. */
    kind: "hops";

    /** How many hops, a whole number from one. */
    count: number;

    /** How far each hop carries the hooves forward, metres, positive. */
    length: number;

    /** The most the hobble's cuffs' middles may stand apart on the fore cannons (`AutoMovieArchetypeEquineHobble.ABOVE` over the fetlocks), metres, positive: the forelegs never stand farther apart there. */
    strap: number;
  }

  /**
   * Any row of this family.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The hops.
   * @evidence contracts/development/design.md#principled-representation One member.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Joins `EquineStanceExtras.Row`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export type Row = IHops;
}
