

/**
 * Counters for one yielded local Hermite chunk. The generator allocates a fresh
 * record for each chunk; values describe actual emission, including work preceding
 * a local failure, rather than a certificate of surface regularity.
 *
 * @evidence contracts/development/design.md#principled-representation Integer output counts are separate from the millimetre Taylor estimate; one cell is counted only on its first range across chunk boundaries.
 * @evidence contracts/development/design.md#minimal-and-owned-surface tessellateAutoMovieLocalHermite64 publishes these counters beside geometry and face ranges for chunk diagnostics.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Unnormalizable analytic normals remain zero and zero-area triangles are counted explicitly; no replacement geometry is credited.
 * @evidence contracts/development/common.md#meaningful-documentation Defines count scope, cell continuation, nonfinite-area failure and estimate limitations.
 */
export type IAutoMovieLocalHermiteStream64Counts = {
  /** Leaves whose first face range starts in this chunk. A leaf continued from an earlier chunk contributes ranges but does not increment this count again. */
  cells: number;

  /** Newly appended render vertices, excluding reuse of earlier published indices. Vertices may remain even when their proposed triangle is omitted. */
  vertices: number;

  /** Accepted positive finite-area triangles appended to this chunk's index array. */
  triangles: number;

  /** Candidate triangles whose metre-space cross-product magnitude is exactly zero. Nonfinite area stops interval emission and is reported as an arithmetic failure instead. */
  omittedZeroAreaTriangles: number;

  /** Newly emitted vertices whose analytic cross-product normal has zero or nonfinite length; the published normal is [0,0,0]. */
  unresolvedVertexNormals: number;

  /** Largest leaf Taylor estimate represented by a face range in this chunk, in millimetres; zero when no range was accumulated, not an outward-rounded certificate. */
  maxErrorBoundMm: number;
};
