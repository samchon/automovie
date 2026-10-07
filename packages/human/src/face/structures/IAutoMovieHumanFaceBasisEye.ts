import type { IAutoMovieHumanFaceBasisEyeGaze } from "./IAutoMovieHumanFaceBasisEyeGaze";

/**
 * One articulated globe: its attachment owner, its rotation centre landmark
 * and its gaze channels.
 *
 * @evidence contracts/common.md#principled-implementation One globe's fields, extracted from the articulation declaration without change.
 * @evidence contracts/common.md#clear-and-simple-design An owner, a centre and the gaze channels.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Gaze composes in list order as authored; nothing reorders it.
 * @evidence contracts/common.md#meaningful-documentation States each field and the composition order.
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
export interface IAutoMovieHumanFaceBasisEye {
  /** Attachment owner name, `leftEye` or `rightEye`. */
  id: string;

  /** Landmark id of the globe's rotation centre. */
  center: string;

  /**
   * Gaze channels; each rotates about `axis` by `degrees * weight` and
   * translates the globe by `translation * weight`, the small eccentric
   * shift the source authored with its lids (the ocular literature
   * reports a varying, eccentric centre of rotation; the preparation
   * records each channel's figure and bounds it).
   */
  gaze: IAutoMovieHumanFaceBasisEyeGaze[];
}
