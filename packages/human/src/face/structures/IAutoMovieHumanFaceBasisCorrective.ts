import type { IAutoMovieHumanFaceBasisCorrectiveInput } from "./IAutoMovieHumanFaceBasisCorrectiveInput";

/**
 * One combination corrective of a face basis: the driving sides whose product
 * activates it, its authored gain and the endpoint it applies
 * (`IAutoMovieHumanFaceBasis.correctives` explains the activation).
 *
 * @evidence contracts/common.md#principled-implementation One corrective's fields, extracted from the basis declaration without change.
 * @evidence contracts/common.md#clear-and-simple-design An id, the driving sides, a gain and an endpoint.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The corrective applies an authored endpoint; nothing infers one.
 * @evidence contracts/common.md#meaningful-documentation States each field and points to the activation the basis documents.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The record holds names and dimensionless weights, no coordinate.
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
export interface IAutoMovieHumanFaceBasisCorrective {
  /** Name unique within this basis, distinct from every channel id. */
  id: string;

  /**
   * The driving sides. Each names a channel and which of its two endpoints
   * this corrective answers for, because a signed channel reaches two
   * different faces and a combination of one is not a combination of the
   * other.
   */
  inputs: IAutoMovieHumanFaceBasisCorrectiveInput[];

  /** Authored gain in (0,1]; the product of a rig row's authored weights. */
  weight: number;

  /** Endpoint name, resolved in each surface's targets like any other. */
  target: string;
}
