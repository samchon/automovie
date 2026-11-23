/**
 * Data contracts of `checkAutoMovieExposureContinuity`, which compares each
 * cut's exposure with the previous cut of the same screenplay scene.
 */
export namespace IAutoMovieCheckExposureContinuity {
  /** The film's cuts in playing order, and the allowed jump. */
  export type IProps = {
    /** Cuts in the order the film plays them. */
    cuts: readonly ICut[];

    /**
     * Largest exposure difference, in stops, between consecutive cuts of one
     * group that is not reported; finite and at or above zero. Defaults to one
     * third of a stop.
     */
    tolerance?: number;
  };

  /** One cut and the exposure it was drawn at. */
  export type ICut = {
    /** The cut's sequence entry index; a safe integer, unique within `cuts`. */
    index: number;

    /**
     * The screenplay scene the cut belongs to, for example its slug. Only cuts
     * of one group are compared, so cross-cutting between two locations
     * compares each cut with the previous cut of its own location.
     */
    group: string;

    /** The cut's exposure value at ISO 100; finite. */
    ev100: number;

    /**
     * True when the screenplay decided an exposure change at this cut, such as
     * a light switched on: the cut is not reported, and later cuts of the group
     * compare with it.
     */
    change?: boolean;
  };

  /** An exposure jump between two consecutive cuts of one group. */
  export type IFinding = {
    /** The group both cuts belong to. */
    group: string;

    /** The earlier cut's sequence entry index. */
    previousIndex: number;

    /** The earlier cut's EV100. */
    previousEv100: number;

    /** The later cut's sequence entry index. */
    index: number;

    /** The later cut's EV100. */
    ev100: number;
  };
}
