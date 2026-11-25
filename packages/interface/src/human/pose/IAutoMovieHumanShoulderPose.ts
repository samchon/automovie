/**
 * Glenohumeral joint, degrees. The bounds are the clinical shoulder-complex
 * ranges, which include the girdle's share; girdle fields add on top, so
 * combined poses can exceed what a person reaches.
 */
export interface IAutoMovieHumanShoulderPose {
  /**
   * Forward elevation 170.4 (measured), extension 60 (AAOS). Schema
   * constraints: Minimum: -60; Maximum: 170.4; retained by Human's schema
   * refinement.
   */
  flexion?: number;

  /**
   * Sideways elevation 180, adduction across the body 40 (AAOS). Schema
   * constraints: Minimum: -40; Maximum: 180; retained by Human's schema
   * refinement.
   */
  abduction?: number;

  /**
   * External rotation 90, internal rotation 70 (recalled, Greene and Heckman
   * 1994). Schema constraints: Minimum: -70; Maximum: 90; retained by Human's
   * schema refinement.
   */
  rotation?: number;
}
