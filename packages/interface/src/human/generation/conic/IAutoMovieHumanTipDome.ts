/**
 * Public contracts for distal cap support.
 */
export namespace IAutoMovieHumanTipDome {
  /**
   * Where a dome begins.
   */
  export interface IStart {
    /** The station the cap starts at, mm. */
    from: number;

    /**
     * Whether the dome was held at the earliest station it may start from: the part is shorter there than its dome's proportion asks,
     * and the cap then starts at `least` with a shorter dome than the share's.
     */
    held: boolean;
  }
}
