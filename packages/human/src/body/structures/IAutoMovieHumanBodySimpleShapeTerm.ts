import type { IAutoMovieHumanBodySimpleShapeCurve } from "./IAutoMovieHumanBodySimpleShapeCurve";

/**
 * One simple-tier term row: a channel, a gain and the curves whose product
 * scales it. Rows naming the same channel add. The mass direction's rows
 * have the same form, their products being the direction's coefficients.
 *
 * @evidence contracts/common.md#principled-implementation Terms and the mass direction share one row form, extracted from the table declaration without change.
 * @evidence contracts/common.md#clear-and-simple-design A channel, a gain and its curves.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The table is data, audited and tuned as rows, never as code.
 * @evidence contracts/common.md#meaningful-documentation States the row's sum and product rule and its two uses.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The record names channels the body basis declares; it defines none.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The record holds dimensionless table values and SI scalars, no coordinate.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The record builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The record is not displayed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The simple-shape table documentation cites each model this record belongs to.
 * @evidenceExclude contracts/anatomy.md#permitted-range The record carries table values; admission of the simple tier owns the bounds.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The record is table data, not an input a document sets.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodySimpleShapeTerm {
  /** The body channel the row writes. */
  channel: string;

  /** The row's scale. */
  gain: number;

  /** The curves whose product the gain scales. */
  curves: IAutoMovieHumanBodySimpleShapeCurve[];
}
