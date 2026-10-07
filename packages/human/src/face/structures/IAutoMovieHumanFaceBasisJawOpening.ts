/**
 * The jaw opening: the channel that drives it, the rotation it reaches at
 * weight one and the mandibular translation coupled linearly with the angle.
 *
 * @evidence contracts/common.md#principled-implementation The opening's fields, extracted from the jaw declaration without change.
 * @evidence contracts/common.md#clear-and-simple-design A channel, an angle and a coupled translation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The coupling is the authored linear one the basis documents, not a fitted path.
 * @evidence contracts/common.md#meaningful-documentation States units and the coupling.
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
export interface IAutoMovieHumanFaceBasisJawOpening {
  /** The expression channel that opens the jaw. */
  channel: string;

  /** Rotation at weight one, in degrees. */
  degrees: number;

  /** Mandibular translation at weight one, in metres, coupled linearly with the angle. */
  translation: [number, number, number];
}
