/**
 * Seating dimensions of the lid margin on the ocular exterior, in metres.
 * `HUMAN_FACE_LID_SEAT` holds the authored values and their grounds.
 *
 * @evidence contracts/common.md#principled-implementation Three named lengths are the whole seating definition the lid frame applies.
 * @evidence contracts/common.md#clear-and-simple-design A flat record of three lengths.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No per-side or per-part field exists.
 * @evidence contracts/common.md#meaningful-documentation Each field states what it measures and from where.
 * @evidence contracts/modeling.md#spatial-conventions Metres; heights are measured along the outward normal of the ocular exterior, the bed along the margin.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Not a channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The constant that implements it answers for the boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation Not displayed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The constant that implements it carries the sources.
 * @evidenceExclude contracts/anatomy.md#permitted-range The constant that implements it carries the bound.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Not a public input.
 *
 * @author Samchon
 */
export interface IHumanFaceLidSeat {
  /** Height of the seated posterior lid margin above the ocular exterior. */
  posteriorClearanceMetres: number;

  /** Height of the innermost generated tissue face above the ocular exterior. */
  tearFilmMetres: number;

  /** Arc length from the medial commissure over which the margin leaves the globe. */
  medialBedMetres: number;
}
