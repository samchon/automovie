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
 * @evidence contracts/common.md#principled-implementation The motion capacity record is a named observation record admitted field by field by the face resolver.
 * @evidence contracts/common.md#clear-and-simple-design The motion capacity record is one named record replacing an anonymous shape.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Omission means unknown; no population mean or default fills a field.
 * @evidence contracts/common.md#meaningful-documentation States each field's protocol, unit and owner beside it.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record names no emitted part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Observations are not shaping channels; only measurement targets move channels.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Each nested owner states its own units and frame.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The record builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The editor shows the comparison readings.
 * @evidence contracts/anatomy.md#anatomical-source Clinical jaw examination measures these maxima from the closed reference; the face resolver checks the posed incisal readings against them.
 * @evidence contracts/anatomy.md#permitted-range The face resolver refuses by name a value the basis cannot represent.
 * @evidence contracts/anatomy.md#parametric-authority Named anatomical quantities enter, never vertices, curves or proxy shapes.
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
   * @evidence contracts/common.md#principled-implementation The jaw capacity record is a named observation record admitted field by field by the face resolver.
   * @evidence contracts/common.md#clear-and-simple-design The jaw capacity record is one named record replacing an anonymous shape.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Omission means unknown; no population mean or default fills a field.
   * @evidence contracts/common.md#meaningful-documentation States each field's protocol, unit and owner beside it.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record names no emitted part.
   * @evidenceExclude contracts/modeling.md#parameter-channels Observations are not shaping channels; only measurement targets move channels.
   * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no geometry.
   * @evidenceExclude contracts/modeling.md#spatial-conventions Each nested owner states its own units and frame.
   * @evidenceExclude contracts/modeling.md#shared-boundaries The record builds no boundary.
   * @evidenceExclude contracts/modeling.md#rendered-observation The editor shows the comparison readings.
   * @evidence contracts/anatomy.md#anatomical-source Clinical jaw examination measures these maxima from the closed reference; the face resolver checks the posed incisal readings against them.
   * @evidence contracts/anatomy.md#permitted-range The face resolver refuses by name a value the basis cannot represent.
   * @evidence contracts/anatomy.md#parametric-authority Named anatomical quantities enter, never vertices, curves or proxy shapes.
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
   * @evidence contracts/common.md#principled-implementation The ocular duction record is a named observation record admitted field by field by the face resolver.
   * @evidence contracts/common.md#clear-and-simple-design The ocular duction record is one named record replacing an anonymous shape.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Omission means unknown; no population mean or default fills a field.
   * @evidence contracts/common.md#meaningful-documentation States each field's protocol, unit and owner beside it.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record names no emitted part.
   * @evidenceExclude contracts/modeling.md#parameter-channels Observations are not shaping channels; only measurement targets move channels.
   * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no geometry.
   * @evidenceExclude contracts/modeling.md#spatial-conventions Each nested owner states its own units and frame.
   * @evidenceExclude contracts/modeling.md#shared-boundaries The record builds no boundary.
   * @evidenceExclude contracts/modeling.md#rendered-observation The editor shows the comparison readings.
   * @evidence contracts/anatomy.md#anatomical-source Ocular duction testing measures each direction per eye (261-subject sample).
   * @evidence contracts/anatomy.md#permitted-range The face resolver refuses by name a value the basis cannot represent.
   * @evidence contracts/anatomy.md#parametric-authority Named anatomical quantities enter, never vertices, curves or proxy shapes.
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
