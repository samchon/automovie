/**
 * Public contracts for directional section measurements.
 */
export namespace IAutoMovieHumanNativeSiteReaches {
  /**
   * A section's four reaches from its centre, mm, each positive.
   */
  export interface IReaches {
    /** Along `+u`. */
    front: number;

    /** Along `-u`. */
    back: number;

    /** Along `+v`. */
    lateral: number;

    /** Along `-v`. */
    medial: number;
  }

  /**
   * Where a depth and a breadth are split about the centre, each a share in (0, 1).
   */
  export interface IShares {
    /** The share of the depth that lies along `+u` of the centre. */
    front: number;

    /** The share of the breadth that lies along `+v` of the centre. */
    lateral: number;
  }
}
