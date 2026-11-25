/**
 * One eye opening measured between the Farkas landmarks, in millimetres.
 * Fissure length follows the [FaceBase inter-landmark
 * protocol](https://www.facebase.org/resources/human/facial_norms/notes/).
 */
export interface IAutoMovieHumanEye {
  /**
   * Euclidean three-dimensional distance from endocanthion to exocanthion.
   * Schema constraints: Minimum: 10; Maximum: 50; retained by Human's schema
   * refinement.
   */
  palpebralFissureLength: number;

  /**
   * Upper to lower lid margin at the pupil, eye open at rest. Schema
   * constraints: Minimum: 3; Maximum: 20; retained by Human's schema
   * refinement.
   */
  palpebralFissureHeight: number;
}
