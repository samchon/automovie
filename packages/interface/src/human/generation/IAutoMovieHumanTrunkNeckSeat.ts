/**
 * Type contracts exchanged by AutoMovieHumanTrunkNeckSeat; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanTrunkNeckSeat {
  /** The neck's bottom ring. */
  export interface ISeat {
    /** Mean height, mm. */
    y: number;

    /** Half width: the left side neck point's lateral place, mm. */
    width: number;

    /** Forward place of the widest point, mm. */
    middle: number;

    /** The ring's point on the front midline. */
    front: [number, number, number];

    /** The ring's point on the back midline. */
    back: [number, number, number];

    /**
     * Internal overlap ring's left lateral support; not a recovered public
     * side-neck landmark.
     */
    side: [number, number, number];

    /** The lateral outline's jet at the ring's bottom. */
    lateral: ILateral;
  }

  /**
   * The ring's lateral outline: the left extreme as a function of height at the
   * ring's bottom.
   */
  export interface ILateral {
    /** Height of the ring, mm. */
    y: number;

    /** Half width: the left extreme's lateral place, mm. */
    z: number;

    /** First derivative of the extreme with respect to height, mm per mm. */
    slope: number;

    /**
     * Second derivative of the extreme with respect to height, mm per mm
     * squared.
     */
    curvature: number;
  }
}
