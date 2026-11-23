/** Actual triangle range emitted for one declared domain. */
export interface IAutoMovieRecoveryDomainEmission {
  /** Identity of the output model part. */
  part: string;

  /** First triangle ordinal within the named part. */
  firstTriangle: number;

  /** Number of consecutive triangles in this range. */
  triangleCount: number;

  /** Named analytic patch, or null when unavailable. */
  patch: string | null;
}
