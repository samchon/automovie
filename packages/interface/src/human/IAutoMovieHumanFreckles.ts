/**
 * Authorable freckle field; sizes and distribution are artistic conventions,
 * not clinical population statistics.
 */
export interface IAutoMovieHumanFreckles {
  /**
   * Expected marks per square centimetre of rest surface where freckling is
   * strongest (face, shoulders, upper chest and back), 0 to 40; less exposed
   * skin takes a fraction of it. Schema constraints: Minimum: 0; Maximum: 40;
   * retained by Human's schema refinement.
   */
  density: number;

  /**
   * Largest spot diameter in rest-surface millimetres, 2 to 6; diameters spread
   * down to a third of it, and the finite mark image softens spots near its
   * texel size. Schema constraints: Minimum: 2; Maximum: 6; retained by Human's
   * schema refinement.
   */
  diameterMm: number;

  /**
   * Pigment coverage from invisible (0) to full local pigment replacement (1).
   * Schema constraints: Minimum: 0; Maximum: 1; retained by Human's schema
   * refinement.
   */
  contrast: number;
}
