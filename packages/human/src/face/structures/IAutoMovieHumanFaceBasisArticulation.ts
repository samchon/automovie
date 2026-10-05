import type { IAutoMovieHumanFaceBasisEye } from "./IAutoMovieHumanFaceBasisEye";
import type { IAutoMovieHumanFaceBasisJaw } from "./IAutoMovieHumanFaceBasisJaw";

/**
 * The articulated performance of a face basis: one mandible and two globes
 * (`IAutoMovieHumanFaceBasis.articulation` states the model and its sources).
 *
 * @evidence contracts/common.md#principled-implementation The articulation's two owners, extracted from the basis declaration without change.
 * @evidence contracts/common.md#clear-and-simple-design One jaw and the eyes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Omission keeps a linear basis; nothing synthesizes an articulation.
 * @evidence contracts/common.md#meaningful-documentation Points to the model and sources the basis documents.
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
export interface IAutoMovieHumanFaceBasisArticulation {
  /** The mandible. */
  jaw: IAutoMovieHumanFaceBasisJaw;

  /** The globes, `leftEye` and `rightEye`. */
  eyes: IAutoMovieHumanFaceBasisEye[];
}
