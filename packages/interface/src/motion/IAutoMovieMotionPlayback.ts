/**
 * An already constructed motion evaluated at a second on its own clock. The
 * producer defines the value and valid times. Seeking and reordering reads
 * return the same value for the same inputs and placed state.
 */
export interface IAutoMovieMotionPlayback<
  TSample,
  TArguments extends readonly [seconds: number, ...context: unknown[]] = [
    seconds: number,
  ],
> {
  /** Evaluate the requested local second using the producer's prepared motion. */
  readonly sample: (...args: TArguments) => TSample;
}
