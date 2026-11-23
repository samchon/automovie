/**
 * The durations in seconds of the six movement phases between a phrase's seven
 * synchronization instants. AutoMovieMotionClock.phrase admits and sums these
 * lengths.
 */
export interface IAutoMovieMotionPhraseDurations {
  /** From `start` to `ready`: the part leaves rest for where its stroke starts. */
  prepare: number;

  /** From `ready` to `strokeStart`: the part waits there; 0 when absent. */
  wait?: number;

  /** From `strokeStart` to `stroke`: the stroke up to its decisive instant. */
  attack: number;

  /** From `stroke` to `strokeEnd`: the stroke after it; 0 when absent. */
  follow?: number;

  /**
   * From `strokeEnd` to `relax`: the part stays where the stroke left it; 0
   * when absent.
   */
  hold?: number;

  /** From `relax` to `end`: the part returns to rest. */
  retract: number;
}
