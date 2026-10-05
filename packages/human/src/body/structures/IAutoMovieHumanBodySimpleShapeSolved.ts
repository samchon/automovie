import type { IAutoMovieHumanBodySimpleShapeSolvedMass } from "./IAutoMovieHumanBodySimpleShapeSolvedMass";

/**
 * The parameters the simple tier solves by measurement: the stature channel
 * and the mass direction.
 *
 * @evidence contracts/common.md#principled-implementation The solved entries' fields, extracted from the table declaration without change.
 * @evidence contracts/common.md#clear-and-simple-design A channel and a direction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The table is data, audited and tuned as rows, never as code.
 * @evidence contracts/common.md#meaningful-documentation States what each entry solves.
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
export interface IAutoMovieHumanBodySimpleShapeSolved {
  /** The body channel stature is solved along. */
  stature: string;

  /** The mass direction. */
  mass: IAutoMovieHumanBodySimpleShapeSolvedMass;
}
