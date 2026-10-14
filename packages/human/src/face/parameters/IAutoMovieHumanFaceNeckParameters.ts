/**
 * Cervical outline immediately supporting the head in neutral head posture.
 * Calibrated frontal and lateral photographs in a craniofacial phenotyping
 * study measured the left/right neck width, anterior/posterior neck depth,
 * neck-point–cervical-point–menton angle, and a separate tape circumference
 * at the cricothyroid membrane as distinct quantities
 * (https://pmc.ncbi.nlm.nih.gov/articles/PMC2625322/). The angle reflects
 * both neck posture and submental tissue. It cannot be inferred from a cropped
 * face photograph, and the cited cohort does not set universal bounds.
 * These measurements describe a named neck section and cervicomental contour,
 * never a movable point or user-authored cross-section spline. A future
 * resolver must fix acquisition posture and the common section level before
 * combining them with mandibular and soft-tissue parameters.
 *
 * @evidence contracts/common.md#principled-implementation Calibrated photograph spans, tape circumference at the cricothyroid membrane and the profile angle remain separate neutral-posture observations. Current face rules keep them without a neck inverse; the person's infrathyroid body girth does not supply this differently located circumference.
 * @evidence contracts/common.md#clear-and-simple-design One acquisition-specific cervical record states the dimensions without constructing a neck section or mixing body measurement ownership into the face schema.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A cropped face, movable outline point or body circumference at another anatomical level cannot stand in for the named neck acquisition; no universal cohort bounds or shape conversion is supplied.
 * @evidence contracts/common.md#meaningful-documentation The comment supplies neutral posture, calibrated spans, section level and jaw/tissue coupling, while members name landmarks and millimetres/degrees.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interface runs no neck sectioning, inverse fit or posture calculation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The record coordinates no shared body/face measurements or cached inverse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This declaration acquires no neck geometry or photographic buffers; the containing observation document owns its values.
 *
 * @publicUnconsumed createHumanFaceAnatomicalResolver: The face-to-neck boundary has no validated landmark inverse for these measured dimensions.
 * @author Samchon
 */
export interface IAutoMovieHumanFaceNeckParameters {
  /** Left-to-right lneck–rneck calibrated photograph span, mm. */
  neckWidthMm?: number;

  /** Anterior-to-posterior aneck–pneck calibrated photograph span, mm. */
  neckDepthMm?: number;

  /** Direct tape circumference at the cricothyroid membrane, mm. */
  cricothyroidCircumferenceMm?: number;

  /** Profile neck point–cervical point–menton angle, degrees. */
  cervicomentalAngleDegrees?: number;
}
