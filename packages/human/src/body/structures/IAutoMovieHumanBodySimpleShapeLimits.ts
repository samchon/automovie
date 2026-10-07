/**
 * The inclusive envelope of each simple parameter, the optional ones included.
 *
 * @evidence contracts/common.md#principled-implementation The envelope is one record per parameter, extracted from the table declaration without change.
 * @evidence contracts/common.md#clear-and-simple-design One interval per parameter.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The table is data, audited and tuned as rows, never as code.
 * @evidence contracts/common.md#meaningful-documentation States that every interval is inclusive.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The record names channels the body basis declares; it defines none.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Each interval is in the parameter's own unit (metres, kilograms, years or dimensionless).
 * @evidenceExclude contracts/modeling.md#shared-boundaries The record builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The record is not displayed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The simple-shape table documentation cites each model this record belongs to.
 * @evidenceExclude contracts/anatomy.md#permitted-range The record carries table values; admission of the simple tier owns the bounds.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The record is table data, not an input a document sets.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodySimpleShapeLimits {
  /** Inclusive envelope of `sex`. */
  sex: [number, number];

  /** Inclusive envelope of `ageYears`. */
  ageYears: [number, number];

  /** Inclusive envelope of `statureMetres`. */
  statureMetres: [number, number];

  /** Inclusive envelope of `massKilograms`. */
  massKilograms: [number, number];

  /** Inclusive envelope of `muscle`. */
  muscle: [number, number];

  /** Inclusive envelope of `waistMetres`. */
  waistMetres: [number, number];

  /** Inclusive envelope of `hipsMetres`. */
  hipsMetres: [number, number];

  /** Inclusive envelope of `bustMetres`. */
  bustMetres: [number, number];

  /** Inclusive envelope of `shoulderMetres`. */
  shoulderMetres: [number, number];

  /** Inclusive envelope of `thighMetres`. */
  thighMetres: [number, number];

  /** Inclusive envelope of `upperArmMetres`. */
  upperArmMetres: [number, number];

  /** Inclusive envelope of `calfMetres`. */
  calfMetres: [number, number];
}
