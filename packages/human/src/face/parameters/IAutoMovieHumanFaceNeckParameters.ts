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
