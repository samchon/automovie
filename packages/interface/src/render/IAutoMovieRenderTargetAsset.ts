/**
 * One canonical asset path and exact byte identity in a render target
 * dependency closure.
 */
export interface IAutoMovieRenderTargetAsset {
  /**
   * Canonical project-relative path supplied by the caller; sealing only checks
   * that the exact string is nonblank and unique.
   */
  path: string;

  /** SHA-256 of the exact bytes the frame will read. */
  digest: string;
}
