/**
 * The channels the identity parameters are projected back from: each is read
 * through the inverse of its first term row, after the other rows naming that
 * channel are removed.
 *
 * @evidence contracts/common.md#principled-implementation Names the projection's channels, extracted from the table declaration without change.
 * @evidence contracts/common.md#clear-and-simple-design Three channel names.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The table is data, audited and tuned as rows, never as code.
 * @evidence contracts/common.md#meaningful-documentation States how each parameter is read back.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The record names channels the body basis declares; it defines none.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The record names channels; it holds no coordinate.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The record builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The record is not displayed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The simple-shape table documentation cites each model this record belongs to.
 * @evidenceExclude contracts/anatomy.md#permitted-range The record carries table values; admission of the simple tier owns the bounds.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The record is table data, not an input a document sets.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodySimpleShapeIdentity {
  /** The channel `sex` is read from. */
  sex: string;

  /** The channel `ageYears` is read from. */
  ageYears: string;

  /** The channel `muscle` is read from. */
  muscle: string;
}
