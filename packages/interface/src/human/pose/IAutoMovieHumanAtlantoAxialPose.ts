/** Atlanto-axial joint, C1 on C2, degrees (recalled, White and Panjabi 1990). */
export interface IAutoMovieHumanAtlantoAxialPose {
  /**
   * Head rotation, 40 each way; positive turns the face toward the person's
   * left. Schema constraints: Minimum: -40; Maximum: 40; retained by Human's
   * schema refinement.
   */
  rotation?: number;
}
