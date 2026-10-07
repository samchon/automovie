/**
 * Authored age ramp for the simple-shape model's training contribution.
 * The factor is zero before `startAgeYears`, one from `endAgeYears` and
 * linear between, with both endpoints interpolated over sex. This is the
 * table owner's numerical bridge, not a measurement of an individual's
 * capacity or evidence that training produces no muscle before an endpoint.
 *
 * @evidence contracts/common.md#principled-implementation The maturity block's fields, extracted from the table declaration without change.
 * @evidence contracts/common.md#clear-and-simple-design Two curves over sex.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The table is data, audited and tuned as rows, never as code.
 * @evidence contracts/common.md#meaningful-documentation States the ramp the curves define.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The record names channels the body basis declares; it defines none.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Years over a dimensionless sex coordinate; no spatial coordinate.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The record builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The record is not displayed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The simple-shape table documentation cites each model this record belongs to.
 * @evidenceExclude contracts/anatomy.md#permitted-range The record carries table values; admission of the simple tier owns the bounds.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The record is table data, not an input a document sets.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodySimpleShapeMaturity {
  /** Age in years at which the ramp starts, as `[sex, years]` points. */
  startAgeYears: [number, number][];

  /** Age in years at which the ramp ends, as `[sex, years]` points. */
  endAgeYears: [number, number][];
}
