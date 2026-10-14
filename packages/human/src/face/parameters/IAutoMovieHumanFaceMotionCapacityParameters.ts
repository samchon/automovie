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
 * @evidence contracts/common.md#principled-implementation Individually observed jaw and monocular directional maxima remain capacity witnesses, separately from performed pose. assertHumanFaceJawCapacity compares the document's own available incisal readings without clamping; ocular duction-to-gaze admission remains an observation-rule gap.
 * @evidence contracts/common.md#clear-and-simple-design One capacity record separates a Jaw owner and independent Eye endpoints rather than imposing a universal range box on all expressions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Cohort means and morph endpoints do not become individual defaults, and independent maxima do not certify simultaneous mechanical attainability. These number types do not validate biological ranges themselves.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes raw opening, reference-relative excursions, dental-edge acquisition, independent ocular directions and unknown endpoints from requested expressions.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interface performs no motion solve or capacity comparison; the admission operation owns those algorithms.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The witness record defines no repeated pose evaluation or shared clinical endpoint cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No jaw rig, examination task or eye instrument is acquired by this type; the document owns optional maxima.
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
   * @evidence contracts/common.md#principled-implementation Raw unassisted incisal gap and closed-reference anterior/left/right excursions retain distinct millimetre measurements. The capacity consumer uses matching current-document readings, refuses unavailable ones and allows only its stated half-readout rounding margin rather than changing a requested pose.
   * @evidence contracts/common.md#clear-and-simple-design Four independently optional jaw maxima keep opening and signed lateral directions visible without a universal angular hinge limit.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Opening adds no positive overbite, protrusion retains initial overjet and lateral excursion corrects initial midline deviation; missing maxima do not create default bounds or authorize simultaneous extremes.
   * @evidence contracts/common.md#meaningful-documentation Each member identifies raw versus reference-relative acquisition, anatomical direction and millimetres, with the dental-edge premise in the parent comment.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This interface executes no incisal read or numeric capacity check.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Jaw maxima define no cached geometric reading or repeated comparison coordinator.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type allocates no jaw mesh or examination resource; observations belong to the personal document.
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
   * @evidence contracts/common.md#principled-implementation Independent adduction, abduction, elevation and depression retain monocular directional observations from forward fixation; current rules keep these records without a physiological duction-to-expression admission.
   * @evidence contracts/common.md#clear-and-simple-design A reusable four-direction Eye record lets the parent assign separate anatomical left/right capacity.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts One cohort mean or rig angle does not stand for all four directions or both eyes, and omitted endpoints stay unobserved rather than receiving defaults.
   * @evidence contracts/common.md#meaningful-documentation The comment states monocular forward fixation and degrees; members define nasal, temporal, superior and inferior directions.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The endpoint type performs no ocular rotation or measurement strategy.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work It owns no shared duction acquisition or computed gaze cache.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This declaration acquires no globe or instrument handles; its parent record owns optional endpoint scalars.
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
