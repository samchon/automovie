/**
 * Original chart inputs for a bounded conic source joined to a wall.
 */
export namespace IAutoMovieHumanBoundSection {
  /**
   * One overlapping arc of the original boundary chart.
   */
  export interface IArc {
    /** Increasing unwrapped master-clock interval in radians, shorter than one turn. */
    clock: readonly [number, number];

    /** Strictly monotone chart coordinate throughout the interval, 0 for station and 1 for phase. */
    along: 0 | 1;

    /** Positive compact support half-width in the other coordinate's units, radians or millimetres. */
    width: number;
  }
}
