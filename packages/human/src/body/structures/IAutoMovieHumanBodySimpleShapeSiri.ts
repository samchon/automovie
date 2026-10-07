/**
 * Siri's two-compartment density model as the table stores it: body fat
 * fraction = numerator / density − offset.
 *
 * @evidence contracts/common.md#principled-implementation The two constants of one equation, extracted from the table declaration without change.
 * @evidence contracts/common.md#clear-and-simple-design Two numbers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The table is data, audited and tuned as rows, never as code.
 * @evidence contracts/common.md#meaningful-documentation States the equation they belong to.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The record names channels the body basis declares; it defines none.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The constants are dimensionless coefficients of a density equation.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The record builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The record is not displayed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries Siri's constants; the table documentation cites the model.
 * @evidenceExclude contracts/anatomy.md#permitted-range The record carries table values; admission of the simple tier owns the bounds.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The record is table data, not an input a document sets.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodySimpleShapeSiri {
  /** The numerator of Siri's equation. */
  numerator: number;

  /** The offset of Siri's equation. */
  offset: number;
}
