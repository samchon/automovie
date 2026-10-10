import type { IAutoMovieQuadraticConstraintBasis } from "./IAutoMovieQuadraticConstraintBasis";

/**
 * Unadmitted equality-constrained candidate for a changing working set.
 * Native state and all original constraints remain with the polishing caller;
 * neither a basis nor this reduced solve establishes whole-problem KKT.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Separates original-coordinate numerical candidates from original full-row adoption.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Retains basis and null-curvature refusal beside original coordinate and multiplier maps.
 * @author Samchon
 */
export interface IAutoMovieQuadraticWorkingSetStep {
  /** Owned original-coordinate candidate, or null on a named refusal. */
  primal: number[] | null;

  /** Closest represented point on the working affine space, before minimization. */
  origin: number[] | null;

  /** Exact zero-curvature descent direction, requiring an original-row blocker. */
  flatDirection: number[] | null;

  /** Least-residual working-normal estimate paired only with origin; not an optimum dual. */
  normalDual: number[] | null;

  /** Multipliers paired with primal after objective minimization; null on a flat ray. */
  dual: number[] | null;

  /** Owned independent working affine coordinates. */
  basis: IAutoMovieQuadraticConstraintBasis;

  /** Observed objective factor rank on the working null space. */
  reducedRank: number;

  /** Named numerical/basis/flat-space inability, or null. */
  refusal: string | null;
}
