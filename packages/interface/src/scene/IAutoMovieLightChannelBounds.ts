/**
 * Per-component numeric bounds for one staged-light channel.
 */
export interface IAutoMovieLightChannelBounds {
  /** Lower bound. */
  min: number;

  /** Upper bound, `Infinity` for none. */
  max: number;

  /** Whether {@link min} itself is allowed (`false` for the spot cone). */
  inclusiveMin: boolean;
}
