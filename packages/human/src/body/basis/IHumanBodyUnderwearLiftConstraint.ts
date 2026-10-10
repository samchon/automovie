/**
 * One local strict orientation condition and its analytic Cartesian derivative.
 *
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
