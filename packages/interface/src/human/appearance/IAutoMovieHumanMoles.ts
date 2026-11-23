/**
 * Authorable melanocytic nevi (moles and beauty marks) over the whole skin;
 * counts and sizes are artistic conventions, not clinical population
 * statistics.
 */
export interface IAutoMovieHumanMoles {
  /**
   * Expected number of marks over the whole body, 0 to 200; palms, soles and
   * lips take none. Schema constraints: Minimum: 0; Maximum: 200; retained by
   * Human's schema refinement.
   */
  count: number;

  /**
   * Largest mark diameter in rest-surface millimetres, 1 to 6; diameters spread
   * down to a third of it. Schema constraints: Minimum: 1; Maximum: 6; retained
   * by Human's schema refinement.
   */
  diameterMm: number;

  /**
   * Pigment coverage from invisible (0) to a dark brown mark (1). Schema
   * constraints: Minimum: 0; Maximum: 1; retained by Human's schema
   * refinement.
   */
  contrast: number;
}
