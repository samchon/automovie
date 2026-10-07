/**
 * The shape-dependent joint points of a face basis: their ids, rest positions
 * and sparse endpoint rows (`IAutoMovieHumanFaceBasis.landmarks`).
 *
 * @evidence contracts/common.md#principled-implementation The joint points' fields, extracted from the basis declaration without change.
 * @evidence contracts/common.md#clear-and-simple-design Ids, positions and sparse rows.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Rows are authored per endpoint; nothing interpolates a missing one.
 * @evidence contracts/common.md#meaningful-documentation States each field's layout.
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
export interface IAutoMovieHumanFaceBasisLandmarks {
  /** Landmark names, in row order. */
  ids: string[];

  /** Flat XYZ per landmark, in the basis frame. */
  positions: number[];

  /** Sparse rows per endpoint name, strictly increasing by landmark. */
  targets: Record<string, number[]>;
}
