import type { IHumanFaceLidSeat } from "./structures/IHumanFaceLidSeat";

/**
 * Authored seating dimensions of the lid margin on the ocular exterior.
 *
 * `posteriorClearanceMetres` (0.1 mm) is the height at which the posterior
 * lid margin is seated pointwise on the analytic exterior. No chord-error
 * allowance is added to this value. It is authored: small against the lid and the globe, and
 * large against Float32 rounding at head scale. A tear film lies between lid
 * and globe; the only figure read is a review statement of about 7
 * micrometres (Ozkan and Utine 2025, Med Hypothesis Discov Innov Ophthalmol
 * 14(3):60), which is not a measurement of the lid-to-globe gap. No read
 * primary source measures that gap, so it is unknown and the value is not a
 * physiological clearance.
 *
 * `tearFilmMetres` (7 micrometres) is the height of the innermost generated
 * tissue face above the exterior, from the same review statement. It is a
 * conventional value used as a construction floor.
 *
 * `medialBedMetres` (4 mm) is the arc length from the medial commissure over
 * which the margin leaves the globe. It is authored: no read primary source
 * gives caruncle or plica dimensions. A registered medial bed on the source
 * cage replaces it when present.
 *
 * The source publisher uses the same record to re-author the neutral lid
 * cage, so the source and the runtime frame share one seating definition.
 *
 * @evidence contracts/common.md#principled-implementation One authored seating height is shared by source and runtime; actual facet deviation remains separate from that pointwise construction value.
 * @evidence contracts/common.md#clear-and-simple-design One constant record owns the three seating dimensions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The values are properties of the lid frame, not of a subject, a document or a refused part.
 * @evidence contracts/common.md#meaningful-documentation Gives each value, its kind, its bound or source, and what is unknown.
 * @evidence contracts/modeling.md#spatial-conventions Metres.
 * @evidence contracts/modeling.md#shared-boundaries The lid margin and the ocular exterior meet at this height; the same value seats the skin and starts the wet margin.
 * @evidence contracts/anatomy.md#anatomical-source Authored and conventional values with their one read review source; the lid-to-globe gap and the medial bed length are stated as unknown.
 * @evidence contracts/anatomy.md#permitted-range Actual emitted-hull contact admission checks the seated geometry without increasing this authored clearance by a tessellation bound.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Not a channel; a fixed property of the frame.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive.
 * @evidenceExclude contracts/modeling.md#rendered-observation The lid frame owner owns the observed result.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Not a public input.
 */
export const HUMAN_FACE_LID_SEAT: IHumanFaceLidSeat = {
  posteriorClearanceMetres: 0.0001,
  tearFilmMetres: 0.000007,
  medialBedMetres: 0.004,
};
