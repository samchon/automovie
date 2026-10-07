/**
 * One gaze channel of an eye: the authored unit axis it rotates about, the
 * degrees reached at weight one and the globe translation that accompanies it.
 *
 * @evidence contracts/common.md#principled-implementation One gaze channel's fields, extracted from the eye declaration without change.
 * @evidence contracts/common.md#clear-and-simple-design A channel, an axis, an angle and a translation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The translation is the source's authored shift, bounded by the preparation.
 * @evidence contracts/common.md#meaningful-documentation States the record's parts.
 * @evidence contracts/modeling.md#spatial-conventions Metres and degrees in the basis head frame, right-handed and Y-up.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The record names channels the basis declares; it defines none.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The record builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The record is not displayed; the evaluated face is observed by its owners.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The basis declaration cites the sources of the model this record belongs to.
 * @evidenceExclude contracts/anatomy.md#permitted-range Admission of the basis bounds these values; the record admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The record is basis data, not an input a document sets.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceBasisEyeGaze {
  /** The expression channel that drives this rotation. */
  channel: string;
  /** Authored unit rotation axis in the head frame. */
  axis: [number, number, number];
  /** Rotation at weight one, in degrees. */
  degrees: number;
  /** Globe translation at weight one, in metres. */
  translation: [number, number, number];
}
