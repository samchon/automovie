/** Authoring inputs for one two-foot rope-skipping cycle in place. */
export namespace IAutoMovieMotionHumanRopeSkip {
  /** Timing of one stationary hop on level ground. */
  export interface IParams {
    /**
     * One period in seconds, strictly greater than the flight. Defaults to 1 /
     * 1.7. The ropeSkip planner requires distinct phase boundaries and interior
     * motion samples on both the action clock and the film clock.
     */
    periodSeconds?: number;

    /**
     * Both feet airborne for this many seconds in [0.12, 0.36]. Defaults to
     * 0.26.
     */
    flightSeconds?: number;
  }
}
