import type { AutoMovieHumanBodySimpleParameter } from "./AutoMovieHumanBodySimpleParameter";

/**
 * One piecewise-linear curve of a simple-tier term row: the parameter it reads
 * and its points. The curve holds its end values outside its points.
 *
 * @evidence contracts/common.md#principled-implementation A curve is one factor of a term row's product, extracted from the table declaration without change.
 * @evidence contracts/common.md#clear-and-simple-design A parameter and its points.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The table is data, audited and tuned as rows, never as code.
 * @evidence contracts/common.md#meaningful-documentation States what the curve reads and how it extends past its points.
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
export interface IAutoMovieHumanBodySimpleShapeCurve {
  /** The simple or derived parameter the curve reads. */
  parameter: AutoMovieHumanBodySimpleParameter;

  /** `[parameter value, factor]` points, increasing by parameter value. */
  points: [number, number][];
}
