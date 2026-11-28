/**
 * Fixed capture identity copied from an admitted image observation into the
 * fit. Both loft families keep these records in observation view order.
 */
export interface IAutoMovieRecoveryImageSource {
  /** View ID copied from the observation. */
  id: string;

  /** SHA-256 of the original encoded image bytes, copied from the observation. */
  sha256: string;
}
