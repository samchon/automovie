/**
 * Counters for one yielded local Hermite chunk. The generator allocates a fresh
 * record for each chunk; values describe actual emission, including work
 * preceding a local failure, rather than a certificate of surface regularity.
 */
export type IAutoMovieLocalHermiteStream64Counts = {
  /**
   * Leaves whose first face range starts in this chunk. A leaf continued from
   * an earlier chunk contributes ranges but does not increment this count
   * again.
   */
  cells: number;

  /**
   * Newly appended render vertices, excluding reuse of earlier published
   * indices. Vertices may remain even when their proposed triangle is omitted.
   */
  vertices: number;

  /**
   * Accepted positive finite-area triangles appended to this chunk's index
   * array.
   */
  triangles: number;

  /**
   * Candidate triangles whose metre-space cross-product magnitude is exactly
   * zero. Nonfinite area stops interval emission and is reported as an
   * arithmetic failure instead.
   */
  omittedZeroAreaTriangles: number;

  /**
   * Newly emitted vertices whose analytic cross-product normal has zero or
   * nonfinite length; the published normal is [0,0,0].
   */
  unresolvedVertexNormals: number;

  /**
   * Largest leaf Taylor estimate represented by a face range in this chunk, in
   * millimetres; zero when no range was accumulated, not an outward-rounded
   * certificate.
   */
  maxErrorBoundMm: number;
};
