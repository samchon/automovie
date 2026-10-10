/**
 * Individually observed active range endpoints, separate from a requested
 * expression. Clinical jaw examination measures maximum unassisted
 * interincisal opening, protrusion and left/right laterotrusion from the
 * closed reference (https://pmc.ncbi.nlm.nih.gov/articles/PMC8235157/;
 * https://pmc.ncbi.nlm.nih.gov/articles/PMC4085221/). The former study records
 * the raw maximum interincisal gap without positive-overbite correction,
 * while protrusion includes initial overjet and laterotrusion corrects initial
 * midline deviation. The latter is a neutral-craniocervical ROM reliability
 * study whose protrusion protocol combines initial and final incisal positions;
 * it is not the DC/TMD protocol publication. These fields retain raw opening
 * and reference-relative protrusive/lateral excursion as distinct quantities.
 * The incisal measure
 * requires documented dental or prosthetic edges. Ocular duction testing
 * separately measures adduction, abduction, elevation and depression in each
 * eye; the 261-subject sample found directional and age differences rather
 * than one universal angle (https://pmc.ncbi.nlm.nih.gov/articles/PMC6707237/).
 * These maxima may be unobserved. They are individual admission witnesses,
 * never target expressions or proof that their simultaneous extreme values
 * are mechanically attainable. Neither cohort mean nor source-basis morph
 * endpoint is a default range for an individual.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceMotionCapacityParameters {
  /** Active mandibular capacities measured from the declared jaw reference. */
  jaw?: IAutoMovieHumanFaceMotionCapacityParameters.Jaw;
  /** Independently measured left-eye ocular duction endpoints. */
  leftEye?: IAutoMovieHumanFaceMotionCapacityParameters.Eye;
  /** Independently measured right-eye ocular duction endpoints. */
  rightEye?: IAutoMovieHumanFaceMotionCapacityParameters.Eye;
}

export namespace IAutoMovieHumanFaceMotionCapacityParameters {
  /**
   * Active mandibular capacities measured from the declared jaw reference, in
   * millimetres at the midline incisal edges.
   *
   * @author Samchon
   */
  export interface Jaw {
    /** Maximum unassisted raw midline incisal gap in mm, without adding positive overbite. */
    maximumInterincisalOpeningMm?: number;

    /** Maximum anterior incisal excursion from closed reference, including initial overjet, mm. */
    maximumProtrusionMm?: number;

    /** Maximum anatomical-left laterotrusion, mm. */
    maximumLeftExcursionMm?: number;

    /** Maximum anatomical-right laterotrusion, mm. */
    maximumRightExcursionMm?: number;
  }

  /**
   * Monocular active gaze range from forward fixation, in degrees.
   *
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
