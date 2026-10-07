import type { IAutoMovieHumanFaceBasisJawTranslation } from "./IAutoMovieHumanFaceBasisJawTranslation";

/**
 * The two sideways mandibular translations, one channel per side.
 *
 * @evidence contracts/common.md#principled-implementation The two sides' fields, extracted from the jaw declaration without change.
 * @evidence contracts/common.md#clear-and-simple-design Two side records.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Each side keeps its own channel; neither is mirrored from the other.
 * @evidence contracts/common.md#meaningful-documentation States what the record holds.
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
export interface IAutoMovieHumanFaceBasisJawLaterotrusion {
  /** Translation toward the subject's left. */
  left: IAutoMovieHumanFaceBasisJawTranslation;
  /** Translation toward the subject's right. */
  right: IAutoMovieHumanFaceBasisJawTranslation;
}
