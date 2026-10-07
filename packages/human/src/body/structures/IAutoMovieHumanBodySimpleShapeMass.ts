import type { IAutoMovieHumanBodySimpleShapeSiri } from "./IAutoMovieHumanBodySimpleShapeSiri";

/**
 * The simple tier's mass model: Siri's density equation and the body fat
 * fraction band the model is trusted over.
 *
 * @evidence contracts/common.md#principled-implementation The mass block's fields, extracted from the table declaration without change.
 * @evidence contracts/common.md#clear-and-simple-design An equation and a band.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The table is data, audited and tuned as rows, never as code.
 * @evidence contracts/common.md#meaningful-documentation States what each field is.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The record names channels the body basis declares; it defines none.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Fractions are dimensionless.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The record builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The record is not displayed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries the model's constants; the table documentation cites the model.
 * @evidenceExclude contracts/anatomy.md#permitted-range The record carries table values; admission of the simple tier owns the bounds.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The record is table data, not an input a document sets.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodySimpleShapeMass {
  /** Siri's density equation. */
  siri: IAutoMovieHumanBodySimpleShapeSiri;

  /** The trusted body fat fraction band, `[low, high]`. */
  fatFraction: [number, number];
}
