/**
 * Individually observed active range endpoints, separate from a requested
 * expression. Clinical jaw examination measures maximum unassisted
 * interincisal opening, protrusion and left/right laterotrusion from the
 * closed reference (https://pmc.ncbi.nlm.nih.gov/articles/PMC8235157/;
 * https://pmc.ncbi.nlm.nih.gov/articles/PMC4085221/). The incisal measure
 * requires documented dental or prosthetic edges. Ocular duction testing
 * separately measures adduction, abduction, elevation and depression in each
 * eye; the 261-subject sample found directional and age differences rather
 * than one universal angle (https://pmc.ncbi.nlm.nih.gov/articles/PMC6707237/).
 * These maxima may be unobserved. They are individual admission witnesses,
 * never target expressions or proof that their simultaneous extreme values
 * are mechanically attainable. Neither cohort mean nor source-basis morph
 * endpoint is a default range for an individual.
 *
 * @publicUnconsumed createHumanFaceAnatomicalResolver: Motion capacity awaits a coupled joint, gaze and contact validator for requested performance.
 * @author Samchon
 */
export interface IAutoMovieHumanFaceMotionCapacityParameters {
  /** Active mandibular capacities measured from the declared jaw reference. */
  jaw?: {
    /** Maximum unassisted midline interincisal opening in mm. */
    maximumInterincisalOpeningMm?: number;
    /** Maximum anterior mandibular protrusion beyond overjet, mm. */
    maximumProtrusionMm?: number;
    /** Maximum anatomical-left laterotrusion, mm. */
    maximumLeftExcursionMm?: number;
    /** Maximum anatomical-right laterotrusion, mm. */
    maximumRightExcursionMm?: number;
  };
  /** Independently measured left-eye ocular duction endpoints. */
  leftEye?: IAutoMovieHumanFaceMotionCapacityParameters.Eye;
  /** Independently measured right-eye ocular duction endpoints. */
  rightEye?: IAutoMovieHumanFaceMotionCapacityParameters.Eye;
}

export namespace IAutoMovieHumanFaceMotionCapacityParameters {
  /**
   * Monocular active gaze range from forward fixation, in degrees.
   * @author Samchon
   */
  export interface Eye {
    /** Maximum rotation toward the nose. */
    adductionDegrees?: number;
    /** Maximum rotation toward the temple. */
    abductionDegrees?: number;
    /** Maximum superior rotation. */
    elevationDegrees?: number;
    /** Maximum inferior rotation. */
    depressionDegrees?: number;
  }
}
