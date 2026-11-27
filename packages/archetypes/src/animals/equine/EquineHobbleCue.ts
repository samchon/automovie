import type { AutoMovieArchetypeEquineStanceCue } from "../AutoMovieArchetypeEquineStanceCue";

/**
 * The stance row of a hobbled equid: with its forelegs strapped together it
 * moves by short hops, both fores lifted and set down ahead together, the hinds
 * stepping up after them.
 */
export namespace EquineHobbleCue {
  /** Hops forward in a fore hobble. */
  export interface IHops extends AutoMovieArchetypeEquineStanceCue.IPhases {
    /** Discriminator. */
    kind: "hops";

    /** How many hops, a whole number from one. */
    count: number;

    /** How far each hop carries the hooves forward, metres, positive. */
    length: number;

    /**
     * The most the hobble's cuffs' middles may stand apart on the fore cannons
     * (`AutoMovieArchetypeEquineHobble.ABOVE` over the fetlocks), metres,
     * positive: the forelegs never stand farther apart there.
     */
    strap: number;
  }

  /** Any row of this family. */
  export type Row = IHops;
}
