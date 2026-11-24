/**
 * Nominal foot placement in its heel-to-toe chart. Runtime law remains in
 * AutoMovieHumanFootPlaces.
 */
export namespace IAutoMovieHumanFootPlaces {
  /** Normalized dorsal stations and heights, both in foot lengths. */
  export type Forefoot = readonly {
    /** Along-axis distance from the heel divided by foot length. */
    readonly share: number;
    /** Height above the floor divided by foot length. */
    readonly height: number;
  }[];

  /** Generated toe apex positions, ordered from the hallux to the little toe. */
  export type Toes = readonly {
    /** Along-axis reach from the heel divided by foot length. */
    readonly tip: number;
    /**
     * Signed transverse location about the foot course in nominal foot
     * breadths.
     */
    readonly across: number;
  }[];
}
