/**
 * A channel-driven translation of the whole mandible: protrusion, or one side
 * of laterotrusion.
 *
 * @evidence contracts/common.md#principled-implementation One record serves protrusion and both laterotrusion sides, which share one shape.
 * @evidence contracts/common.md#clear-and-simple-design A channel and a translation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The translation is authored; nothing extrapolates it.
 * @evidence contracts/common.md#meaningful-documentation States the unit and the two uses.
 * @evidence contracts/modeling.md#spatial-conventions Metres in the basis head frame, right-handed and Y-up.
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
export interface IAutoMovieHumanFaceBasisJawTranslation {
  /** The expression channel that drives this translation. */
  channel: string;

  /** Mandibular translation at weight one, in metres. */
  translation: [number, number, number];
}
