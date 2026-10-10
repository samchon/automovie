/**
 * An actual external channel's binding to its body endpoint gain.
 */
export interface IAutoMovieHumanEndpointSourceDriver {
  /** Actual external channel identity. */
  channel: string;
  /** Body-owned endpoint whose gain it consumes. */
  endpoint: string;
  /** Positive endpoint declared by that actual external channel. */
  positive: string;
}
