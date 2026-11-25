/**
 * Pelvis orientation from upright standing, degrees. The pelvis is the root, so
 * these turn the whole body; they are not joint ranges (the hips limit the
 * pelvis only relative to the thighs), and the bounds are a convention.
 */
export interface IAutoMovieHumanPelvisPose {
  /**
   * Sagittal tilt: positive anterior (top of the pelvis forward), negative
   * posterior. Schema constraints: Minimum: -90; Maximum: 90; retained by
   * Human's schema refinement.
   */
  tilt?: number;

  /**
   * Frontal obliquity: positive raises the left iliac crest, negative the
   * right. Schema constraints: Minimum: -90; Maximum: 90; retained by Human's
   * schema refinement.
   */
  obliquity?: number;

  /**
   * Transverse rotation: positive turns the front toward the person's left.
   * Schema constraints: Minimum: -180; Maximum: 180; retained by Human's schema
   * refinement.
   */
  rotation?: number;
}
