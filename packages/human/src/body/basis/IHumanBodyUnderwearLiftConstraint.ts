/**
 * One local strict orientation condition and its analytic Cartesian derivative.
 *
 * @evidence contracts/common.md#principled-implementation Located path/base/rounded orientation conditions pair original signed area and positive-normalized value with sorted sparse Cartesian derivatives.
 * @evidence contracts/common.md#clear-and-simple-design One row retains material triangle/corner/source-vertex correspondence beside its signed path witness and gradient.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A local affine derivative cannot certify global embedding or replace the final forward evaluator's strict-positive condition.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish square-meter area, dimensionless value, inverse-meter gradients and rounded interior path witnesses.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Constraint typing evaluates no quadratic path minimum or transported-normal derivative.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Sparse witness rows contain no cached derivative equivalence across candidate geometry.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Located row/gradient arrays own no native solver or global geometry-evaluation resource.
 * @author Samchon
 */
export interface IHumanBodyUnderwearLiftConstraint {
  /** Forward condition represented by this row; final evaluator remains authoritative. */
  kind: "path-minimum" | "base-outward" | "rounded-final";

  /** Raw signed area divided by the original positive face-area magnitude; admissible means strictly positive. */
  value: number;

  /** Actual signed area in square metres before normalization. */
  rawValue: number;

  /** Original component-local material triangle index. */
  triangle: number;

  /** Component-local vertex identifying this corner normal. */
  vertex: number;

  /** Original cut vertex preserved through the component correspondence. */
  sourceVertex: number;

  /** Corner index within the indexed triangle, zero through two. */
  corner: number;

  /** Signed path coordinate in metres; an interior witness is an exact quadratic minimizer rounded for the derivative. */
  offsetMetres: number;

  /** Sorted unique candidate Cartesian coordinate indices. */
  indices: number[];

  /** Analytic partial derivatives of value in inverse metres, paired with indices. */
  gradient: number[];
}
