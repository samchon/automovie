/** Identity of one fixed image used by a fit. */
export interface IAutoMovieRecoveryImageSource {
  /** Fixed capture identity from the observation artifact. */
  id: string;

  /** Recorded SHA-256 of the original encoded image bytes. */
  sha256: string;
}
