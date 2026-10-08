/**
 * One local strict orientation condition and its analytic Cartesian derivative.
 *
 * @evidence contracts/common.md#principled-implementation One scalar value pairs a located corner condition with sorted Cartesian indices and equally ordered inverse-metre derivatives; original positive face area supplies its dimensionless normalization.
 * @evidence contracts/common.md#clear-and-simple-design One row keeps its raw area, normalized value, path witness and source correspondence together for QP assembly and raw reporting.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The strict positive condition is retained independently of the solver's approximation; the row neither changes the offset nor certifies an accepted candidate.
 * @evidence contracts/common.md#meaningful-documentation Documents the sign, raw and derivative units, finite path witness, and parallel sparse-array meaning.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Numerical garment data defines no independent part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Carries existing material values without adding an authoring trait.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Computes no new render primitive.
 * @evidence contracts/modeling.md#spatial-conventions rawValue is square metres, value is dimensionless, offsetMetres is signed metres, and gradient differentiates posed-skin metre coordinates.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Retains caller-owned incidence and defines no new geometric join.
 * @evidenceExclude contracts/modeling.md#rendered-observation The actual garment emitter owns rendered verification; local derivatives establish no appearance.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Introduces no anatomical quantity or measured range.
 * @evidenceExclude contracts/anatomy.md#permitted-range The anatomical and field owners retain admission; this operation measures only local orientation.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Internal candidate coordinates are not a public sculpting channel.
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
