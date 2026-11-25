/**
 * Chunk-local triangle attribution to one adaptive leaf of a local Hermite
 * field. A cell crossing a chunk boundary receives a separate range in each
 * chunk, and a range may contain no accepted triangles when all its candidates
 * collapse.
 */
export type IAutoMovieLocalHermiteStream64FaceRange = {
  /**
   * Generated root-cell ID, runName.interval.j.cell.k, shared by its adaptive
   * descendants; bounds identify the particular retained leaf.
   */
  patch: string;
  /**
   * Lower normalized cross-course cell coordinate; dimensionless and within
   * [0,1].
   */
  u0: number;
  /**
   * Upper normalized cross-course coordinate of the retained cell, greater than
   * u0.
   */
  u1: number;
  /**
   * Lower normalized longitudinal cell coordinate; dimensionless and within
   * [0,1].
   */
  t0: number;
  /**
   * Upper normalized longitudinal coordinate of the retained cell, greater than
   * t0.
   */
  t1: number;
  /**
   * Zero-based triangle offset in this chunk's index buffer, not a vertex index
   * or global face address.
   */
  triangleStart: number;
  /**
   * Number of accepted triangles attributed to this cell in the current chunk,
   * excluding omitted zero-area triangles.
   */
  triangleCount: number;
  /**
   * Number of candidate cell triangles omitted for exact zero area; omission is
   * recorded independently of the retained triangle count.
   */
  omittedZeroAreaTriangles: number;
};
