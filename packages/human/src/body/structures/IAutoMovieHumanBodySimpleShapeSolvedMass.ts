import type { IAutoMovieHumanBodySimpleShapeTerm } from "./IAutoMovieHumanBodySimpleShapeTerm";

/**
 * The mass direction: the channels a kilogram is spread over, as term rows
 * whose products are the direction's coefficients. The mass is solved as one
 * scalar along the direction, over the envelope of the channel named `range`.
 *
 * @evidence contracts/common.md#principled-implementation The mass direction's fields, extracted from the table declaration without change.
 * @evidence contracts/common.md#clear-and-simple-design A range channel and the direction rows.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The table is data, audited and tuned as rows, never as code.
 * @evidence contracts/common.md#meaningful-documentation States how the direction and its bound are used.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The record names channels the body basis declares; it defines none.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The record holds channel names and dimensionless coefficients, no coordinate.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The record builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The record is not displayed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The simple-shape table documentation cites each model this record belongs to.
 * @evidenceExclude contracts/anatomy.md#permitted-range The record carries table values; admission of the simple tier owns the bounds.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The record is table data, not an input a document sets.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodySimpleShapeSolvedMass {
  /** The channel whose envelope bounds the mass scalar. */
  range: string;

  /** The direction's rows. */
  direction: IAutoMovieHumanBodySimpleShapeTerm[];
}
