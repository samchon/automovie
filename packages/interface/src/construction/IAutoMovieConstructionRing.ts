/** Data and callback contracts shared by the ConstructionRing operations. */
export namespace IAutoMovieConstructionRing {
  /**
   * Face/end identifiers and phase correspondence for a continuation's shared
   * ring.
   */
  export interface IRing {
    /** The host face's index in the body. */
    host: number;

    /** The host face's end station, mm. */
    hostStation: number;

    /**
     * The host face's cycle kind: `start` keeps the stations above a bottom
     * end, `end` those below a top end.
     */
    hostKind: "start" | "end";

    /** The part face's index in the body. */
    part: number;

    /** The part face's end station, mm. */
    partStation: number;

    /** The part face's cycle kind, as `hostKind`. */
    partKind: "start" | "end";

    /** Vertices of the ring: the host chain's ring samples. */
    count: number;

    /**
     * 1 when the part's stations continue the host's, -1 when they run against
     * them.
     */
    sign: 1 | -1;
  }
}
