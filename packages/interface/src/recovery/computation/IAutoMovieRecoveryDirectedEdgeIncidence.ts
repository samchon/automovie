/**
 * One oriented triangle edge in an observed feature-cut mesh. a and b are
 * ordered vertex indices in the current observation mesh and face is its
 * triangle ordinal; the topology observer admits their bounds. Subdivision
 * changes this indexing, while separate source-face provenance preserves
 * original ownership.
 */
export type IAutoMovieRecoveryDirectedEdgeIncidence = {
  /** First endpoint index in the current observation mesh's vertex array. */
  a: number;

  /** Second endpoint index in that same vertex array. */
  b: number;

  /**
   * Triangle ordinal in the current observation mesh, before or after
   * subdivision.
   */
  face: number;
};
