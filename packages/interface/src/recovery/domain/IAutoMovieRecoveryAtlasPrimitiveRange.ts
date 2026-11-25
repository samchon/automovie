/** Retained triangle interval and chart bounds for one atlas patch. */

export interface IAutoMovieRecoveryAtlasPrimitiveRange {
  /** Generating patch identity. */
  patch: string;

  /** First triangle ordinal in the generated mesh. */
  firstTriangle: number;

  /** Number of consecutive retained triangles. */
  triangleCount: number;

  /** Lower local U bound. */
  u0: number;

  /** Upper local U bound. */
  u1: number;

  /** Lower local V bound. */
  v0: number;

  /** Upper local V bound. */
  v1: number;

  /** Retained field approximation bound in millimetres. */
  approximationBoundMm: number;
}
